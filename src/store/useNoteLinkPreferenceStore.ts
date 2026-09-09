import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NoteLinkPreferenceState {
  openLinkOnClick: boolean;
  setOpenLinkOnClick: (value: boolean) => void;
}

export const useNoteLinkPreferenceStore = create<NoteLinkPreferenceState>()(
  persist(
    (set) => ({
      openLinkOnClick: false,
      setOpenLinkOnClick: (value) => set({ openLinkOnClick: value }),
    }),
    { name: 'gestor-note-open-link' }
  )
);
