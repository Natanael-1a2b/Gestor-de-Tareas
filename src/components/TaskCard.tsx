import { useState, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Pencil, Type, Trash2, Calendar, XCircle, ChevronDown, ChevronUp, Archive, RefreshCcw, Inbox, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { ConfirmDialog } from './ConfirmDialog';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  searchQuery?: string;
  index?: number; // for staggered animation
}

/* ─── Search Highlight Helper ─── */
function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function TaskCard({ task, onEdit, searchQuery, index = 0 }: TaskCardProps) {
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const removeSubtask = useTaskStore((s) => s.removeSubtask);
  const archiveTask = useTaskStore((s) => s.archiveTask);

  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(task.title);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
    animationDelay: `${index * 40}ms`,
  };

  // Detección de tarea vencida
  const isOverdue =
    task.dueDate &&
    task.status !== 'Completadas' &&
    task.status !== 'Canceladas' &&
    new Date(task.dueDate + 'T12:00:00') < new Date();

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

  const handleDelete = useCallback(() => {
    setShowMenu(false);
    setConfirmDelete(true);
  }, []);

  const confirmDeleteTask = useCallback(() => {
    deleteTask(task.id!);
    setConfirmDelete(false);
  }, [deleteTask, task.id]);

  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const hasDescription = task.description && task.description.trim().length > 0;

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          cardRef.current = node as HTMLDivElement;
        }}
        style={style}
        className={`card kanban-card card-enter
          ${isOverdue ? 'kanban-card--overdue' : ''} 
          kanban-card--${task.status.toLowerCase().replace(' ', '-')} 
          kanban-card--cat-${task.category.toLowerCase()}
          ${showMenu ? 'kanban-card--active' : ''}
        `}
        onClick={(e) => {
          // Si el clic es en un elemento interactivo (botón, input, label), no abrir el menú
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('input') ||
            target.closest('.subtask-item') ||
            target.closest('.kanban-card-drag')
          ) {
            return;
          }
          setShowMenu(!showMenu);
        }}
      >
        {/* Drag handle + header */}
        <div className="kanban-card-drag" {...attributes} {...listeners}>
          <GripVertical className="drag-handle" size={14} aria-label="Arrastrar" />
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
              <MoreVertical size={15} />
            </button>
            {showMenu && (
              <div className="kanban-card-menu">
                {task.status === 'Completadas' && (
                  <button onClick={() => { archiveTask(task.id!); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Archive size={13} /> Archivar
                  </button>
                )}

                <div className="menu-divider" />
                <div className="menu-section-label">Mover a:</div>

                {task.status !== 'Por hacer' && (
                  <button onClick={() => { updateTaskStatus(task.id!, 'Por hacer'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Inbox size={13} /> Por Hacer
                  </button>
                )}
                {task.status !== 'En proceso' && (
                  <button onClick={() => { updateTaskStatus(task.id!, 'En proceso'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCcw size={13} /> En Proceso
                  </button>
                )}
                {task.status !== 'Completadas' && (
                  <button onClick={() => { updateTaskStatus(task.id!, 'Completadas'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={13} /> Completada
                  </button>
                )}
                {task.status !== 'Canceladas' && (
                  <button onClick={() => { updateTaskStatus(task.id!, 'Canceladas'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={13} /> Cancelar o Posponer
                  </button>
                )}

                <div className="menu-divider" />
                <button onClick={() => { setIsInlineEdit(true); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Type size={13} /> Renombrar
                </button>
                <button onClick={() => { onEdit(task); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Pencil size={13} /> Editar
                </button>
                <button className="danger" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={13} /> Eliminar
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
            aria-label="Editar título de la tarea"
          />
        ) : (
          <h4
            className="kanban-card-title"
            onDoubleClick={() => setIsInlineEdit(true)}
            title="Doble clic para editar"
          >
            <HighlightText text={task.title} query={searchQuery} />
          </h4>
        )}

        {/* Description preview */}
        {hasDescription && (
          <div className="kanban-card-desc-wrapper">
            <button
              className="kanban-card-desc-toggle"
              onClick={() => setShowDescription(!showDescription)}
              aria-expanded={showDescription}
              aria-label={showDescription ? "Ocultar descripción" : "Mostrar descripción"}
            >
              <span className="kanban-card-desc-label">Descripción</span>
              {showDescription ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showDescription && (
              <p className="kanban-card-desc">{task.description}</p>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="kanban-card-meta">
          <span className="kanban-card-category">{task.category}</span>
          {task.dueDate && (
            <span className={`kanban-card-date ${isOverdue ? 'overdue' : ''}`}>
              <Calendar size={11} /> {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('es-ES')}
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
        {(showSubtasks || totalSubtasks > 0) && (
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
                aria-label="Agregar nueva subtarea"
              />
            </form>
          </div>
        )}

        {/* Visible Archive Button for Completed Tasks */}
        {task.status === 'Completadas' && (
          <button
            className="btn btn-secondary"
            onClick={() => archiveTask(task.id!)}
            style={{ marginTop: 'var(--space-sm)', width: '100%', justifyContent: 'center' }}
          >
            <Archive size={14} /> Enviar al Historial
          </button>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Eliminar tarea"
        message={`¿Estás seguro de eliminar "${task.title}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteTask}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
