import { Check } from 'lucide-react';
import { useThemeStore, type Theme } from '../../store/useThemeStore';

const THEME_OPTIONS: { value: Theme; label: string; swatch: [string, string] }[] = [
  { value: 'light', label: 'Claro', swatch: ['#f1f5f9', '#6366f1'] },
  { value: 'dark', label: 'Oscuro', swatch: ['#0c0f1a', '#818cf8'] },
  { value: 'pink', label: 'Rosado', swatch: ['#fdf2f8', '#db2777'] },
];

export function ThemeCard() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="card settings-card">
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>Tema</h3>
        <p className="settings-help-text">Elegí cómo se ve la aplicación.</p>
      </div>

      <div className="settings-theme-options">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`settings-theme-option ${theme === opt.value ? 'active' : ''}`}
            onClick={() => setTheme(opt.value)}
            aria-pressed={theme === opt.value}
          >
            <span
              className="settings-theme-swatch"
              style={{ background: `linear-gradient(135deg, ${opt.swatch[0]} 50%, ${opt.swatch[1]} 50%)` }}
              aria-hidden="true"
            >
              {theme === opt.value && <Check size={14} />}
            </span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
