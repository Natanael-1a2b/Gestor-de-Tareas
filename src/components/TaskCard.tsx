import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../services/db';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const removeSubtask = useTaskStore((s) => s.removeSubtask);

  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(task.title);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // DnD Kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id!.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Detección de tarea vencida
  const isOverdue =
    task.dueDate &&
    task.status !== 'Completadas' &&
    task.status !== 'Canceladas' &&
    new Date(task.dueDate) < new Date();

  // Inline edit handlers
  const handleInlineSave = async () => {
    if (inlineTitle.trim() && inlineTitle !== task.title) {
      await updateTask(task.id!, { title: inlineTitle.trim() });
    }
    setIsInlineEdit(false);
  };

  const handleInlineKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInlineSave();
    if (e.key === 'Escape') {
      setInlineTitle(task.title);
      setIsInlineEdit(false);
    }
  };

  // Subtask add
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    await addSubtask(task.id!, newSubtask.trim());
    setNewSubtask('');
  };

  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card kanban-card ${isOverdue ? 'kanban-card--overdue' : ''}`}
    >
      {/* Drag handle + header */}
      <div className="kanban-card-drag" {...attributes} {...listeners}>
        <span className="drag-handle" aria-label="Arrastrar">⠿</span>
      </div>

      <div className="kanban-card-header">
        <span className={`badge badge-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        <div className="kanban-card-actions">
          <button
            className="btn-icon"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Acciones"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="kanban-card-menu">
              <button onClick={() => { onEdit(task); setShowMenu(false); }}>
                ✏️ Editar
              </button>
              <button onClick={() => { 
                useTaskStore.getState().updateTaskStatus(task.id!, 'Pospuestas'); 
                setShowMenu(false); 
              }}>
                ⏸️ Posponer
              </button>
              <button className="danger" onClick={() => { deleteTask(task.id!); setShowMenu(false); }}>
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Título (inline editable) */}
      {isInlineEdit ? (
        <input
          className="input kanban-card-inline"
          value={inlineTitle}
          onChange={(e) => setInlineTitle(e.target.value)}
          onBlur={handleInlineSave}
          onKeyDown={handleInlineKey}
          autoFocus
        />
      ) : (
        <h4
          className="kanban-card-title"
          onDoubleClick={() => setIsInlineEdit(true)}
          title="Doble clic para editar"
        >
          {task.title}
        </h4>
      )}

      {/* Meta info */}
      <div className="kanban-card-meta">
        <span className="kanban-card-category">{task.category}</span>
        {task.dueDate && (
          <span className={`kanban-card-date ${isOverdue ? 'overdue' : ''}`}>
            📅 {new Date(task.dueDate).toLocaleDateString('es-ES')}
          </span>
        )}
      </div>

      {/* Subtasks toggle */}
      {totalSubtasks > 0 && (
        <button
          className="kanban-card-subtask-toggle"
          onClick={() => setShowSubtasks(!showSubtasks)}
        >
          <span className="subtask-progress-bar">
            <span
              className="subtask-progress-fill"
              style={{ width: `${totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0}%` }}
            />
          </span>
          <span className="subtask-count">{completedCount}/{totalSubtasks}</span>
        </button>
      )}

      {/* Subtasks list */}
      {(showSubtasks || totalSubtasks === 0) && (
        <div className="kanban-card-subtasks">
          {task.subtasks.map((sub) => (
            <label key={sub.id} className="subtask-item">
              <input
                type="checkbox"
                checked={sub.completed}
                onChange={() => toggleSubtask(task.id!, sub.id)}
              />
              <span className={sub.completed ? 'completed' : ''}>{sub.title}</span>
              <button
                className="btn-icon subtask-remove"
                onClick={() => removeSubtask(task.id!, sub.id)}
                aria-label="Eliminar subtarea"
              >
                ×
              </button>
            </label>
          ))}
          <form onSubmit={handleAddSubtask} className="subtask-add">
            <input
              className="input"
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="+ Agregar subtarea"
            />
          </form>
        </div>
      )}
    </div>
  );
}
