import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'pink';

const THEME_CYCLE: Theme[] = ['light', 'dark', 'pink'];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const currentIndex = THEME_CYCLE.indexOf(get().theme);
        const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
        set({ theme: next });
        applyTheme(next);
      },
    }),
    { name: 'gestor-theme' }
  )
);

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Apply on load
const initial = useThemeStore.getState().theme;
applyTheme(initial);
