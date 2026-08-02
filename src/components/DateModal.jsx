import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar as CalendarIcon, User, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getContrastTextColor } from '../utils/colors';

export default function DateModal({
  dateStr,
  calendar,
  onSaveAvailability,
  onDeleteAvailability,
  onClose
}) {
  const participants = calendar?.participants || [];
  
  // Find entries for this date
  const dateEntries = (calendar?.availabilities || []).filter(e => e.date === dateStr);

  const [selectedParticipantId, setSelectedParticipantId] = useState(() => {
    // Select first participant not yet marked for this date, or first overall
    const alreadyMarkedIds = new Set(dateEntries.map(e => e.participantId));
    const firstUnmarked = participants.find(p => !alreadyMarkedIds.has(p.id));
    return firstUnmarked ? firstUnmarked.id : (participants[0]?.id || '');
  });

  const [note, setNote] = useState('');

  // Update note when selecting a participant if they already have an entry
  useEffect(() => {
    const existing = dateEntries.find(e => e.participantId === selectedParticipantId);
    if (existing) {
      setNote(existing.note || '');
    } else {
      setNote('');
    }
  }, [selectedParticipantId, dateStr]);

  if (!dateStr) return null;

  // Format date display
  const dateObj = new Date(dateStr + 'T00:00:00');
  const formattedDate = !isNaN(dateObj.getTime())
    ? `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]}요일)`
    : dateStr;

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedParticipantId) return;

    onSaveAvailability(dateStr, selectedParticipantId, note.trim());

    // Check if this action makes 100% of participants available
    const existingOtherIds = new Set(
      dateEntries.filter(e => e.participantId !== selectedParticipantId).map(e => e.participantId)
    );
    existingOtherIds.add(selectedParticipantId);

    if (participants.length > 0 && existingOtherIds.size === participants.length) {
      // Trigger celebration effect for 100% full match!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.log('Confetti error', err);
      }
    }

    onClose();
  };

  const selectedParticipant = participants.find(p => p.id === selectedParticipantId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <CalendarIcon size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>{formattedDate}</span>
          </div>
          <button id="btn-modal-close" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Participant Dropdown */}
            <div className="form-group">
              <label htmlFor="participant-select" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                <span>참여자 선택</span>
              </label>
              <select
                id="participant-select"
                className="form-select"
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
                required
              >
                {participants.map((p) => {
                  const isAlreadyMarked = dateEntries.some(e => e.participantId === p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} {isAlreadyMarked ? '(이미 등록됨 - 수정)' : '(가능 표기)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Participant Personal Color Preview Badge */}
            {selectedParticipant && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span className="form-label" style={{ margin: 0 }}>표기 뱃지 미리보기:</span>
                <span
                  className="participant-badge"
                  style={{
                    backgroundColor: selectedParticipant.color,
                    color: getContrastTextColor(selectedParticipant.color),
                    padding: '4px 10px',
                    fontSize: '0.825rem'
                  }}
                >
                  <span className="badge-dot" style={{ backgroundColor: getContrastTextColor(selectedParticipant.color) }} />
                  {selectedParticipant.name}
                </span>
              </div>
            )}

            {/* Note Text Field */}
            <div className="form-group">
              <label htmlFor="note-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} />
                <span>메모 입력 (선택)</span>
              </label>
              <input
                id="note-input"
                type="text"
                className="form-input"
                placeholder="예: 1시 이후 가능, 차 준비됨, 장소 자유"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={60}
              />
            </div>

            {/* Existing Registered Participants for this date */}
            {dateEntries.length > 0 && (
              <div className="existing-entries-section">
                <div className="existing-entries-title">
                  등록된 참석 가능 멤버 ({dateEntries.length}/{participants.length}명)
                </div>
                {dateEntries.map((entry) => {
                  const p = participants.find(part => part.id === entry.participantId);
                  if (!p) return null;
                  const textColor = getContrastTextColor(p.color);

                  return (
                    <div key={entry.id || p.id} className="entry-item">
                      <div className="entry-info">
                        <span
                          className="participant-badge"
                          style={{
                            backgroundColor: p.color,
                            color: textColor
                          }}
                        >
                          <span className="badge-dot" style={{ backgroundColor: textColor }} />
                          {p.name}
                        </span>
                        {entry.note && <span className="entry-note">"{entry.note}"</span>}
                      </div>

                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => onDeleteAvailability(dateStr, p.id)}
                        title="등록 취소"
                      >
                        <Trash2 size={12} />
                        <span>삭제</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button id="btn-save-availability" type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
