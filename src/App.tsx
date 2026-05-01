import { useEffect, ViewTransition } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ClipboardList, LayoutGrid, BarChart3, Sun, Moon, Monitor } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { useTaskStore } from './store/useTaskStore';
import { useThemeStore } from './store/useThemeStore';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import './App.css';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div style={{ padding: '2.5rem', textAlign: 'center', margin: '3rem auto', maxWidth: '420px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--priority-alta-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--priority-alta)', fontSize: '1.5rem' }}>!</div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>Algo salió mal</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', wordBreak: 'break-word', fontSize: '0.85rem', lineHeight: '1.5' }}>{error.message}</p>
      <button className="btn btn-primary" onClick={resetErrorBoundary}>Recargar página</button>
    </div>
  );
}

/* ─── Theme Toggle ─── */
function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const cycle = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
  };

  const icon = theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Monitor size={16} />;
  const label = theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema';

  return (
    <button
      className="btn btn-ghost theme-toggle"
      onClick={cycle}
      aria-label={`Tema: ${label}`}
      title={`Tema: ${label}`}
    >
      {icon}
    </button>
  );
}

function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <BrowserRouter>
        <div className="app-layout">
        <header className="app-header">
          <h1>
            <ClipboardList size={22} aria-hidden="true" /> Gestor de Tareas
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <ThemeToggle />
          </div>
        </header>

        <main className="app-main">
          <ViewTransition enter="fade-in" exit="fade-out" default="none">
            <Routes>
              <Route path="/" element={<KanbanBoard />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </ViewTransition>
        </main>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
