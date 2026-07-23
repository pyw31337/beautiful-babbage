#!/usr/bin/env python3
import os
import sys
import time
import argparse
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# Load environment variables
load_dotenv()

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("booking_checker.log", encoding="utf-8")
    ]
)

# Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.naver.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
RECEIVER_EMAIL = os.getenv("RECEIVER_EMAIL", "pyw213@naver.com")
BUSINESS_ID = os.getenv("BUSINESS_ID", "32333182")
TARGET_DATE = os.getenv("TARGET_DATE", "2026-08-15")
CHECK_INTERVAL_SECONDS = int(os.getenv("CHECK_INTERVAL_SECONDS", "900"))

BOOKING_URL = f"https://m.place.naver.com/restaurant/{BUSINESS_ID}/booking"

import urllib.request
import urllib.parse
import json

def send_email(subject, body):
    try:
        logging.info(f"Sending email notification to {RECEIVER_EMAIL} via FormSubmit...")
        url = f"https://formsubmit.co/ajax/{RECEIVER_EMAIL}"
        
        payload = {
            "_subject": subject,
            "name": "Naver Booking Monitor",
            "message": body.strip()
        }
        
        data = json.dumps(payload).encode('utf-8')
        
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={
                'Content-Type': 'application/json',
                'Origin': 'http://localhost',
                'Referer': 'http://localhost/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = response.read().decode('utf-8')
            res_json = json.loads(res_data)
            
            if res_json.get("success") == "true" or "needs Activation" in res_json.get("message", ""):
                logging.info(f"Notification sent successfully: {res_json.get('message')}")
                return True
            else:
                logging.error(f"FormSubmit error: {res_json.get('message')}")
                return False
                
    except Exception as e:
        logging.error(f"Failed to send notification: {e}")
        return False

def disable_github_workflow():
    github_token = os.getenv("GITHUB_TOKEN")
    github_repo = os.getenv("GITHUB_REPOSITORY")
    github_api_url = os.getenv("GITHUB_API_URL", "https://api.github.com")
    
    if not github_token or not github_repo:
        logging.info("Not running in GitHub Actions environment or GITHUB_TOKEN not provided. Skipping workflow disable.")
        return
        
    try:
        logging.info(f"Attempting to disable GitHub workflow 'monitor.yml' for {github_repo}...")
        url = f"{github_api_url}/repos/{github_repo}/actions/workflows/monitor.yml/disable"
        
        req = urllib.request.Request(
            url,
            headers={
                'Authorization': f'Bearer {github_token}',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Mozilla/5.0'
            },
            method='PUT'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            logging.info(f"Successfully disabled GitHub workflow. API status code: {status}")
    except Exception as e:
        logging.error(f"Failed to disable GitHub workflow: {e}")

def init_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1280,1024')
    # Use standard browser User-Agent
    options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Anti-bot arguments
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=options)
    
    # Hide the navigator.webdriver property via CDP
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': 'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'
    })
    
    return driver

def check_naver_booking(driver, dry_run=False):
    logging.info(f"Navigating to Naver Place Booking: {BOOKING_URL}")
    driver.get(BOOKING_URL)
    
    # Wait for page load
    time.sleep(5)
    
    # Create screenshots directory
    os.makedirs("screenshots", exist_ok=True)
    driver.save_screenshot("screenshots/step1_loaded.png")
    logging.info("Page loaded. Saved screenshot/step1_loaded.png")

    # Click the "실시간예약" card
    logging.info("Searching for '실시간예약' card...")
    elements = driver.find_elements(By.XPATH, "//*[contains(text(), '실시간예약') or contains(text(), '실시간 예약')]")
    
    clicked = False
    for el in elements:
        try:
            text = el.text.strip()
            if "실시간예약" in text or "실시간 예약" in text:
                logging.info(f"Found booking card element: '{text}'. Clicking...")
                # Scroll to it
                driver.execute_script("arguments[0].scrollIntoView(true);", el)
                time.sleep(1)
                el.click()
                clicked = True
                break
        except Exception as e:
            logging.warning(f"Failed to click card element: {e}")
            continue

    if not clicked:
        # Try JS click on elements
        for el in elements:
            try:
                text = el.text.strip()
                if "실시간예약" in text or "실시간 예약" in text:
                    driver.execute_script("arguments[0].click();", el)
                    clicked = True
                    break
            except:
                continue

    if not clicked:
        logging.error("Failed to find or click '실시간예약' card!")
        driver.save_screenshot("screenshots/error_no_card.png")
        return False

    time.sleep(5)
    driver.save_screenshot("screenshots/step2_calendar_loaded.png")
    logging.info("Calendar page loaded. Saved screenshot/step2_calendar_loaded.png")

    # Now navigate to target month
    target_year = TARGET_DATE.split("-")[0]  # "2026"
    target_month_num = int(TARGET_DATE.split("-")[1])  # 8
    target_month_str = f"{target_year}.{target_month_num}"  # "2026.8"

    logging.info(f"Target month: {target_month_str}")

    max_months_to_click = 6
    month_reached = False

    for click_attempt in range(max_months_to_click):
        # Save screenshot of current calendar state
        driver.save_screenshot(f"screenshots/step3_calendar_month_{click_attempt}.png")

        # Find month title header
        month_header_text = ""
        try:
            # Look for element containing "2026." or the target year
            month_header_el = driver.find_element(By.XPATH, f"//*[contains(text(), '{target_year}.')]")
            month_header_text = month_header_el.text.strip()
        except Exception as e:
            logging.warning(f"Error finding month header element: {e}")

        logging.info(f"Current calendar month header detected: '{month_header_text}'")

        if target_month_str in month_header_text:
            month_reached = True
            logging.info(f"Reached target month: {target_month_str}!")
            break

        # Click next month button
        next_button = None
        next_selectors = [
            "button.btn_next",
            "[class*='next']",
            "[class*='btn_next']",
            "button[aria-label*='다음']"
        ]
        for sel in next_selectors:
            try:
                btn = driver.find_element(By.CSS_SELECTOR, sel)
                if btn.is_displayed():
                    next_button = btn
                    break
            except:
                continue

        if next_button:
            logging.info("Clicking next month button...")
            try:
                driver.execute_script("arguments[0].click();", next_button)
                time.sleep(3)
            except Exception as click_err:
                logging.error(f"Failed to click next button: {click_err}")
                break
        else:
            logging.warning("Could not find next month button. Stopping navigation loop.")
            break

    if not month_reached:
        logging.error(f"Failed to reach target month: {target_month_str}")
        return False

    # Now check target day (e.g. "15")
    day_str = str(int(TARGET_DATE.split("-")[2]))  # "15"
    logging.info(f"Checking availability for date: {day_str}")

    available = False
    try:
        # Find span with class 'num' and exact text matching target day
        spans = driver.find_elements(By.XPATH, f"//span[@class='num' and text()='{day_str}']")
        if not spans:
            logging.error(f"No span element with text '{day_str}' found in the calendar.")
            return False

        # Get parent of the first matching span (the button/container)
        span_el = spans[0]
        parent_el = span_el.find_element(By.XPATH, "..")
        
        parent_class = parent_el.get_attribute("class") or ""
        parent_disabled = parent_el.get_attribute("disabled")
        parent_aria = parent_el.get_attribute("aria-disabled") or ""

        logging.info(f"Day Element: tag={parent_el.tag_name}, class='{parent_class}', disabled={parent_disabled}, aria-disabled='{parent_aria}'")

        # Determine if disabled
        is_disabled = False
        if "unselectable" in parent_class.lower() or "disabled" in parent_class.lower():
            is_disabled = True
        if parent_disabled is not None and parent_disabled != "false":
            is_disabled = True
        if parent_aria.lower() == "true":
            is_disabled = True

        if not is_disabled:
            available = True
            logging.info("Success! Date is selectable (available).")
        else:
            logging.info("Date is currently unselectable (disabled).")
    except Exception as e:
        logging.error(f"Error checking date element in calendar: {e}")

    # Save final screenshot
    driver.save_screenshot("screenshots/step4_target_date_check.png")

    if available:
        logging.info(f"SUCCESS: {TARGET_DATE} is AVAILABLE for booking!")
        email_subject = f"[알림] 애슐리퀸즈 한강공원점 {TARGET_DATE} 예약 가능!"
        email_body = f"""
[애슐리퀸즈 여의도한강공원점 예약 알림]

{TARGET_DATE} 예약이 가능해진 것으로 감지되었습니다!
지금 바로 아래 링크에서 예약을 진행해 주세요.

■ 예약 바로가기 링크:
{BOOKING_URL}

※ 이 메일은 자동 발송되었습니다.
"""
        send_email(email_subject, email_body)
        disable_github_workflow()
        return True
    else:
        logging.info(f"{TARGET_DATE} is currently NOT available.")
        if dry_run:
            logging.info("[Dry Run] Sending a test email to verify SMTP configuration.")
            test_subject = "[테스트] 애슐리퀸즈 예약 모니터링 테스트 메일"
            test_body = f"""
[예약 모니터링 시스템 테스트]

Naver 예약 모니터링 스크립트가 정상적으로 실행되었습니다.
현재 {TARGET_DATE} 예약은 '불가능' 상태입니다.

이 메일이 도착했다면 예약 알림 기능은 정상 작동하는 것입니다.
실제 예약이 열릴 시 새로운 링크와 함께 이메일이 발송됩니다.
"""
            send_email(test_subject, test_body)
        return False

def main():
    parser = argparse.ArgumentParser(description="Naver Booking Monitor for Ashley Queens Hangang")
    parser.add_argument("--dry-run", action="store_true", help="Run once, save screenshots, and send a test email")
    parser.add_argument("--loop", action="store_true", help="Run continuously with an interval specified in .env")
    args = parser.parse_args()

    driver = None
    try:
        driver = init_driver()
        
        if args.dry_run:
            logging.info("=== Running in DRY-RUN mode ===")
            check_naver_booking(driver, dry_run=True)
            logging.info("Dry-run check completed successfully.")
            
        elif args.loop:
            logging.info(f"=== Running in LOOP mode (Interval: {CHECK_INTERVAL_SECONDS}s) ===")
            while True:
                try:
                    success = check_naver_booking(driver, dry_run=False)
                    if success:
                        logging.info("Booking became available and email was sent. Stopping loop.")
                        break
                except Exception as loop_err:
                    logging.error(f"Error during check loop: {loop_err}")
                
                logging.info(f"Sleeping for {CHECK_INTERVAL_SECONDS} seconds...")
                time.sleep(CHECK_INTERVAL_SECONDS)
        else:
            # Default to single run check
            logging.info("=== Running single check ===")
            check_naver_booking(driver, dry_run=False)
            
    except Exception as e:
        logging.error(f"Fatal error in main execution: {e}", exc_info=True)
    finally:
        if driver:
            driver.quit()
            logging.info("Browser driver closed.")

if __name__ == "__main__":
    main()
