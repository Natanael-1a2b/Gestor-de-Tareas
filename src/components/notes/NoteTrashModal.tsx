import { useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { useNoteStore } from '../../store/useNoteStore';
import type { Note } from '../../types/note';
import { ConfirmDialog } from '../ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function daysUntilPurge(deletedAt: string): number {
  const purgeAt = new Date(deletedAt).getTime() + THIRTY_DAYS_MS;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function NoteTrashModal({ isOpen, onClose }: Props) {
  const trashedNotes = useNoteStore((s) => s.trashedNotes);
  const restoreNote = useNoteStore((s) => s.restoreNote);
  const permanentlyDeleteNote = useNoteStore((s) => s.permanentlyDeleteNote);

  const [noteToPurge, setNoteToPurge] = useState<Note | undefined>();

  if (!isOpen) return null;

  const handleConfirmPurge = async () => {
    if (!noteToPurge) return;
    await permanentlyDeleteNote(noteToPurge.id);
    setNoteToPurge(undefined);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Papelera de notas</h2>
            <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {trashedNotes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                La papelera está vacía.
              </p>
            ) : (
              <div className="trash-list">
                {trashedNotes.map((note) => (
                  <div key={note.id} className="trash-row">
                    <div className="trash-row-info">
                      <span className="trash-row-title">{note.title}</span>
                      <span className="trash-row-meta">
                        {daysUntilPurge(note.deletedAt!) === 0
                          ? 'Se borra definitivamente hoy'
                          : `Se borra definitivamente en ${daysUntilPurge(note.deletedAt!)} día(s)`}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      aria-label={`Restaurar ${note.title}`}
                      title="Restaurar"
                      onClick={() => restoreNote(note.id)}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      className="btn btn-ghost trash-row-purge"
                      aria-label={`Eliminar para siempre ${note.title}`}
                      title="Eliminar para siempre"
                      onClick={() => setNoteToPurge(note)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!noteToPurge}
        title="Eliminar para siempre"
        message={`"${noteToPurge?.title}" se va a borrar definitivamente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar para siempre"
        onConfirm={handleConfirmPurge}
        onCancel={() => setNoteToPurge(undefined)}
      />
    </>
  );
}
