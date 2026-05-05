import { useEffect, ViewTransition } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { useTaskStore } from './store/useTaskStore';

import { useAuthStore } from './store/useAuthStore';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { Auth } from './pages/Auth';
import { AuthGuard } from './components/AuthGuard';
import './App.css';

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  return (
    <div style={{ padding: '2.5rem', textAlign: 'center', margin: '3rem auto', maxWidth: '420px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--priority-alta-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--priority-alta)', fontSize: '1.5rem' }}>!</div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>Algo salió mal</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', wordBreak: 'break-word', fontSize: '0.85rem', lineHeight: '1.5' }}>{message}</p>
      <button className="btn btn-primary" onClick={resetErrorBoundary}>Recargar página</button>
    </div>
  );
}

import { AppHeader } from './components/AppHeader';

function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const { initializeAuth, user } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      useTaskStore.getState().subscribeToRealtime();
    } else {
      useTaskStore.getState().unsubscribeFromRealtime();
    }
    
    return () => {
      useTaskStore.getState().unsubscribeFromRealtime();
    };
  }, [fetchTasks, user]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <BrowserRouter>
        <div className="app-layout">
        <AppHeader />

        <main className="app-main">
          <ViewTransition enter="fade-in" exit="fade-out" default="none">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<AuthGuard><KanbanBoard /></AuthGuard>} />
              <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
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
        <Analytics />
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
