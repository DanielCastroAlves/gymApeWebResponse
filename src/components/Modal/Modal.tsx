import { useEffect } from 'react';
import './Modal.css';

export type ModalAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
};

export default function Modal({
  open,
  title,
  message,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  actions?: ModalAction[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modalCard">
        <div className="modalHeader">
          <h3 className="modalTitle">{title}</h3>
          <button type="button" className="modalCloseBtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modalBody">
          {message && <p className="modalMessage">{message}</p>}
        </div>
        {actions?.length ? (
          <div className="modalFooter">
            {actions.map((a, idx) => (
              <button
                key={idx}
                type="button"
                className={a.variant === 'primary' ? 'modalPrimaryBtn' : 'modalGhostBtn'}
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

