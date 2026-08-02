import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Settings, User, Palette, CheckCircle } from 'lucide-react';
import { PRESET_COLORS, getRandomColor, getContrastTextColor } from '../utils/colors';

export default function AdminPanel({
  calendar,
  onSaveCalendar,
  onDeleteCalendar,
  onClose
}) {
  const [title, setTitle] = useState(calendar?.title || '새 모임 달력');
  const [description, setDescription] = useState(calendar?.description || '');
  const [participants, setParticipants] = useState(() => calendar?.participants || []);

  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantColor, setNewParticipantColor] = useState(getRandomColor());

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!newParticipantName.trim()) return;

    const newP = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: newParticipantName.trim(),
      color: newParticipantColor
    };

    setParticipants([...participants, newP]);
    setNewParticipantName('');
    setNewParticipantColor(getRandomColor());
  };

  const handleUpdateParticipantName = (id, newName) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleUpdateParticipantColor = (id, color) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, color } : p));
  };

  const handleRemoveParticipant = (id) => {
    if (participants.length <= 1) {
      alert('최소 1명 이상의 참여자가 있어야 합니다.');
      return;
    }
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('달력 제목을 입력해 주세요.');
      return;
    }
    if (participants.length === 0) {
      alert('참여자를 최소 1명 이상 등록해 주세요.');
      return;
    }

    onSaveCalendar({
      ...calendar,
      title: title.trim(),
      description: description.trim(),
      participants,
      updatedAt: new Date().toISOString()
    });

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`'${calendar.title}' 달력을 삭제하시겠습니까?`)) {
      onDeleteCalendar(calendar.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>어드민: 달력 및 참여자 설정</span>
          </div>
          <button id="btn-admin-close" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Calendar Title & Description */}
            <div className="form-group">
              <label htmlFor="calendar-title-input" className="form-label">
                달력명 (상단 표기)
              </label>
              <input
                id="calendar-title-input"
                type="text"
                className="form-input"
                placeholder="예: 8월 정기 사모임 일자 조율"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="calendar-desc-input" className="form-label">
                달력 설명 / 안내 문구 (선택)
              </label>
              <input
                id="calendar-desc-input"
                type="text"
                className="form-input"
                placeholder="예: 각자 휴가 및 참석 가능한 날짜를 모두 등록해주세요!"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Participants Management */}
            <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} />
                  <span>참여자 설정 ({participants.length}명)</span>
                </label>
              </div>

              {/* Add New Participant Sub-form */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  새 참여자 추가
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    id="new-participant-name-input"
                    type="text"
                    className="form-input"
                    placeholder="참여자 이름 (예: 홍길동)"
                    style={{ flex: 1, minWidth: '140px' }}
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                  />

                  {/* Preset Colors Select Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="color"
                      title="직접 색상 선택"
                      value={newParticipantColor}
                      onChange={(e) => setNewParticipantColor(e.target.value)}
                      style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                    <button
                      type="button"
                      id="btn-add-participant"
                      className="btn btn-primary"
                      onClick={handleAddParticipant}
                      style={{ padding: '8px 14px' }}
                    >
                      <Plus size={16} />
                      <span>추가</span>
                    </button>
                  </div>
                </div>

                {/* Palette quick picks */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>추천 색상:</span>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        border: newParticipantColor === c.hex ? '2px solid #fff' : '1px solid transparent',
                        cursor: 'pointer',
                        transform: newParticipantColor === c.hex ? 'scale(1.2)' : 'scale(1)'
                      }}
                      onClick={() => setNewParticipantColor(c.hex)}
                    />
                  ))}
                </div>
              </div>

              {/* List of Existing Participants */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                {participants.map((p) => (
                  <div key={p.id} className="participant-edit-row">
                    {/* Color dot picker */}
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => handleUpdateParticipantColor(p.id, e.target.value)}
                      style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="퍼스널 컬러 변경"
                    />

                    {/* Name input */}
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      value={p.name}
                      onChange={(e) => handleUpdateParticipantName(p.id, e.target.value)}
                    />

                    {/* Badge Preview */}
                    <span
                      className="participant-badge"
                      style={{
                        backgroundColor: p.color,
                        color: getContrastTextColor(p.color),
                        padding: '6px 12px'
                      }}
                    >
                      {p.name}
                    </span>

                    {/* Remove button */}
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '6px 10px' }}
                      onClick={() => handleRemoveParticipant(p.id)}
                      title="참여자 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              id="btn-delete-calendar"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              <span>달력 삭제</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                취소
              </button>
              <button type="submit" id="btn-save-admin" className="btn btn-primary">
                <Save size={16} />
                <span>설정 저장</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
