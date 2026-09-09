import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutGrid, BarChart3, LogOut, Calendar, Target, StickyNote, Shield, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';

export function AppHeader() {
  const { user, signOut } = useAuthStore();
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const checkAdmin = useAdminStore((s) => s.checkAdmin);
  const resetAdmin = useAdminStore((s) => s.reset);

  useEffect(() => {
    if (user?.id) {
      checkAdmin(user.id);
    } else {
      resetAdmin();
    }
  }, [user?.id, checkAdmin, resetAdmin]);

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
              <NavLink to="/calendario" viewTransition>
                <Calendar size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                Calendario
              </NavLink>
              <NavLink to="/habitos" viewTransition>
                <Target size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                Hábitos
              </NavLink>
              <NavLink to="/notas" viewTransition>
                <StickyNote size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                Notas
              </NavLink>
              <NavLink to="/dashboard" viewTransition>
                <BarChart3 size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                Dashboard
              </NavLink>
            </nav>
            {isAdmin && (
              <NavLink to="/admin" viewTransition className="btn btn-ghost app-header-icon-btn" title="Admin" aria-label="Admin">
                <Shield size={16} aria-hidden="true" />
                <span className="app-header-icon-label">Admin</span>
              </NavLink>
            )}
            <NavLink to="/ajustes" viewTransition className="btn btn-ghost app-header-icon-btn" title="Ajustes" aria-label="Ajustes">
              <Settings size={16} aria-hidden="true" />
              <span className="app-header-icon-label">Ajustes</span>
            </NavLink>
            <button className="btn btn-ghost" onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión" style={{ padding: '6px' }}>
              <LogOut size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
