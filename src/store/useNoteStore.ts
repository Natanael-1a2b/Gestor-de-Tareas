import { create } from 'zustand';
import { toast } from 'sonner';
import { noteRepository } from '../services/NoteRepository';
import type { Note } from '../types/note';

interface NoteState {
  notes: Note[];
  loading: boolean;

  fetchNotes: () => Promise<void>;
  addNote: (data: { title: string; content: string; folderId?: string | null }) => Promise<void>;
  updateNote: (id: string, data: { title?: string; content?: string; folderId?: string | null }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const UNTITLED_PATTERN = /^Nota sin título (\d+)$/;

function getNextUntitledTitle(notes: Note[]): string {
  const maxUsed = notes.reduce((max, n) => {
    const match = n.title.match(UNTITLED_PATTERN);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `Nota sin título ${maxUsed + 1}`;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const notes = await noteRepository.getAllNotes();
      set({ notes, loading: false });
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las notas');
      set({ loading: false });
    }
  },

  addNote: async (data) => {
    try {
      const title = data.title.trim() || getNextUntitledTitle(get().notes);
      const newNote = await noteRepository.addNote({ ...data, title });
      set((state) => ({ notes: [newNote, ...state.notes] }));
      toast.success('Nota creada');
    } catch (error) {
      console.error(error);
      toast.error('Error al crear la nota');
    }
  },

  updateNote: async (id, data) => {
    const prev = get().notes;
    const title = data.title !== undefined ? (data.title.trim() || getNextUntitledTitle(prev)) : undefined;
    const patch = title !== undefined ? { ...data, title } : data;

    set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)
    }));
    try {
      const updated = await noteRepository.updateNote(id, patch);
      set((state) => ({
        notes: state.notes
          .map(n => n.id === id ? updated : n)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      }));
      toast.success('Nota actualizada');
    } catch (error) {
      set({ notes: prev });
      toast.error('Error al actualizar la nota');
      console.error(error);
    }
  },

  deleteNote: async (id) => {
    const prev = get().notes;
    set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));
    try {
      await noteRepository.deleteNote(id);
      toast.success('Nota eliminada');
    } catch (error) {
      set({ notes: prev });
      toast.error('Error al eliminar la nota');
      console.error(error);
    }
  },

  toggleFavorite: async (id) => {
    const prev = get().notes;
    const note = prev.find(n => n.id === id);
    if (!note) return;
    const nextValue = !note.isFavorite;

    set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, isFavorite: nextValue } : n)
    }));

    try {
      await noteRepository.setFavorite(id, nextValue);
    } catch (error) {
      set({ notes: prev });
      toast.error('Error al actualizar favorito');
      console.error(error);
    }
  },
}));
