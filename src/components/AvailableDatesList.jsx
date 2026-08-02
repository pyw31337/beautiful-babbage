import React from 'react';
import { Sparkles, CalendarCheck, Users, ChevronRight, MessageSquare } from 'lucide-react';
import { getContrastTextColor } from '../utils/colors';

export default function AvailableDatesList({ calendar, onSelectDate }) {
  if (!calendar) return null;

  const participants = calendar.participants || [];
  const totalCount = participants.length;
  const availabilities = calendar.availabilities || [];

  const participantsMap = participants.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  // Group entries by date
  const dateMap = availabilities.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  // Categorize dates
  const fullMatchDates = [];
  const partialMatchDates = [];

  Object.entries(dateMap).forEach(([dateStr, entries]) => {
    // Only count entries matching existing valid participants
    const validEntries = entries.filter(e => participantsMap[e.participantId]);
    const uniqueParticipants = new Set(validEntries.map(e => e.participantId));
    const availCount = uniqueParticipants.size;

    if (totalCount > 0 && availCount === totalCount) {
      fullMatchDates.push({ dateStr, entries: validEntries, count: availCount });
    } else if (availCount >= 2) {
      partialMatchDates.push({ dateStr, entries: validEntries, count: availCount });
    }
  });

  // Sort dates chronologically
  fullMatchDates.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  partialMatchDates.sort((a, b) => b.count - a.count || a.dateStr.localeCompare(b.dateStr));

  return (
    <div className="available-summary-card">
      <div className="summary-header">
        <div className="summary-title">
          <CalendarCheck size={22} style={{ color: '#10B981' }} />
          <span>모임 가능 날짜 분석 리스트</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          총 {participants.length}명 기준
        </span>
      </div>

      <div className="summary-grid">
        {/* Section 1: All Participants Available (100% Match) */}
        <div className="summary-section-box full-match">
          <div className="section-box-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
              <Sparkles size={18} />
              🎉 전원 참석 가능 날짜 ({fullMatchDates.length}일)
            </span>
            <span className="date-item-badge badge-full">100% 매칭</span>
          </div>

          {fullMatchDates.length === 0 ? (
            <div className="empty-state">
              아직 참여자 전원이 가능한 날짜가 없습니다.<br />
              달력의 날짜를 클릭하여 가능한 일정을 표기해보세요!
            </div>
          ) : (
            <div className="date-list">
              {fullMatchDates.map(({ dateStr, entries, count }) => {
                const formatted = formatDateNice(dateStr);
                return (
                  <button
                    key={dateStr}
                    id={`btn-full-date-${dateStr}`}
                    className="date-item-btn"
                    style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    onClick={() => onSelectDate(dateStr)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="date-item-info">
                        <span style={{ color: '#10B981', fontWeight: 800 }}>{formatted}</span>
                        <span className="date-item-badge badge-full">{count}/{totalCount}명 전원 가능</span>
                      </div>

                      {/* Notes Preview */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {entries.map((e) => {
                          const p = participantsMap[e.participantId];
                          if (!p) return null;
                          return (
                            <span
                              key={e.id}
                              className="participant-badge"
                              style={{
                                backgroundColor: p.color,
                                color: getContrastTextColor(p.color),
                                fontSize: '0.7rem'
                              }}
                            >
                              {p.name}{e.note ? `: ${e.note}` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Partially Available Dates */}
        <div className="summary-section-box">
          <div className="section-box-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
              <Users size={18} />
              부분 참석 가능 날짜 ({partialMatchDates.length}일)
            </span>
            <span className="date-item-badge badge-partial">우선순위 순</span>
          </div>

          {partialMatchDates.length === 0 ? (
            <div className="empty-state">
              부분 참석 가능 날짜가 없습니다.
            </div>
          ) : (
            <div className="date-list">
              {partialMatchDates.map(({ dateStr, entries, count }) => {
                const formatted = formatDateNice(dateStr);
                return (
                  <button
                    key={dateStr}
                    className="date-item-btn"
                    onClick={() => onSelectDate(dateStr)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="date-item-info">
                        <span>{formatted}</span>
                        <span className="date-item-badge badge-partial">
                          {count}/{totalCount}명 가능
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {entries.map((e) => {
                          const p = participantsMap[e.participantId];
                          if (!p) return null;
                          return (
                            <span
                              key={e.id}
                              className="participant-badge"
                              style={{
                                backgroundColor: p.color,
                                color: getContrastTextColor(p.color),
                                fontSize: '0.7rem'
                              }}
                            >
                              {p.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${month}월 ${date}일 (${dayName})`;
}
