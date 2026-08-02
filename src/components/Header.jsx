import React from 'react';
import { Calendar, Settings, Share2, PlusCircle, ChevronDown } from 'lucide-react';

export default function Header({
  calendars,
  activeCalendar,
  onSelectCalendar,
  onOpenAdmin,
  onOpenShare,
  onOpenCreateModal
}) {
  return (
    <header className="header-card">
      <div className="header-title-section">
        <div className="header-logo-icon">
          <Calendar size={24} />
        </div>
        <div>
          <div className="header-calendar-title">
            <span>{activeCalendar?.title || '모여라 달력'}</span>
          </div>
          {activeCalendar?.description && (
            <p className="header-calendar-desc">{activeCalendar.description}</p>
          )}
        </div>
      </div>

      <div className="header-actions">
        {/* Calendar Switcher Select */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            id="calendar-select"
            className="form-select"
            style={{
              paddingRight: '36px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            value={activeCalendar?.id || ''}
            onChange={(e) => onSelectCalendar(e.target.value)}
          >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.title} ({cal.participants?.length || 0}명)
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--text-muted)'
            }}
          />
        </div>

        {/* Create Calendar Button */}
        <button
          id="btn-create-calendar"
          className="btn btn-secondary"
          onClick={onOpenCreateModal}
          title="새 모임 달력 만들기"
        >
          <PlusCircle size={16} />
          <span>달력 생성</span>
        </button>

        {/* Share Button */}
        <button
          id="btn-share-calendar"
          className="btn btn-secondary"
          onClick={onOpenShare}
          title="달력 공유 및 내보내기"
        >
          <Share2 size={16} />
          <span>공유</span>
        </button>

        {/* Admin Settings Button */}
        <button
          id="btn-admin-settings"
          className="btn btn-primary"
          onClick={onOpenAdmin}
          title="어드민: 달력 및 참여자 설정"
        >
          <Settings size={16} />
          <span>어드민</span>
        </button>
      </div>
    </header>
  );
}
