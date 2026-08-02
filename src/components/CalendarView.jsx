import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { getContrastTextColor } from '../utils/colors';

const WEEKDAYS = [
  { name: '일', isSun: true },
  { name: '월' },
  { name: '화' },
  { name: '수' },
  { name: '목' },
  { name: '금' },
  { name: '토', isSat: true }
];

export default function CalendarView({ calendar, onSelectDate, selectedDate }) {
  // Default view date (current year/month or initial calendar data month)
  const [currentDate, setCurrentDate] = useState(() => {
    // If calendar has availabilities, pick the month of the first availability, or current date
    if (calendar?.availabilities?.length > 0) {
      const firstDate = new Date(calendar.availabilities[0].date);
      if (!isNaN(firstDate.getTime())) return firstDate;
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days grid logic
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const d = new Date(year, month - 1, dayNum);
    prevMonthDays.push({
      dateObj: d,
      dateStr: formatDateStr(d),
      dayNumber: dayNum,
      isCurrentMonth: false,
      dayOfWeek: d.getDay()
    });
  }

  // Current month days
  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    currentMonthDays.push({
      dateObj: d,
      dateStr: formatDateStr(d),
      dayNumber: i,
      isCurrentMonth: true,
      dayOfWeek: d.getDay()
    });
  }

  // Next month leading days to complete week rows (multiple of 7)
  const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysNeeded = (7 - (totalDaysSoFar % 7)) % 7;
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysNeeded; i++) {
    const d = new Date(year, month + 1, i);
    nextMonthDays.push({
      dateObj: d,
      dateStr: formatDateStr(d),
      dayNumber: i,
      isCurrentMonth: false,
      dayOfWeek: d.getDay()
    });
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Map participants & availabilities
  const participantsMap = (calendar?.participants || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const totalParticipantsCount = calendar?.participants?.length || 0;

  // Group availabilities by date string
  const availabilitiesByDate = (calendar?.availabilities || []).reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const todayStr = formatDateStr(new Date());

  return (
    <div className="calendar-card">
      {/* Month Navigation */}
      <div className="calendar-header-nav">
        <div className="calendar-month-title">
          <CalendarIcon size={24} style={{ color: 'var(--accent-primary)' }} />
          <span>{year}년 {month + 1}월</span>
        </div>

        <div className="calendar-nav-buttons">
          <button
            id="btn-today"
            className="btn btn-secondary"
            onClick={handleToday}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            오늘
          </button>
          <button
            id="btn-prev-month"
            className="btn btn-secondary btn-icon"
            onClick={handlePrevMonth}
            title="이전 달"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            id="btn-next-month"
            className="btn btn-secondary btn-icon"
            onClick={handleNextMonth}
            title="다음 달"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekday Grid Header */}
      <div className="weekday-grid">
        {WEEKDAYS.map((w, idx) => (
          <div
            key={idx}
            className={`weekday-label ${w.isSun ? 'sun' : ''} ${w.isSat ? 'sat' : ''}`}
          >
            {w.name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="days-grid">
        {allGridDays.map((dayItem, index) => {
          const dateEntries = availabilitiesByDate[dayItem.dateStr] || [];
          const isToday = dayItem.dateStr === todayStr;
          const isSelected = dayItem.dateStr === selectedDate;
          
          // Available participants list
          const availableParticipants = dateEntries
            .map(e => ({
              ...e,
              participant: participantsMap[e.participantId]
            }))
            .filter(e => e.participant);

          const availCount = availableParticipants.length;
          const isAllAvailable = totalParticipantsCount > 0 && availCount === totalParticipantsCount;
          const hasNotes = dateEntries.some(e => e.note && e.note.trim().length > 0);

          return (
            <div
              key={index}
              id={`day-cell-${dayItem.dateStr}`}
              className={`day-cell ${!dayItem.isCurrentMonth ? 'other-month' : ''} ${
                isToday ? 'today' : ''
              } ${isAllAvailable ? 'all-available' : ''} ${
                dayItem.dayOfWeek === 0 ? 'sun' : ''
              } ${dayItem.dayOfWeek === 6 ? 'sat' : ''}`}
              style={
                isSelected
                  ? { borderColor: '#8B5CF6', boxShadow: '0 0 0 2px #8B5CF6' }
                  : undefined
              }
              onClick={() => onSelectDate(dayItem.dateStr)}
            >
              <div className="day-number-header">
                <span className="day-number">{dayItem.dayNumber}</span>

                {isAllAvailable && (
                  <span className="all-match-badge" title="전원 참여 가능!">
                    <Sparkles size={10} />
                    전원
                  </span>
                )}
              </div>

              {/* Participant Color Badges */}
              <div className="badges-container">
                {availableParticipants.map((entry) => {
                  const p = entry.participant;
                  const textColor = getContrastTextColor(p.color);
                  return (
                    <span
                      key={entry.id || p.id}
                      className="participant-badge"
                      style={{
                        backgroundColor: p.color,
                        color: textColor
                      }}
                      title={`${p.name}${entry.note ? `: "${entry.note}"` : ''}`}
                    >
                      <span className="badge-dot" style={{ backgroundColor: textColor }} />
                      {p.name}
                    </span>
                  );
                })}
              </div>

              {/* Note indicator dot */}
              {hasNotes && !isAllAvailable && (
                <span className="note-indicator-dot" title="메모 작성됨" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
