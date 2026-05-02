import { useState, useEffect, useRef, ViewTransition } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task, Priority, Category, Status } from '../services/db';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];
const CATEGORIES: Category[] = ['Ministerio', 'Trabajo', 'Estudio', 'Personal'];
const STATUSES: Status[] = ['Por hacer', 'En proceso', 'Completadas', 'Canceladas'];

export function TaskModal({ isOpen, onClose, editTask }: TaskModalProps) {
  // Key-based remount: React resets all state when key changes
  const formKey = editTask?.id ?? 'new';

  return (
    <ViewTransition enter="slide-up" exit="slide-down" default="none">
      {isOpen && (
        <TaskModalForm
          key={formKey}
          onClose={onClose}
          editTask={editTask}
        />
      )}
    </ViewTransition>
  );
}

function TaskModalForm({ onClose, editTask }: Omit<TaskModalProps, 'isOpen'>) {
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const titleRef = useRef<HTMLInputElement>(null);

  // State initialized directly from props — no effect needed
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [dueDate, setDueDate] = useState(editTask?.dueDate ?? '');
  const [priority, setPriority] = useState<Priority>(editTask?.priority ?? 'Media');
  const [category, setCategory] = useState<Category>(editTask?.category ?? 'Personal');
  const [status, setStatus] = useState<Status>(editTask?.status ?? 'Por hacer');

  // Auto-focus en título
  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description,
      dueDate: dueDate || undefined,
      priority,
      category,
      status,
      subtasks: editTask?.subtasks ?? [],
    };

    if (editTask?.id) {
      await updateTask(editTask.id, taskData);
    } else {
      await addTask(taskData);
    }

    onClose();
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
        aria-label={editTask ? 'Editar tarea' : 'Nueva tarea'}
      >
        <div className="modal-header">
          <h2>{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
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

            <div className="form-group">
              <label htmlFor="task-category">Categoría *</label>
              <select
                id="task-category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
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

            {editTask && (
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
            )}
          </div>

          {/* Acciones */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {editTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
