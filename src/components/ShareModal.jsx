import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload, Share2 } from 'lucide-react';
import { exportCalendarsJSON } from '../utils/storage';

export default function ShareModal({ calendar, allCalendars, onImportData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Share URL format with current calendar id
  const shareUrl = `${window.location.origin}${window.location.pathname}?cal=${calendar?.id || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleExport = () => {
    const jsonStr = exportCalendarsJSON(allCalendars);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gather_calendars_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    setImportError('');
    try {
      if (!importText.trim()) return;
      onImportData(importText.trim());
      alert('데이터 복구가 완료되었습니다!');
      onClose();
    } catch (err) {
      setImportError(err.message || '올바른 JSON 데이터가 아닙니다.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>달력 공유 및 데이터 백업</span>
          </div>
          <button id="btn-share-close" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '24px' }}>
          {/* Direct URL Link Sharing */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>현재 달력 접속 URL (PC & 모바일 공유)</span>
              {copied && <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>✓ 복사되었습니다!</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={shareUrl}
                readOnly
                style={{ background: 'rgba(255, 255, 255, 0.08)' }}
              />
              <button
                id="btn-copy-share-url"
                className="btn btn-primary"
                onClick={handleCopyLink}
                style={{ whitespace: 'nowrap' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? '복사됨' : 'URL 복사'}</span>
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              이 URL로 접속하면 PC와 모바일 디바이스에서 동일한 달력으로 바로 접속할 수 있습니다.
            </p>
          </div>

          {/* Backup Export / Import */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <label className="form-label">전체 데이터 파일 백업 및 복구</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={handleExport} style={{ flex: 1 }}>
                <Download size={16} />
                <span>JSON 파일 내보내기</span>
              </button>
            </div>
          </div>

          {/* Import JSON Form */}
          <form onSubmit={handleImportSubmit} className="form-group">
            <label htmlFor="import-json-textarea" className="form-label">
              JSON 데이터 복구하기 (붙여넣기)
            </label>
            <textarea
              id="import-json-textarea"
              className="form-textarea"
              rows={3}
              placeholder="내보낸 JSON 데이터 텍스트를 여기에 붙여넣으세요..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            {importError && (
              <p style={{ fontSize: '0.8rem', color: '#F87171', marginTop: '4px' }}>
                {importError}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ marginTop: '8px', alignSelf: 'flex-end' }}
              disabled={!importText.trim()}
            >
              <Upload size={16} />
              <span>데이터 불러오기</span>
            </button>
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
