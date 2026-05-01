import { useEffect, ViewTransition } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useTaskStore } from './store/useTaskStore';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <header className="app-header">
          <h1>
            <span aria-hidden="true">📋</span> Gestor de Tareas
          </h1>
          <nav className="app-nav" aria-label="Navegación principal">
            {/* Usamos viewTransition nativo de react-router v7 para gatillar startViewTransition */}
            <NavLink to="/" end viewTransition>
              Tablero
            </NavLink>
            <NavLink to="/dashboard" viewTransition>
              Dashboard
            </NavLink>
          </nav>
        </header>

        <main className="app-main">
          <ViewTransition enter="fade-in" exit="fade-out" default="none">
            <Routes>
              <Route path="/" element={<KanbanBoard />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </ViewTransition>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
