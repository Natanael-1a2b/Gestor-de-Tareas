import { useState, useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useTaskStore } from '../store/useTaskStore';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { FilterBar } from './FilterBar';
import { SkeletonColumn } from './Skeleton';
import type { Task, Status } from '../services/db';
import { Inbox, RefreshCcw, CheckCircle2, XCircle, Plus, AlertTriangle } from 'lucide-react';

const COLUMNS: { status: Status; label: string; icon: React.FC<{ size?: number | string; className?: string }> }[] = [
  { status: 'Por hacer', label: 'Por Hacer', icon: Inbox },
  { status: 'En proceso', label: 'En Proceso', icon: RefreshCcw },
  { status: 'Completadas', label: 'Completadas', icon: CheckCircle2 },
  { status: 'Canceladas', label: 'Cancelada o Pospuesta', icon: XCircle },
];

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <div className="kanban-empty-state">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8" y="12" width="48" height="40" rx="6" stroke="var(--border-hover)" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="16" y="22" width="32" height="4" rx="2" fill="var(--border)" />
        <rect x="16" y="30" width="24" height="4" rx="2" fill="var(--border)" opacity="0.6" />
        <rect x="16" y="38" width="28" height="4" rx="2" fill="var(--border)" opacity="0.3" />
        <circle cx="50" cy="46" r="10" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1.5" />
        <path d="M50 42v8M46 46h8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p>Sin tareas</p>
    </div>
  );
}

/* ─── Droppable Column Wrapper ─── */
function DroppableColumn({
  status,
  label,
  icon: Icon,
  tasks,
  onEdit,
  searchQuery,
}: {
  status: Status;
  label: string;
  icon: React.FC<{ size?: number | string; className?: string }>;
  tasks: Task[];
  onEdit: (task: Task) => void;
  searchQuery?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
    >
      <div className="kanban-column-header">
        <Icon size={16} aria-hidden="true" />
        <h3>{label}</h3>
        <span className="kanban-count">{tasks.length}</span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id!.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column-body">
          {tasks.length === 0 ? (
            <EmptyState />
          ) : (
            tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                searchQuery={searchQuery}
                index={i}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ─── Kanban Board ─── */
export function KanbanBoard() {
  const filteredTasks = useTaskStore(useShallow((s) => s.getFilteredTasks(true)));
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const filters = useTaskStore((s) => s.filters);

  const getTasksByStatus = useCallback((status: Status) => {
    return filteredTasks.filter(t => t.status === status);
  }, [filteredTasks]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /* ─── Counters ─── */
  const stats = useMemo(() => {
    const total = tasks.length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'Completadas' || t.status === 'Canceladas') return false;
      return new Date(t.dueDate + 'T12:00:00') < new Date();
    }).length;
    const inProgress = tasks.filter(t => t.status === 'En proceso').length;
    return { total, overdue, inProgress };
  }, [tasks]);

  /* ─── Keyboard Shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape' && modalOpen) {
        e.preventDefault();
        setModalOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTask(null);
        setModalOpen(true);
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('.filter-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id.toString();
    const overId = over.id.toString();

    const targetColumn = COLUMNS.find((col) => col.status === overId);
    if (targetColumn) {
      updateTaskStatus(taskId, targetColumn.status);
      return;
    }

    const targetTask = tasks.find((t) => t.id!.toString() === overId);
    if (targetTask) {
      updateTaskStatus(taskId, targetTask.status);
    }
  };

  const activeTask = activeId
    ? tasks.find((t) => t.id!.toString() === activeId)
    : null;

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="kanban-board">
        <div className="kanban-header">
          <h2>Panel de Tareas</h2>
        </div>
        <div className="kanban-columns">
          <SkeletonColumn />
          <SkeletonColumn />
          <SkeletonColumn />
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <div>
          <h2>Panel de Tareas</h2>
          <div className="kanban-stats">
            <span>{stats.total} tareas</span>
            {stats.inProgress > 0 && <span className="stat-progress">{stats.inProgress} en proceso</span>}
            {stats.overdue > 0 && (
              <span className="stat-overdue">
                <AlertTriangle size={12} /> {stats.overdue} vencida{stats.overdue > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="kanban-header-actions">
          <span className="keyboard-hint" title="Atajo: N">
            <kbd>N</kbd> Nueva
          </span>
          <span className="keyboard-hint" title="Atajo: /">
            <kbd>/</kbd> Buscar
          </span>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={16} /> Nueva Tarea
          </button>
        </div>
      </div>

      <FilterBar />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.status}
              status={col.status}
              label={col.label}
              icon={col.icon}
              tasks={getTasksByStatus(col.status)}
              onEdit={handleEdit}
              searchQuery={filters.search}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="card kanban-card kanban-card--dragging">
              <h4 className="kanban-card-title">{activeTask.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        editTask={editingTask}
      />
    </div>
  );
}
