import { useEffect, useState } from 'react';
import { Plus, StickyNote, Pencil, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNoteStore } from '../store/useNoteStore';
import { NoteFormModal } from '../components/notes/NoteFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Note } from '../types/note';
import './Notes.css';

export function Notes() {
  const { notes, loading, fetchNotes, deleteNote } = useNoteStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [noteToDelete, setNoteToDelete] = useState<Note | undefined>();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleOpenNewModal = () => {
    setEditingNote(undefined);
    setIsModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    await deleteNote(noteToDelete.id);
    setNoteToDelete(undefined);
  };

  return (
    <div className="page-container fade-in" style={{ padding: 'max(1rem, 3vw)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 250px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.75rem', fontWeight: 'bold' }}>
            <StickyNote size={28} className="text-accent" />
            Notas
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Guarda ideas y apuntes rápidos.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenNewModal} style={{ flexShrink: 0 }}>
          <Plus size={18} style={{ marginRight: '6px' }} />
          Nueva Nota
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin text-accent" />
        </div>
      ) : notes.length === 0 ? (
        <div className="notes-empty-state">
          <StickyNote size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>Aún no tienes notas. Crea la primera.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div
              key={note.id}
              className="card note-card"
              onClick={() => handleEditNote(note)}
            >
              <div className="note-card-header">
                <span className="note-card-title">{note.title}</span>
                <div className="note-card-actions">
                  <button
                    className="btn btn-ghost"
                    aria-label="Editar nota"
                    onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn btn-ghost note-delete-btn"
                    aria-label="Eliminar nota"
                    onClick={(e) => { e.stopPropagation(); setNoteToDelete(note); }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {note.content && <p className="note-card-content">{note.content}</p>}
              <span className="note-card-date">
                {format(new Date(note.updatedAt), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
              </span>
            </div>
          ))}
        </div>
      )}

      <NoteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        noteToEdit={editingNote}
      />

      <ConfirmDialog
        isOpen={!!noteToDelete}
        title="Eliminar nota"
        message={`¿Seguro que deseas eliminar "${noteToDelete?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(undefined)}
      />
    </div>
  );
}
