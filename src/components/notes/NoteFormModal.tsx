import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useNoteStore } from '../../store/useNoteStore';
import type { Note } from '../../types/note';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: Note;
}

export function NoteFormModal({ isOpen, onClose, noteToEdit }: Props) {
  const addNote = useNoteStore((s) => s.addNote);
  const updateNote = useNoteStore((s) => s.updateNote);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
      } else {
        setTitle('');
        setContent('');
      }
      setIsSubmitting(false);
    }
  }, [isOpen, noteToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (noteToEdit) {
        await updateNote(noteToEdit.id, { title, content });
      } else {
        await addNote({ title, content });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{noteToEdit ? 'Editar Nota' : 'Nueva Nota'}</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="note-title">Título *</label>
            <input
              id="note-title"
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Ideas para el proyecto..."
              maxLength={150}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
            <label htmlFor="note-content">Nota</label>
            <textarea
              id="note-content"
              className="input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe aquí el contenido de tu nota..."
              rows={8}
              style={{ resize: 'vertical', minHeight: '150px', fontFamily: 'inherit' }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} style={{ marginRight: '6px' }} />
              {isSubmitting ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
