import { useState } from 'react';
import { X, Plus, Clock, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Task } from '../../types';

interface DayTaskListProps {
  date: Date;
  tasks: Task[];
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (date: Date) => void;
  inline?: boolean;
}

export function DayTaskList({ date, tasks, onClose, onEditTask, onDeleteTask, onAddTask, inline }: DayTaskListProps) {
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const content = (
    <div className={`day-tasks-container ${inline ? 'inline' : ''}`} onClick={!inline ? (e) => e.stopPropagation() : undefined}>
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
                    className="card day-task-card"
                  >
                    <div className="day-task-card-content" onClick={() => onEditTask(task)}>
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
                    <div className="day-task-card-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => onEditTask(task)}
                        aria-label="Editar tarea"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="btn-icon day-task-delete-btn" 
                        onClick={() => setConfirmDelete(task)}
                        aria-label="Eliminar tarea"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
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
  );

  return (
    <>
      {inline ? content : (
        <div className="day-tasks-overlay" onClick={onClose}>
          {content}
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar tarea"
        message={`¿Estás seguro de eliminar "${confirmDelete?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (confirmDelete?.id) {
            onDeleteTask(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}
