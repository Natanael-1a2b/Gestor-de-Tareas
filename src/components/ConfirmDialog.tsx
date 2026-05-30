import { useEffect, useRef, ViewTransition } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Eliminar',
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <ViewTransition enter="fade-in" exit="fade-out" default="none">
      <div className="modal-overlay" onClick={onCancel}>
      <div
        className="card confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-msg"
      >
        <div className="confirm-icon">
          <AlertTriangle size={28} />
        </div>
        <h3 id="confirm-title">{title}</h3>
        <p id="confirm-msg">{message}</p>
        {children && <div style={{ margin: '1.25rem 0 1.5rem 0' }}>{children}</div>}
        <div className="confirm-actions">
          <button ref={cancelRef} className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
      </div>
    </ViewTransition>,
    document.body
  );
}
