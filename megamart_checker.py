import os
import sys
import time
import logging
import argparse
import urllib.request
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("booking_checker.log", encoding="utf-8") # Append to same log file
    ]
)

# Configuration Variables
RECEIVER_EMAIL = os.getenv("RECEIVER_EMAIL", "pyw213@naver.com")
SEARCH_URL = "https://www.megamart.com/search/?text=%ED%95%9C%EC%9A%B0+%EB%93%B1%EC%8B%AC"
PRICE_THRESHOLD = 7000  # Alert if price is <= 7000 KRW

def send_email(subject, body, attachment_path=None):
    try:
        logging.info(f"Sending email notification to {RECEIVER_EMAIL} via FormSubmit...")
        url = f"https://formsubmit.co/ajax/{RECEIVER_EMAIL}"
        
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        parts = []
        
        def add_field(name, value):
            parts.append(f'--{boundary}'.encode('utf-8'))
            parts.append(f'Content-Disposition: form-data; name="{name}"\r\n'.encode('utf-8'))
            parts.append(value.encode('utf-8'))
            
        add_field("_subject", subject)
        add_field("name", "Megamart Price Monitor")
        add_field("message", body.strip())
        
        # Add file attachment if provided
        if attachment_path and os.path.exists(attachment_path):
            try:
                with open(attachment_path, 'rb') as f:
                    file_content = f.read()
                filename = os.path.basename(attachment_path)
                parts.append(f'--{boundary}'.encode('utf-8'))
                parts.append(f'Content-Disposition: form-data; name="attachment"; filename="{filename}"'.encode('utf-8'))
                parts.append(f'Content-Type: image/png\r\n'.encode('utf-8'))
                parts.append(file_content)
            except Exception as file_err:
                logging.error(f"Error reading attachment file: {file_err}")
                
        parts.append(f'--{boundary}--'.encode('utf-8'))
        body_data = b'\r\n'.join(parts)
        
        req = urllib.request.Request(
            url, 
            data=body_data, 
            headers={
                'Content-Type': f'multipart/form-data; boundary={boundary}',
                'Origin': 'http://localhost',
                'Referer': 'http://localhost/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
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

def init_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    options.add_argument('--disable-blink-features=AutomationControlled')
    
    # Exclude automation switch to avoid bot flags
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=options)
    
    # Hide automation webdriver property
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "const newProto = navigator.__proto__; delete newProto.webdriver; navigator.__proto__ = newProto;"
    })
    return driver

def save_price_history_and_plot(products):
    import csv
    from datetime import datetime
    
    os.makedirs("history", exist_ok=True)
    csv_path = "history/prices.csv"
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Append today's data
    file_exists = os.path.exists(csv_path)
    existing_entries = set()
    if file_exists:
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                for row in reader:
                    if len(row) >= 3:
                        existing_entries.add((row[0], row[1]))
        except Exception as e:
            logging.error(f"Error reading existing CSV: {e}")

    try:
        with open(csv_path, "a", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["date", "product_name", "price"])
            for name, price_per_100g, actual_price, weight in products:
                if (today_str, name) not in existing_entries:
                    writer.writerow([today_str, name, price_per_100g])
                    logging.info(f"Saved history: {today_str}, {name}, 100g당 {price_per_100g}원")
    except Exception as e:
        logging.error(f"Failed to write to CSV: {e}")
        return

    # Generate trend chart
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        
        history_data = {}
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 3:
                    date_val = datetime.strptime(row[0], "%Y-%m-%d")
                    name = row[1]
                    price = int(row[2])
                    if name not in history_data:
                        history_data[name] = {"dates": [], "prices": []}
                    history_data[name]["dates"].append(date_val)
                    history_data[name]["prices"].append(price)

        plt.figure(figsize=(10, 6))
        plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

        import platform
        system = platform.system()
        if system == 'Darwin':
            plt.rcParams['font.family'] = 'AppleGothic'
        elif system == 'Windows':
            plt.rcParams['font.family'] = 'Malgun Gothic'
        else:
            plt.rcParams['font.family'] = 'NanumGothic'
        plt.rcParams['axes.unicode_minus'] = False
        
        for name, data in history_data.items():
            sorted_pairs = sorted(zip(data["dates"], data["prices"]))
            sorted_dates, sorted_prices = zip(*sorted_pairs)
            
            short_name = name.replace(" (국내산) 100g", "").replace("등급 구이용", "")
            plt.plot(sorted_dates, sorted_prices, marker='o', linewidth=2, label=short_name)
            
        plt.title("Megamart Hanwoo Ribeye Price Trend (per 100g)", fontsize=14, fontweight='bold', pad=15)
        plt.xlabel("Date", fontsize=12)
        plt.ylabel("Price (KRW)", fontsize=12)
        
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
        plt.gca().xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(history_data)//10)))
        plt.gcf().autofmt_xdate()
        
        plt.axhline(y=PRICE_THRESHOLD, color='r', linestyle='--', alpha=0.7, label=f"Threshold ({PRICE_THRESHOLD:,}원)")
        plt.legend(loc="upper right", frameon=True, shadow=True)
        plt.tight_layout()
        
        chart_path = "history/price_trend.png"
        plt.savefig(chart_path, dpi=150)
        plt.close()
        logging.info(f"Price trend chart updated and saved to {chart_path}")
        
        update_readme(products, today_str)
        
    except Exception as plot_err:
        logging.error(f"Failed to generate price trend chart: {plot_err}")

def update_readme(products, today_str):
    try:
        readme_path = "README.md"
        latest_prices_str = "\n".join([
            f"- **{name}**: 100g당 {price_per_100g:,}원 (현재 판매가: {actual_price:,}원/{weight}g) (업데이트: {today_str})" 
            for name, price_per_100g, actual_price, weight in products
        ])
        
        content = f"""# Naver Booking & Megamart Price Monitor

이 저장소는 네이버 예약 및 메가마트 가격 감시 모니터링 시스템을 위한 자동화 저장소입니다.

---

## 🥩 메가마트 한우 등심 100g 가격 실시간 추이
* **설정 가격 기준**: 100g 당 **{PRICE_THRESHOLD:,}원 이하**일 때 이메일 알림 발송

### 📌 최근 수집된 가격
{latest_prices_str}

### 📈 가격 추이 그래프
![한우 등심 가격 추이](history/price_trend.png)

---

## 📅 네이버 예약 모니터링 (애슐리퀸즈 여의도한강공원점)
* **대상 일자**: 2026년 8월 15일 광복절
* **동작 방식**: 예약이 열리는 즉시 이메일 발송 후 감시가 자동으로 종료됩니다.
"""
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)
        logging.info("README.md updated with latest prices and chart.")
    except Exception as e:
        logging.error(f"Failed to update README.md: {e}")

def check_megamart_prices(driver, dry_run=False):
    logging.info(f"Navigating to Megamart Search: {SEARCH_URL}")
    driver.get(SEARCH_URL)
    
    # Wait for search elements to render
    time.sleep(5)
    
    # Take visual inspection screenshot
    os.makedirs("screenshots", exist_ok=True)
    driver.save_screenshot("screenshots/megamart_step1_loaded.png")
    logging.info("Page loaded. Saved screenshot/megamart_step1_loaded.png")
    
    # Parse items
    item_wrappers = driver.find_elements(By.CLASS_NAME, "item-wrapper")
    logging.info(f"Found {len(item_wrappers)} total items on the search page.")
    
    monitored_products = []
    cheap_products = []
    
    for item in item_wrappers:
        try:
            # Find title
            title_els = item.find_elements(By.CLASS_NAME, "title")
            if not title_els:
                continue
            title_text = title_els[0].text.strip()
            
            # Filter condition: must contain both "한우" and "등심", and "구이용"
            if "한우" in title_text and "등심" in title_text and "구이용" in title_text:
                # Find price
                price_els = item.find_elements(By.CSS_SELECTOR, ".current-price .number")
                if not price_els:
                    continue
                price_text = price_els[0].text.strip()
                
                # Convert to integer (e.g. "12,640" -> 12640)
                price_value = int(re.sub(r"[^\d]", "", price_text))
                
                # Parse weight from title to calculate price per 100g
                # Examples: "100g", "1kg", "1 kg", "600g"
                weight = 100 # default fallback
                weight_match = re.search(r"(\d+)\s*(g|kg)", title_text.lower())
                if weight_match:
                    val = int(weight_match.group(1))
                    unit = weight_match.group(2)
                    if unit == "kg":
                        weight = val * 1000
                    else:
                        weight = val
                
                # Calculate price per 100g
                price_per_100g = int((price_value / weight) * 100)
                
                # Store (title, price_per_100g, actual_price, weight)
                monitored_products.append((title_text, price_per_100g, price_value, weight))
                logging.info(f"Monitored item: '{title_text}' -> {price_value:,}원 ({weight}g) | 100g당 {price_per_100g:,}원")
                
                # Check threshold (<= 7000 KRW/100g)
                if price_per_100g <= PRICE_THRESHOLD:
                    cheap_products.append((title_text, price_per_100g, price_value, weight))
                    
        except Exception as item_err:
            logging.error(f"Error parsing item card: {item_err}")
            
    # Save final check screenshot
    driver.save_screenshot("screenshots/megamart_step2_check.png")
    
    # Log results
    logging.info(f"Total matching Hanwoo Ribeye 구이용 products: {len(monitored_products)}")
    
    # Save history and generate trend chart
    if monitored_products:
        save_price_history_and_plot(monitored_products)
        
    if cheap_products:
        logging.info(f"ALERT: Found {len(cheap_products)} products below {PRICE_THRESHOLD:,}원/100g threshold!")
        
        # Build alert email body
        product_list_str = "\n".join([
            f"- {name}: 100g당 {price_per_100g:,}원 (현재 판매가: {price:,}원/{weight}g)" 
            for name, price_per_100g, price, weight in cheap_products
        ])
        email_subject = f"[알림] 메가마트 한우 등심 가격 인하! (100g당 {PRICE_THRESHOLD:,}원 이하)"
        email_body = f"""
[메가마트 한우 등심 가격 인하 알림]

설정한 조건(100g 당 {PRICE_THRESHOLD:,}원 이하)을 만족하는 한우 등심 상품이 감지되었습니다!
지금 바로 할인 혜택을 확인하고 구매해 보세요.

■ 가격 인하 상품 목록:
{product_list_str}

■ 쇼핑몰 바로가기 링크:
{SEARCH_URL}

※ 이 메일은 자동 발송되었습니다.
"""
        send_email(email_subject, email_body, attachment_path="history/price_trend.png")
        return True
    else:
        logging.info(f"No products found below the {PRICE_THRESHOLD:,}원/100g threshold.")
        if dry_run:
            logging.info("[Dry Run] Sending test email with current prices.")
            product_list_str = "\n".join([
                f"- {name}: 100g당 {price_per_100g:,}원 (현재 판매가: {price:,}원/{weight}g)" 
                for name, price_per_100g, price, weight in monitored_products
            ])
            
            test_subject = "[테스트] 메가마트 한우 등심 가격 모니터링 테스트"
            test_body = f"""
[메가마트 한우 등심 모니터링 테스트 메일]

메가마트 가격 감시 스크립트가 정상적으로 동작하고 있습니다.

■ 현재 검색된 한우 등심 100g 상품 목록:
{product_list_str}

현재 가격은 설정한 기준({PRICE_THRESHOLD:,}원 이하)보다 높은 상태이므로, 실제 구매 알림 메일은 발송되지 않았습니다.
실제 가격이 {PRICE_THRESHOLD:,}원 이하로 떨어지면 구매 알림 이메일이 발송됩니다.

■ 쇼핑몰 바로가기 링크:
{SEARCH_URL}

※ 이 메일은 자동 발송되었습니다.
"""
            send_email(test_subject, test_body, attachment_path="history/price_trend.png")
        return False

def main():
    parser = argparse.ArgumentParser(description="Megamart Hanwoo Ribeye Price Monitor")
    parser.add_argument("--dry-run", action="store_true", help="Run once, save screenshots, and send a test email")
    args = parser.parse_args()

    driver = None
    try:
        driver = init_driver()
        check_megamart_prices(driver, dry_run=args.dry_run)
    except Exception as e:
        logging.error(f"Fatal error in Megamart price checker execution: {e}", exc_info=True)
    finally:
        if driver:
            driver.quit()
            logging.info("Browser driver closed.")

if __name__ == "__main__":
    main()
