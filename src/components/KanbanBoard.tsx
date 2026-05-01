import { useTaskStore } from '../store/useTaskStore';
import type { Status } from '../services/db';

const COLUMNS: { status: Status; label: string; emoji: string }[] = [
  { status: 'Por hacer', label: 'Por Hacer', emoji: '📥' },
  { status: 'En proceso', label: 'En Proceso', emoji: '🔄' },
  { status: 'Completadas', label: 'Completadas', emoji: '✅' },
  { status: 'Pospuestas', label: 'Pospuestas', emoji: '⏸️' },
  { status: 'Canceladas', label: 'Canceladas', emoji: '❌' },
];

export function KanbanBoard() {
  const getTasksByStatus = useTaskStore((s) => s.getTasksByStatus);

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>Tablero Kanban</h2>
      </div>
      <div className="kanban-columns">
        {COLUMNS.map((col) => {
          const tasks = getTasksByStatus(col.status);
          return (
            <div key={col.status} className="kanban-column">
              <div className="kanban-column-header">
                <span aria-hidden="true">{col.emoji}</span>
                <h3>{col.label}</h3>
                <span className="kanban-count">{tasks.length}</span>
              </div>
              <div className="kanban-column-body">
                {tasks.length === 0 ? (
                  <p className="kanban-empty">Sin tareas</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="card kanban-card">
                      <div className="kanban-card-header">
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                        <span className="kanban-card-category">{task.category}</span>
                      </div>
                      <h4 className="kanban-card-title">{task.title}</h4>
                      {task.dueDate && (
                        <span className="kanban-card-date">
                          📅 {new Date(task.dueDate).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
