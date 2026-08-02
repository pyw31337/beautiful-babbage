import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { getContrastTextColor } from '../utils/colors';

export default function ParticipantsBar({ calendar, onOpenAdmin }) {
  if (!calendar) return null;

  const participants = calendar.participants || [];

  return (
    <div className="participants-bar">
      <div className="participants-title">
        <Users size={16} />
        <span>참여자 목록 ({participants.length}명)</span>
      </div>

      <div className="participants-list">
        {participants.map((p) => {
          const textColor = getContrastTextColor(p.color);
          return (
            <div
              key={p.id}
              className="participant-chip"
              style={{
                borderColor: `${p.color}40`,
                backgroundColor: `${p.color}15`,
              }}
              title={`${p.name} (퍼스널 컬러)`}
            >
              <span
                className="participant-color-dot"
                style={{ backgroundColor: p.color, color: p.color }}
              />
              <span>{p.name}</span>
            </div>
          );
        })}

        <button
          id="btn-edit-participants"
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '9999px' }}
          onClick={onOpenAdmin}
          title="참여자 추가 및 퍼스널 컬러 수정"
        >
          <UserPlus size={14} />
          <span>참여자 관리</span>
        </button>
      </div>
    </div>
  );
}
