import { useEffect, useMemo, useState } from 'react';
import { Plus, StickyNote, Pencil, Trash2, Loader2, Search, Star, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNoteStore } from '../store/useNoteStore';
import { NoteFormModal } from '../components/notes/NoteFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Note } from '../types/note';
import './Notes.css';

export function Notes() {
  const { notes, loading, fetchNotes, deleteNote, toggleFavorite } = useNoteStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [noteToDelete, setNoteToDelete] = useState<Note | undefined>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? notes.filter(
          (note) =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        )
      : notes;

    return [...base].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, search]);

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

  const handleCopyContent = async (note: Note) => {
    try {
      await navigator.clipboard.writeText(note.content);
      toast.success('Contenido copiado al portapapeles');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo copiar el contenido');
    }
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

      {!loading && notes.length > 0 && (
        <div className="filter-search" style={{ marginBottom: '1.5rem', maxWidth: '360px' }}>
          <span className="filter-search-icon" aria-hidden="true"><Search size={15} /></span>
          <input
            className="input filter-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o contenido..."
            aria-label="Buscar notas"
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin text-accent" />
        </div>
      ) : notes.length === 0 ? (
        <div className="notes-empty-state">
          <StickyNote size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>Aún no tienes notas. Crea la primera.</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="notes-empty-state">
          <Search size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>No se encontraron notas para "{search}".</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`card note-card ${note.isFavorite ? 'is-favorite' : ''}`}
              onClick={() => handleEditNote(note)}
            >
              <div className="note-card-header">
                <span className="note-card-title">{note.title}</span>
                <div className="note-card-actions">
                  <button
                    className={`btn btn-ghost note-favorite-btn ${note.isFavorite ? 'active' : ''}`}
                    aria-label={note.isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
                    aria-pressed={note.isFavorite}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id); }}
                  >
                    <Star size={15} fill={note.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    aria-label="Copiar contenido"
                    disabled={!note.content}
                    onClick={(e) => { e.stopPropagation(); handleCopyContent(note); }}
                  >
                    <Copy size={15} />
                  </button>
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
