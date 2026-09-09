import { create } from 'zustand';
import { toast } from 'sonner';
import { noteFolderRepository } from '../services/NoteFolderRepository';
import type { NoteFolder } from '../types/noteFolder';
import { useNoteStore } from './useNoteStore';

interface NoteFolderState {
  folders: NoteFolder[];
  loading: boolean;

  fetchFolders: () => Promise<void>;
  addFolder: (data: { name: string; color: string }) => Promise<void>;
  updateFolder: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useNoteFolderStore = create<NoteFolderState>((set, get) => ({
  folders: [],
  loading: false,

  fetchFolders: async () => {
    set({ loading: true });
    try {
      const folders = await noteFolderRepository.getAllFolders();
      set({ folders, loading: false });
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las carpetas');
      set({ loading: false });
    }
  },

  addFolder: async (data) => {
    try {
      const newFolder = await noteFolderRepository.addFolder(data);
      set((state) => ({ folders: [...state.folders, newFolder] }));
      toast.success('Carpeta creada');
    } catch (error) {
      console.error(error);
      toast.error('Error al crear la carpeta');
    }
  },

  updateFolder: async (id, data) => {
    const prev = get().folders;
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
    try {
      const updated = await noteFolderRepository.updateFolder(id, data);
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updated : f)),
      }));
      toast.success('Carpeta actualizada');
    } catch (error) {
      set({ folders: prev });
      toast.error('Error al actualizar la carpeta');
      console.error(error);
    }
  },

  deleteFolder: async (id) => {
    const prev = get().folders;
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
    try {
      await noteFolderRepository.deleteFolder(id);
      toast.success('Carpeta eliminada');
      useNoteStore.setState((state) => ({
        notes: state.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
        trashedNotes: state.trashedNotes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
      }));
    } catch (error) {
      set({ folders: prev });
      toast.error('Error al eliminar la carpeta');
      console.error(error);
    }
  },
}));
