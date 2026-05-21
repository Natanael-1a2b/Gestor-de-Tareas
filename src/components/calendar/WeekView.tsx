import { useDroppable, useDraggable } from '@dnd-kit/core';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Plus } from 'lucide-react';
import type { Task } from '../../types';

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  onAddTask: (date: Date) => void;
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
}

function DraggableWeekTask({ task, onClick }: { task: Task; onClick: (t: Task, e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id!,
    data: { type: 'Task', task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? 'var(--shadow-lg)' : 'none'
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="week-task-item"
      onClick={(e) => {
        if (!isDragging) onClick(task, e);
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: `var(--cat-${task.category.toLowerCase()})` 
        }}></span>
        <span style={{ fontWeight: 600 }}>{task.title}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
        <span style={{ fontSize: '0.7rem', color: `var(--cat-${task.category.toLowerCase()})`, fontWeight: 600, textTransform: 'uppercase' }}>
          {task.category}
        </span>
        {task.dueDate && (
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
            <Clock size={12} /> {task.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}

function DroppableWeekRow({ 
  date, 
  tasks, 
  onAddTask,
  onTaskClick
}: { 
  date: Date; 
  tasks: Task[]; 
  onAddTask: (d: Date) => void;
  onTaskClick: (t: Task, e: React.MouseEvent) => void;
}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const { isOver, setNodeRef } = useDroppable({
    id: `week-${dateStr}`,
    data: { date: dateStr }
  });

  const isCurrentDay = isToday(date);

  return (
    <div 
      ref={setNodeRef}
      className={`week-day-row ${isCurrentDay ? 'is-today' : ''} ${isOver ? 'is-over' : ''}`}
    >
      <div className="week-day-header">
        <span className="week-day-name">{format(date, 'EEE', { locale: es })}</span>
        <span className="week-day-number">{format(date, 'd')}</span>
      </div>
      
      <div className="week-day-tasks">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <DraggableWeekTask key={task.id} task={task} onClick={onTaskClick} />
          ))
        ) : (
          <div className="week-empty">
            Sin tareas programadas
          </div>
        )}
        
        <button 
          className="btn btn-ghost" 
          style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.75rem', marginTop: '4px' }}
          onClick={() => onAddTask(date)}
        >
          <Plus size={14} /> Agregar tarea
        </button>
      </div>
    </div>
  );
}

export function WeekView({ currentDate, tasks, onAddTask, onTaskClick }: WeekViewProps) {
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    return addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
  });

  return (
    <div className="week-grid">
      {weekDays.map((day, i) => {
        const dayTasks = tasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate + 'T12:00:00'), day));
        
        return (
          <DroppableWeekRow 
            key={i} 
            date={day} 
            tasks={dayTasks}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
          />
        );
      })}
    </div>
  );
}
