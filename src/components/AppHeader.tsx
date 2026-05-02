import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutGrid, BarChart3, Sun, Moon, LogOut } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button
      className="btn btn-ghost theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Cambiar a oscuro' : 'Cambiar a claro'}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

export function AppHeader() {
  const { user, signOut } = useAuthStore();

  return (
    <header className="app-header">
      <h1>
        <ClipboardList size={22} aria-hidden="true" /> Gestor de Tareas
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user && (
          <>
            <span className="user-email-display" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: 'var(--space-sm)' }}>
              {user.user_metadata?.full_name || user.email}
            </span>
            <nav className="app-nav" aria-label="Navegación principal">
              <NavLink to="/" end viewTransition>
                <LayoutGrid size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                Tablero
              </NavLink>
              <NavLink to="/dashboard" viewTransition>
                <BarChart3 size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                Dashboard
              </NavLink>
            </nav>
            <button className="btn btn-ghost" onClick={signOut} title="Cerrar sesión" style={{ padding: '6px' }}>
              <LogOut size={16} />
            </button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
