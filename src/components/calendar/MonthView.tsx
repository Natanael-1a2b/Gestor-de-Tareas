import { useState, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Clock } from 'lucide-react';
import type { Task } from '../../types';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  onDayClick: (date: Date) => void;
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
}

function DraggableTask({ task, onClick }: { task: Task; onClick: (t: Task, e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id!,
    data: { type: 'Task', task }
  });

  const style = {
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="month-cell-task"
      onClick={(e) => {
        // Only trigger click if we aren't dragging
        if (!isDragging) {
          onClick(task, e);
        }
      }}
      title={`${task.title} - ${task.priority}`}
    >
      <span style={{ 
        display: 'inline-block', 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        backgroundColor: `var(--cat-${task.category.toLowerCase()})`,
        marginRight: '4px'
      }}></span>
      {task.title}
      {task.dueDate && <Clock size={8} style={{ marginLeft: '4px', display: 'inline-block' }} />}
    </div>
  );
}

function DroppableDay({ 
  date, 
  currentDate, 
  tasks, 
  onDayClick, 
  onTaskClick 
}: { 
  date: Date; 
  currentDate: Date; 
  tasks: Task[]; 
  onDayClick: (d: Date) => void;
  onTaskClick: (t: Task, e: React.MouseEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr }
  });

  const isCurrentMonth = isSameMonth(date, currentDate);
  const isCurrentDay = isToday(date);
  
  const visibleTasks = expanded ? tasks : tasks.slice(0, 3);
  const hasMore = tasks.length > 3;

  return (
    <div 
      ref={setNodeRef}
      className={`month-cell ${!isCurrentMonth ? 'is-other-month' : ''} ${isCurrentDay ? 'is-today' : ''} ${isOver ? 'is-over' : ''}`}
      onClick={() => onDayClick(date)}
      style={{
        position: expanded ? 'absolute' : 'relative',
        zIndex: expanded ? 50 : 1,
        height: expanded ? 'auto' : '100%',
        minHeight: expanded ? '150px' : '100%',
        boxShadow: expanded ? 'var(--shadow-xl)' : 'none',
        border: expanded ? '1px solid var(--accent)' : 'none',
        borderRadius: expanded ? 'var(--radius-md)' : '0'
      }}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="month-cell-header">
        <span className="month-cell-day">{format(date, 'd')}</span>
      </div>
      
      <div className="month-cell-tasks-container">
        {visibleTasks.map(task => (
          <DraggableTask key={task.id} task={task} onClick={onTaskClick} />
        ))}
      </div>

      {!expanded && hasMore && (
        <div 
          className="month-cell-more"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
        >
          +{tasks.length - 3} más
        </div>
      )}

      {/* Mobile dots visualization */}
      <div className="month-cell-dots">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="month-cell-dot" 
            style={{ backgroundColor: `var(--cat-${task.category.toLowerCase()})` }} 
          />
        ))}
      </div>
    </div>
  );
}

export function MonthView({ currentDate, tasks, onDayClick, onTaskClick }: MonthViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    
    const dateArray = [];
    let current = start;
    
    while (current <= end) {
      dateArray.push(current);
      current = addDays(current, 1);
    }
    
    return dateArray;
  }, [currentDate]);

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="month-grid">
      {weekDays.map(day => (
        <div key={day} className="month-header-cell">{day}</div>
      ))}
      
      {days.map((day, i) => {
        const dayTasks = tasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate + 'T12:00:00'), day));
        
        return (
          <DroppableDay 
            key={i} 
            date={day} 
            currentDate={currentDate} 
            tasks={dayTasks}
            onDayClick={onDayClick}
            onTaskClick={onTaskClick}
          />
        );
      })}
    </div>
  );
}
