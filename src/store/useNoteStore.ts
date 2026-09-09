import { create } from 'zustand';
import { toast } from 'sonner';
import { noteRepository } from '../services/NoteRepository';
import type { Note } from '../types/note';

interface NoteState {
  notes: Note[];
  trashedNotes: Note[];
  loading: boolean;

  fetchNotes: () => Promise<void>;
  fetchTrashedNotes: () => Promise<void>;
  addNote: (data: { title: string; content: string; folderId?: string | null }) => Promise<void>;
  updateNote: (id: string, data: { title?: string; content?: string; folderId?: string | null }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
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
  trashedNotes: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const notes = await noteRepository.getAllNotes();
      set({ notes, loading: false });
      get().fetchTrashedNotes();
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las notas');
      set({ loading: false });
    }
  },

  fetchTrashedNotes: async () => {
    try {
      const trashedNotes = await noteRepository.getTrashedNotes();
      set({ trashedNotes });
    } catch (error) {
      console.error('Error al cargar la papelera de notas:', error);
      toast.error('No se pudo cargar la papelera');
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
    const prevNotes = get().notes;
    const prevTrashed = get().trashedNotes;

    const noteToTrash = prevNotes.find(n => n.id === id);
    if (!noteToTrash) return;

    // Optimistic update: se mueve a la papelera, no se borra de verdad
    set({
      notes: prevNotes.filter(n => n.id !== id),
      trashedNotes: [{ ...noteToTrash, deletedAt: new Date().toISOString() }, ...prevTrashed],
    });

    try {
      await noteRepository.moveNoteToTrash(id);
      toast.success('Nota movida a la papelera');
    } catch (error) {
      set({ notes: prevNotes, trashedNotes: prevTrashed });
      toast.error('Error al mover la nota a la papelera');
      console.error(error);
    }
  },

  restoreNote: async (id) => {
    const prevNotes = get().notes;
    const prevTrashed = get().trashedNotes;

    const noteToRestore = prevTrashed.find(n => n.id === id);
    if (!noteToRestore) return;

    // Optimistic update
    set({
      trashedNotes: prevTrashed.filter(n => n.id !== id),
      notes: [{ ...noteToRestore, deletedAt: undefined }, ...prevNotes],
    });

    try {
      await noteRepository.restoreNoteFromTrash(id);
      toast.success('Nota restaurada de la papelera');
    } catch (error) {
      set({ notes: prevNotes, trashedNotes: prevTrashed });
      toast.error('Error al restaurar la nota');
      console.error(error);
    }
  },

  permanentlyDeleteNote: async (id) => {
    const prevTrashed = get().trashedNotes;

    // Optimistic update
    set({ trashedNotes: prevTrashed.filter(n => n.id !== id) });

    try {
      await noteRepository.deleteNote(id);
      toast.success('Nota eliminada para siempre');
    } catch (error) {
      set({ trashedNotes: prevTrashed });
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
