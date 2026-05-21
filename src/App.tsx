import { useEffect, useState, ViewTransition } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ErrorBoundary } from 'react-error-boundary';
import { Toaster, toast } from 'sonner';
import { useTaskStore } from './store/useTaskStore';

import { useAuthStore } from './store/useAuthStore';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { Auth } from './pages/Auth';
import { AuthGuard } from './components/AuthGuard';
import { Analytics } from '@vercel/analytics/react';
import { CalendarView } from './components/calendar/CalendarView';
import { AppFooter } from './components/AppFooter';
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
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from './services/supabase';

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

  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordUpdate(true);
      }
    });

    // Listen for network status
    const handleOnline = () => toast.success('Conexión restaurada', { icon: '🌐' });
    const handleOffline = () => toast.error('Sin conexión a internet', { duration: Infinity, icon: '📡' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('¡Contraseña actualizada con éxito!');
      setShowPasswordUpdate(false);
      setNewPassword('');
    } catch (error: unknown) {
      console.error('Update password error:', error);
      let message = 'Ocurrió un error al actualizar la contraseña.';
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('different from the old password')) {
          message = 'La nueva contraseña debe ser diferente a la actual.';
        } else if (error.message.toLowerCase().includes('should be at least')) {
          message = 'La contraseña debe tener al menos 6 caracteres.';
        }
      }
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPasswordUpdate = async () => {
    setShowPasswordUpdate(false);
    await supabase.auth.signOut();
  };

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
              <Route path="/calendario" element={<AuthGuard><CalendarView /></AuthGuard>} />
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
        <AppFooter />

        {showPasswordUpdate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{
              background: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-xl)',
              width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)'
            }}>
              <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Actualizar Contraseña</h2>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Por favor, ingresa tu nueva contraseña para terminar la recuperación.
              </p>
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                      width: '100%', padding: '10px 12px 10px 40px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" disabled={isUpdatingPassword} onClick={handleCancelPasswordUpdate} style={{ flex: 1, justifyContent: 'center' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUpdatingPassword} style={{ flex: 2, justifyContent: 'center' }}>
                    {isUpdatingPassword ? <Loader2 size={16} className="spin" /> : 'Guardar nueva contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
