import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    { name: 'gestor-theme' }
  )
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.removeAttribute('data-theme');

  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }
  // 'system' → no attribute, CSS media query handles it
}

// Apply on load
const initial = useThemeStore.getState().theme;
applyTheme(initial);
