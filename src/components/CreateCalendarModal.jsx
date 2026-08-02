import React, { useState } from 'react';
import { X, PlusCircle, UserPlus, Trash2 } from 'lucide-react';
import { PRESET_COLORS, getRandomColor } from '../utils/colors';

export default function CreateCalendarModal({ onCreateCalendar, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Initial default 3 participants
  const [participants, setParticipants] = useState([
    { id: 'p1', name: '참여자 1', color: PRESET_COLORS[0].hex },
    { id: 'p2', name: '참여자 2', color: PRESET_COLORS[5].hex },
    { id: 'p3', name: '참여자 3', color: PRESET_COLORS[3].hex }
  ]);

  const [newName, setNewName] = useState('');

  const handleAddParticipant = () => {
    if (!newName.trim()) return;
    setParticipants([
      ...participants,
      {
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        name: newName.trim(),
        color: getRandomColor()
      }
    ]);
    setNewName('');
  };

  const handleRemoveParticipant = (id) => {
    if (participants.length <= 1) {
      alert('최소 1명의 참여자가 필요합니다.');
      return;
    }
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('달력명을 입력해 주세요.');
      return;
    }
    onCreateCalendar(title.trim(), description.trim(), participants);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PlusCircle size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>새 모임 달력 생성</span>
          </div>
          <button id="btn-create-close" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label htmlFor="new-cal-title-input" className="form-label">
                달력 제목 (상단 표기명)
              </label>
              <input
                id="new-cal-title-input"
                type="text"
                className="form-input"
                placeholder="예: 8월 제주도 여행 일정 달력"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-cal-desc-input" className="form-label">
                달력 설명 (선택)
              </label>
              <input
                id="new-cal-desc-input"
                type="text"
                className="form-input"
                placeholder="예: 참석 가능한 날짜를 체크해주세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Participants list */}
            <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <label className="form-label">참여자 등록 ({participants.length}명)</label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="새 참여자 이름"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddParticipant();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddParticipant}
                >
                  <UserPlus size={16} />
                  <span>추가</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {participants.map((p, idx) => (
                  <div key={p.id} className="entry-item">
                    <div className="entry-info">
                      <input
                        type="color"
                        value={p.color}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setParticipants(participants.map(item => item.id === p.id ? { ...item, color: newColor } : item));
                        }}
                        style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={p.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setParticipants(participants.map(item => item.id === p.id ? { ...item, name } : item));
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleRemoveParticipant(p.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button id="btn-submit-create-cal" type="submit" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>달력 만들기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
