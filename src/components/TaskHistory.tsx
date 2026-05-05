import { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { ChevronDown, ChevronRight, Archive, RotateCcw, Trash2, Calendar } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import type { Task } from '../services/db';

export function TaskHistory() {
  const archivedTasks = useTaskStore((s) => s.archivedTasks);
  const restoreTask = useTaskStore((s) => s.restoreTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  if (archivedTasks.length === 0) {
    return null;
  }

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    restoreTask(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setTaskToDelete(task);
  };

  const confirmDelete = () => {
    if (taskToDelete && taskToDelete.id) {
      deleteTask(taskToDelete.id);
    }
    setTaskToDelete(null);
  };

  return (
    <div className="task-history">
      <div className="task-history-header">
        <h3>
          <Archive size={16} />
          Historial de Tareas
        </h3>
        <span className="kanban-count">{archivedTasks.length} archivadas</span>
      </div>

      <div className="task-history-list">
        {archivedTasks.map((task) => {
          const isExpanded = expandedId === task.id;
          const completedCount = task.subtasks.filter(s => s.completed).length;
          const totalSubtasks = task.subtasks.length;

          return (
            <div key={task.id} className="task-history-item" onClick={() => handleToggle(task.id!)}>
              <div className="task-history-row">
                <span className="chevron">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                
                <span className="task-history-title">{task.title}</span>
                
                <div className="task-history-meta">
                  <span className={`badge badge-${task.priority.toLowerCase()}`} style={{ opacity: 0.8 }}>
                    {task.priority}
                  </span>
                  <span className="badge" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                    {task.category}
                  </span>
                  {task.dueDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} /> {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="task-history-details" onClick={(e) => e.stopPropagation()}>
                  {task.description && (
                    <p><strong>Descripción:</strong> {task.description}</p>
                  )}
                  
                  {totalSubtasks > 0 && (
                    <p><strong>Subtareas:</strong> {completedCount}/{totalSubtasks} completadas</p>
                  )}
                  
                  <div className="task-history-actions">
                    <button className="btn btn-secondary" onClick={(e) => handleRestore(e, task.id!)}>
                      <RotateCcw size={14} /> Restaurar
                    </button>
                    <button className="btn btn-danger" onClick={(e) => handleDeleteClick(e, task)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Eliminar permanentemente"
        message={`¿Estás seguro de eliminar permanentemente "${taskToDelete?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
