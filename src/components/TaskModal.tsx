import { useState, useEffect, useRef, ViewTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task, Priority, Category, Status } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
  defaultScheduledDate?: string;
}

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];
const CATEGORIES: Category[] = ['Ministerio', 'Trabajo', 'Estudio', 'Personal', 'Evento'];
const STATUSES: Status[] = ['Por hacer', 'En proceso', 'Completadas', 'Canceladas'];

export function TaskModal({ isOpen, onClose, editTask, defaultScheduledDate }: TaskModalProps) {
  // Key-based remount: React resets all state when key changes
  const formKey = editTask?.id ?? (defaultScheduledDate ? `new-${defaultScheduledDate}` : 'new');

  return (
    <ViewTransition enter="slide-up" exit="slide-down" default="none">
      {isOpen && (
        <TaskModalForm
          key={formKey}
          onClose={onClose}
          editTask={editTask}
          defaultScheduledDate={defaultScheduledDate}
        />
      )}
    </ViewTransition>
  );
}

function TaskModalForm({ onClose, editTask, defaultScheduledDate }: Omit<TaskModalProps, 'isOpen'>) {
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const titleRef = useRef<HTMLInputElement>(null);

  // State initialized directly from props — no effect needed
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [scheduledDate, setScheduledDate] = useState(editTask?.scheduledDate ?? defaultScheduledDate ?? '');
  const [dueDate, setDueDate] = useState(editTask?.dueDate ?? '');
  const [priority, setPriority] = useState<Priority>(editTask?.priority ?? 'Media');
  const [category, setCategory] = useState<Category>(editTask?.category ?? 'Personal');
  const [status, setStatus] = useState<Status>(editTask?.status ?? 'Por hacer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEvento = category === 'Evento';
  const isEditingEvento = !!editTask && editTask.category === 'Evento';

  // Auto-focus en título
  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    const taskData = {
      title: title.trim(),
      description,
      scheduledDate: scheduledDate,
      dueDate: isEvento ? '' : dueDate,
      priority,
      category,
      status,
      subtasks: editTask?.subtasks ?? [],
    };

    setIsSubmitting(true);
    try {
      if (editTask?.id) {
        await updateTask(editTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      onClose(); // Solo cerramos si la operación fue exitosa
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      // El toast ya lo dispara el store (en teoría), pero aquí aseguramos que el modal siga abierto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editTask?.id || isSubmitting) return;
    if (window.confirm(`¿Estás seguro de eliminar "${editTask.title}"? Esta acción no se puede deshacer.`)) {
      setIsSubmitting(true);
      try {
        await deleteTask(editTask.id);
        onClose();
      } catch (error) {
        console.error('Error al eliminar la tarea:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        className="modal card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={editTask ? (isEvento ? 'Editar evento' : 'Editar tarea') : 'Nueva tarea'}
      >
        <div className="modal-header">
          <h2>{editTask ? (isEvento ? 'Editar Evento' : 'Editar Tarea') : (isEvento ? 'Nuevo Evento' : 'Nueva Tarea')}</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Título */}
          <div className="form-group">
            <label htmlFor="task-title">Título *</label>
            <input
              ref={titleRef}
              id="task-title"
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              required
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label htmlFor="task-desc">Descripción</label>
            <textarea
              id="task-desc"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          {/* Fila de selectores */}
          <div className="form-row">
            {!isEvento && (
              <div className="form-group">
                <label htmlFor="task-priority">Prioridad *</label>
                <select
                  id="task-priority"
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="task-category">Categoría *</label>
              <select
                id="task-category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={isEditingEvento}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-scheduled">Fecha programada</label>
              <input
                id="task-scheduled"
                className="input"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            {!isEvento && (
              <div className="form-group">
                <label htmlFor="task-date">Fecha límite</label>
                <input
                  id="task-date"
                  className="input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {editTask && !isEvento && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-status">Estado</label>
                <select
                  id="task-status"
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ display: 'flex', justifyContent: editTask ? 'space-between' : 'flex-end', width: '100%' }}>
            {editTask && (
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={handleDelete} 
                disabled={isSubmitting} 
                style={{ color: 'var(--priority-alta)' }}
              >
                <Trash2 size={16} style={{ marginRight: '4px' }} />
                Eliminar
              </button>
            )}
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!title.trim() || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  editTask ? 'Guardar Cambios' : (isEvento ? 'Crear Evento' : 'Crear Tarea')
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
