import { X, Plus, Clock } from 'lucide-react';
import type { Task } from '../../types';

interface DayTaskListProps {
  date: Date;
  tasks: Task[];
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onAddTask: (date: Date) => void;
}

export function DayTaskList({ date, tasks, onClose, onEditTask, onAddTask }: DayTaskListProps) {
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="day-tasks-overlay" onClick={onClose}>
      <div className="day-tasks-container" onClick={(e) => e.stopPropagation()}>
        <div className="day-tasks-header">
          <h3 style={{ textTransform: 'capitalize', margin: 0 }}>{formattedDate}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="day-tasks-list">
          {tasks.length > 0 ? (
            tasks.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate + 'T12:00:00') < new Date() && task.status !== 'Completadas';
              
              return (
                <div 
                  key={task.id} 
                  className="card" 
                  style={{ padding: 'var(--space-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                  onClick={() => onEditTask(task)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: `var(--cat-${task.category.toLowerCase()})`, fontWeight: 600, textTransform: 'uppercase' }}>
                      {task.category}
                    </span>
                    {task.dueDate && (
                      <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue ? 'var(--overdue)' : 'var(--text-tertiary)' }}>
                        <Clock size={12} /> {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: 'var(--space-md) 0' }}>
              No hay tareas programadas para este día.
            </p>
          )}

          <button 
            className="btn btn-primary" 
            style={{ marginTop: 'var(--space-sm)' }}
            onClick={() => onAddTask(date)}
          >
            <Plus size={16} /> Programar nueva tarea
          </button>
        </div>
      </div>
    </div>
  );
}
