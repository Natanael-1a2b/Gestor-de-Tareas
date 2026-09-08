import { useEffect, useMemo, useState } from 'react';
import { Plus, StickyNote, Pencil, Trash2, Loader2, Search, Star, Copy, Settings, X } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNoteStore } from '../store/useNoteStore';
import { useNoteFolderStore } from '../store/useNoteFolderStore';
import { NoteFormModal } from '../components/notes/NoteFormModal';
import { FolderManagerModal } from '../components/notes/FolderManagerModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Note } from '../types/note';
import type { NoteFolder } from '../types/noteFolder';
import './Notes.css';

const NO_FOLDER = '__none__';

function formatDayLabel(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "d 'de' MMMM, yyyy", { locale: es });
}

interface NoteCardProps {
  note: Note;
  folder?: NoteFolder;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onToggleFavorite: (note: Note) => void;
  onCopy: (note: Note) => void;
  justFavorited?: boolean;
}

function NoteCard({ note, folder, onEdit, onDelete, onToggleFavorite, onCopy, justFavorited }: NoteCardProps) {
  const handleCardClick = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      if (note.content) onCopy(note);
      return;
    }
    onEdit(note);
  };

  return (
    <div
      className={`card note-card ${note.isFavorite ? 'is-favorite' : ''}`}
      onClick={handleCardClick}
    >
      <div className="note-card-header">
        {folder && (
          <span
            className="note-card-folder-dot"
            style={{ backgroundColor: folder.color }}
            title={folder.name}
            aria-hidden="true"
          />
        )}
        <span className="note-card-title">{note.title}</span>
        <button
          className={`btn btn-ghost note-favorite-btn ${note.isFavorite ? 'active' : ''} ${justFavorited ? 'pop' : ''}`}
          aria-label={note.isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
          aria-pressed={note.isFavorite}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(note); }}
        >
          <Star size={15} fill={note.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      {note.content && <p className="note-card-content">{note.content}</p>}
      <div className="note-card-footer">
        <span className="note-card-date">
          {format(new Date(note.updatedAt), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
        </span>
        <div className="note-card-actions">
          <button
            className="btn btn-ghost"
            aria-label="Copiar contenido"
            disabled={!note.content}
            onClick={(e) => { e.stopPropagation(); onCopy(note); }}
          >
            <Copy size={15} />
          </button>
          <button
            className="btn btn-ghost"
            aria-label="Editar nota"
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
          >
            <Pencil size={15} />
          </button>
          <button
            className="btn btn-ghost note-delete-btn"
            aria-label="Eliminar nota"
            onClick={(e) => { e.stopPropagation(); onDelete(note); }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Notes() {
  const { notes, loading, fetchNotes, deleteNote, toggleFavorite } = useNoteStore();
  const { folders, fetchFolders } = useNoteFolderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [noteToDelete, setNoteToDelete] = useState<Note | undefined>();
  const [search, setSearch] = useState('');
  const [justFavoritedId, setJustFavoritedId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const folderById = useMemo(
    () => Object.fromEntries(folders.map((f) => [f.id, f])),
    [folders]
  );

  // Si la carpeta activa del filtro fue eliminada, se trata como "todas" en vez
  // de seguir excluyendo notas contra un id que ya no existe.
  const effectiveFolderId =
    activeFolderId !== null && activeFolderId !== NO_FOLDER && !folders.some((f) => f.id === activeFolderId)
      ? null
      : activeFolderId;

  /* ─── Keyboard Shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        setIsModalOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingNote(undefined);
        setIsModalOpen(true);
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('.filter-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  const { favoriteNotes, dayGroups, hasResults } = useMemo(() => {
    const folderFiltered = effectiveFolderId === null
      ? notes
      : effectiveFolderId === NO_FOLDER
        ? notes.filter((note) => note.folderId === null)
        : notes.filter((note) => note.folderId === effectiveFolderId);

    const query = search.trim().toLowerCase();
    const base = query
      ? folderFiltered.filter(
          (note) =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        )
      : folderFiltered;

    const sorted = [...base].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const favorites = sorted.filter((n) => n.isFavorite);
    const rest = sorted.filter((n) => !n.isFavorite);

    const groups: { key: string; label: string; notes: Note[] }[] = [];
    for (const note of rest) {
      const date = new Date(note.updatedAt);
      const key = format(date, 'yyyy-MM-dd');
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key === key) {
        lastGroup.notes.push(note);
      } else {
        groups.push({ key, label: formatDayLabel(date), notes: [note] });
      }
    }

    return { favoriteNotes: favorites, dayGroups: groups, hasResults: sorted.length > 0 };
  }, [notes, search, effectiveFolderId]);

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

  const handleToggleFavorite = (note: Note) => {
    const willBeFavorite = !note.isFavorite;
    toggleFavorite(note.id);
    if (willBeFavorite) {
      setJustFavoritedId(note.id);
      window.setTimeout(() => {
        setJustFavoritedId((current) => (current === note.id ? null : current));
      }, 500);
    }
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span className="keyboard-hint" title="Atajo: N">
            <kbd>N</kbd> Nueva
          </span>
          <span className="keyboard-hint" title="Atajo: /">
            <kbd>/</kbd> Buscar
          </span>
          <button className="btn btn-primary" onClick={handleOpenNewModal}>
            <Plus size={18} style={{ marginRight: '6px' }} />
            Nueva Nota
          </button>
        </div>
      </div>

      {!loading && notes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div className="filter-search" style={{ maxWidth: '360px' }}>
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

          {effectiveFolderId !== null && (
            <div className="filter-chip">
              <span>
                Carpeta: {effectiveFolderId === NO_FOLDER ? 'Sin carpeta' : folderById[effectiveFolderId]?.name}
              </span>
              <button
                type="button"
                className="filter-chip-remove"
                aria-label="Quitar filtro de carpeta"
                onClick={() => setActiveFolderId(null)}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {folders.length > 0 && (
            <>
              <select
                className="input folder-filter-select"
                value={effectiveFolderId ?? ''}
                onChange={(e) => setActiveFolderId(e.target.value === '' ? null : e.target.value)}
                aria-label="Filtrar por carpeta"
              >
                <option value="">Todas las carpetas</option>
                <option value={NO_FOLDER}>Sin carpeta</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
              <button
                className="btn btn-ghost"
                aria-label="Gestionar carpetas"
                title="Gestionar carpetas"
                onClick={() => setIsFolderManagerOpen(true)}
              >
                <Settings size={16} />
              </button>
            </>
          )}
          {folders.length === 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setIsFolderManagerOpen(true)}
            >
              <Settings size={16} style={{ marginRight: '6px' }} />
              Crear carpeta
            </button>
          )}
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
      ) : !hasResults ? (
        <div className="notes-empty-state">
          <Search size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          {search.trim() && effectiveFolderId !== null ? (
            <p>No se encontraron notas para "{search}" en la carpeta filtrada.</p>
          ) : search.trim() ? (
            <p>No se encontraron notas para "{search}".</p>
          ) : (
            <p>No hay notas en esta carpeta.</p>
          )}
        </div>
      ) : (
        <>
          {favoriteNotes.length > 0 && (
            <section className="notes-section">
              <h3 className="notes-section-title is-favorites">
                <Star size={14} fill="currentColor" /> Favoritas
              </h3>
              <div className="notes-grid">
                {favoriteNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    folder={note.folderId ? folderById[note.folderId] : undefined}
                    onEdit={handleEditNote}
                    onDelete={setNoteToDelete}
                    onToggleFavorite={handleToggleFavorite}
                    onCopy={handleCopyContent}
                    justFavorited={note.id === justFavoritedId}
                  />
                ))}
              </div>
            </section>
          )}

          {dayGroups.map((group) => (
            <section key={group.key} className="notes-section">
              <h3 className="notes-section-title">{group.label}</h3>
              <div className="notes-grid">
                {group.notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    folder={note.folderId ? folderById[note.folderId] : undefined}
                    onEdit={handleEditNote}
                    onDelete={setNoteToDelete}
                    onToggleFavorite={handleToggleFavorite}
                    onCopy={handleCopyContent}
                    justFavorited={note.id === justFavoritedId}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
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

      <FolderManagerModal
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
      />
    </div>
  );
}
