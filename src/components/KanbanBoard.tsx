import { useState, useCallback } from 'react';
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
import type { Task, Status } from '../services/db';

const COLUMNS: { status: Status; label: string; emoji: string }[] = [
  { status: 'Por hacer', label: 'Por Hacer', emoji: '📥' },
  { status: 'En proceso', label: 'En Proceso', emoji: '🔄' },
  { status: 'Completadas', label: 'Completadas', emoji: '✅' },
  { status: 'Pospuestas', label: 'Pospuestas', emoji: '⏸️' },
  { status: 'Canceladas', label: 'Canceladas', emoji: '❌' },
];

/* ─── Droppable Column Wrapper ─── */
function DroppableColumn({
  status,
  label,
  emoji,
  tasks,
  onEdit,
}: {
  status: Status;
  label: string;
  emoji: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
    >
      <div className="kanban-column-header">
        <span aria-hidden="true">{emoji}</span>
        <h3>{label}</h3>
        <span className="kanban-count">{tasks.length}</span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id!.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column-body">
          {tasks.length === 0 ? (
            <p className="kanban-empty">Sin tareas</p>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ─── Kanban Board ─── */
export function KanbanBoard() {
  const getTasksByStatus = useTaskStore((s) => s.getTasksByStatus);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const tasks = useTaskStore((s) => s.tasks);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const overId = over.id.toString();

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((col) => col.status === overId);
    if (targetColumn) {
      updateTaskStatus(taskId, targetColumn.status);
      return;
    }

    // Check if dropped on another card — find that card's column
    const targetTask = tasks.find((t) => t.id!.toString() === overId);
    if (targetTask) {
      updateTaskStatus(taskId, targetTask.status);
    }
  };

  const activeTask = activeId
    ? tasks.find((t) => t.id!.toString() === activeId)
    : null;

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>Tablero Kanban</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Nueva Tarea
        </button>
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
              emoji={col.emoji}
              tasks={getTasksByStatus(col.status)}
              onEdit={handleEdit}
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
        onClose={() => setModalOpen(false)}
        editTask={editingTask}
      />
    </div>
  );
}
