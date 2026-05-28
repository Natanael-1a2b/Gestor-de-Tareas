import { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Task } from '../../types';

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  onAddTask: (date: Date) => void;
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  onDeleteTask: (taskId: string) => void;
}

function DraggableWeekTask({ 
  task, 
  onClick, 
  isSelected,
  onToggleSelect
}: { 
  task: Task; 
  onClick: (t: Task, e: React.MouseEvent) => void; 
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
}) {
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
      className={`week-task-item ${isSelected ? 'is-selected' : ''}`}
      onClick={(e) => {
        if (!isDragging) onClick(task, e);
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          className="week-task-select-wrapper" 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(task.id!, e);
          }}
        >
          {isSelected ? (
            <div className="week-task-checkbox-checked">
              <Check size={10} strokeWidth={3} />
            </div>
          ) : (
            <>
              <div className="week-task-checkbox-unchecked" />
              <span className="week-task-color-dot" style={{ backgroundColor: `var(--cat-${task.category.toLowerCase()})` }} />
            </>
          )}
        </div>
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
  onTaskClick,
  selectedTaskIds,
  onToggleSelect
}: { 
  date: Date; 
  tasks: Task[]; 
  onAddTask: (d: Date) => void;
  onTaskClick: (t: Task, e: React.MouseEvent) => void;
  selectedTaskIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
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
            <DraggableWeekTask 
              key={task.id} 
              task={task} 
              onClick={onTaskClick} 
              isSelected={selectedTaskIds.includes(task.id!)}
              onToggleSelect={onToggleSelect}
            />
          ))
        ) : (
          <div className="week-empty">
            Sin tareas programadas
          </div>
        )}
        
        <div 
          className="week-task-add-ghost"
          onClick={() => onAddTask(date)}
        >
          <Plus size={14} />
          <span>Añadir tarea</span>
        </div>
      </div>
    </div>
  );
}

export function WeekView({ currentDate, tasks, onAddTask, onTaskClick, onDeleteTask }: WeekViewProps) {
  const [tasksToDelete, setTasksToDelete] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id!));
    if (selectedTasks.length > 0) {
      setTasksToDelete(selectedTasks);
    }
  };

  const executeDelete = async () => {
    for (const t of tasksToDelete) {
      if (t.id) {
        onDeleteTask(t.id);
      }
    }
    setTasksToDelete([]);
    setSelectedTaskIds([]);
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    return addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
  });

  return (
    <>
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
              selectedTaskIds={selectedTaskIds}
              onToggleSelect={handleToggleSelect}
            />
          );
        })}
      </div>

      {selectedTaskIds.length > 0 && (
        <div className="selection-action-bar">
          <span style={{ fontWeight: 600 }}>{selectedTaskIds.length} seleccionada(s)</span>
          <div className="selection-actions">
            {selectedTaskIds.length === 1 && (
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const task = tasks.find(t => t.id === selectedTaskIds[0]);
                  if (task) onTaskClick(task, {} as React.MouseEvent);
                  setSelectedTaskIds([]);
                }}
              >
                <Pencil size={14} /> Editar
              </button>
            )}
            <button 
              className="btn btn-primary" 
              style={{ backgroundColor: 'var(--priority-alta)', borderColor: 'var(--priority-alta)' }}
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} /> Eliminar
            </button>
            <button className="btn-icon" onClick={() => setSelectedTaskIds([])} title="Cancelar selección">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={tasksToDelete.length > 0}
        title={tasksToDelete.length > 1 ? "Eliminar tareas" : "Eliminar tarea"}
        message={tasksToDelete.length > 1 
          ? `¿Estás seguro de eliminar ${tasksToDelete.length} tareas? Esta acción no se puede deshacer.` 
          : `¿Estás seguro de eliminar "${tasksToDelete[0]?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={executeDelete}
        onCancel={() => setTasksToDelete([])}
      />
    </>
  );
}
