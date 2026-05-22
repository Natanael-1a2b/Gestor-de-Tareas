import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import type { Habit } from '../../types/habit';

interface Props {
  habit: Habit;
  onEdit: (id: string) => void;
  onDelete: (habit: Habit) => void;
  children: React.ReactNode;
}

export function SortableHabitRow({ habit, onEdit, onDelete, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? 'var(--shadow-lg)' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={`grid-row habit-row ${isDragging ? 'dragging' : ''}`}>
      <div className="habit-info-col">
        <div className="habit-title-wrapper">
          <button 
            className="drag-handle" 
            {...attributes} 
            {...listeners}
            aria-label={`Reordenar hábito ${habit.title}`}
          >
            <GripVertical size={16} />
          </button>
          <div className="habit-color-indicator" style={{ backgroundColor: habit.color }} />
          <div>
            <div className="habit-title">{habit.title}</div>
            <div className="habit-category">{habit.category}</div>
          </div>
        </div>
        <div className="habit-actions">
          <button className="action-btn" onClick={() => onEdit(habit.id)} title="Editar hábito">
            <Edit2 size={16} />
          </button>
          <button 
            className="action-btn delete" 
            onClick={() => onDelete(habit)} 
            title="Eliminar hábito"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="days-col">
        {children}
      </div>
    </div>
  );
}
