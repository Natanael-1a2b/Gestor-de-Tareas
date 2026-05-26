import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, useDroppable, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskModal } from '../TaskModal';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';
import { DayTaskList } from './DayTaskList';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Task } from '../../types';
import './CalendarView.css';

type ViewMode = 'week' | 'month' | 'year';

function TrashDropZone() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'trash-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`calendar-trash-zone ${isOver ? 'is-over' : ''}`}
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: isOver ? 'var(--priority-alta)' : 'var(--bg-secondary)',
        color: isOver ? 'var(--bg-primary)' : 'var(--priority-alta)',
        padding: '12px 24px',
        borderRadius: 'var(--radius-full)',
        boxShadow: isOver ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'var(--shadow-xl)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: `2px solid var(--priority-alta)`,
        zIndex: 1000,
        transition: 'all var(--transition-fast)',
        pointerEvents: 'none', // Lets mouse events pass through if needed, though dnd-kit handles this
      }}
    >
      <Trash2 size={20} />
      <span style={{ fontWeight: 600 }}>Soltar para eliminar</span>
    </div>
  );
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  
  // TaskModal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultScheduledDate, setDefaultScheduledDate] = useState<string | undefined>(undefined);

  const tasks = useTaskStore(useShallow(s => s.getFilteredTasks()));
  
  // Ocultar tareas completadas, canceladas o archivadas del calendario
  const activeTasks = useMemo(() => {
    return tasks.filter(t => !['Completadas', 'Canceladas', 'Archivada'].includes(t.status));
  }, [tasks]);

  const updateTaskScheduledDate = useTaskStore(s => s.updateTaskScheduledDate);
  const deleteTask = useTaskStore(s => s.deleteTask);

  // Configure sensors to distinguish clicks from drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires dragging 5px before starting a drag, allowing clicks to fire
      },
    })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isInput || modalOpen) return;

      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 't' || e.key === 'T') setCurrentDate(new Date());
      if (e.key === '1') setView('week');
      if (e.key === '2') setView('month');
      if (e.key === '3') setView('year');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, currentDate, modalOpen]);

  const navigate = (direction: number) => {
    if (view === 'month') setCurrentDate(direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(direction > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(direction > 0 ? addYears(currentDate, 1) : subYears(currentDate, 1));
  };

  const formatHeaderDate = () => {
    if (view === 'year') return format(currentDate, 'yyyy');
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: es });
    return `Semana ${format(currentDate, 'w')} - ${format(currentDate, 'MMM yyyy', { locale: es })}`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setIsOverTrash(false);
    const task = activeTasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setIsOverTrash(event.over?.id === 'trash-zone');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setIsOverTrash(false);
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;

    if (over.id === 'trash-zone') {
       // Eliminar inmediatamente al soltar en la basura para mayor fluidez
       deleteTask(taskId);
       return;
    }
    
    // The over.id is formatted as `day-YYYY-MM-DD` or `week-YYYY-MM-DD`
    const dateStr = over.data.current?.date;
    
    if (dateStr) {
      updateTaskScheduledDate(taskId, dateStr);
    }
  };

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setDefaultScheduledDate(undefined);
    setModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    // For mobile or if they click an empty space in month view, show day details
    // If window is small (<768px), always show DayTaskList, otherwise we can just create
    if (window.innerWidth < 768) {
      setSelectedDay(date);
    } else {
      // Desktop: just create a new task
      handleAddTask(date);
    }
  };

  const handleAddTask = (date: Date) => {
    setEditingTask(null);
    setDefaultScheduledDate(format(date, 'yyyy-MM-dd'));
    setModalOpen(true);
    setSelectedDay(null); // Close the day list if open
  };

  // Extract tasks for the selected day for the popup
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    return activeTasks.filter(t => t.scheduledDate === dateStr);
  }, [activeTasks, selectedDay]);

  return (
    <div className="calendar-view card-enter">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn-icon" onClick={() => navigate(-1)} aria-label="Anterior">
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ textTransform: 'capitalize' }}>{formatHeaderDate()}</h2>
          <button className="btn-icon" onClick={() => navigate(1)} aria-label="Siguiente">
            <ChevronRight size={20} />
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ marginLeft: 'var(--space-sm)' }}
            onClick={() => setCurrentDate(new Date())}
            title="Ir a hoy (T)"
          >
            Hoy
          </button>
        </div>

        <div className="calendar-tabs">
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')} title="Atajo: 1">Semana</button>
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')} title="Atajo: 2">Mes</button>
          <button className={view === 'year' ? 'active' : ''} onClick={() => setView('year')} title="Atajo: 3">Año</button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="calendar-scroll-container" style={{ flex: 1, minHeight: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {view === 'month' && (
            <MonthView 
              currentDate={currentDate} 
              tasks={activeTasks} 
              onDayClick={handleDayClick} 
              onTaskClick={handleTaskClick} 
            />
          )}
          {view === 'week' && (
            <WeekView 
              currentDate={currentDate} 
              tasks={activeTasks} 
              onAddTask={handleAddTask} 
              onTaskClick={handleTaskClick}
              onDeleteTask={deleteTask}
            />
          )}
          {view === 'year' && (
            <YearView 
              currentDate={currentDate} 
              tasks={activeTasks} 
              onMonthClick={(date) => {
                setCurrentDate(date);
                setView('month');
              }} 
            />
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div
              className={view === 'week' ? 'week-task-item' : 'month-cell-task'}
              style={{
                opacity: isOverTrash ? 0.7 : 0.95,
                boxShadow: isOverTrash ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'var(--shadow-xl)',
                cursor: 'grabbing',
                transform: isOverTrash ? 'scale(0.8) rotate(5deg)' : 'scale(1.05)',
                backgroundColor: isOverTrash ? 'var(--priority-alta)' : 'var(--bg-secondary)',
                color: isOverTrash ? 'var(--bg-primary)' : 'inherit',
                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s',
                ...(view === 'month' && {
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  whiteSpace: 'nowrap',
                  borderLeft: isOverTrash ? 'none' : '2px solid var(--border)',
                }),
                ...(view === 'week' && {
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: isOverTrash ? 'none' : '1px solid var(--border)'
                })
              }}
            >
              {view === 'month' ? (
                <>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: `var(--cat-${activeTask.category.toLowerCase()})`,
                    marginRight: '4px'
                  }}></span>
                  {activeTask.title}
                </>
              ) : (
                <>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: `var(--cat-${activeTask.category.toLowerCase()})` 
                  }}></span>
                  <span style={{ fontWeight: 600, color: isOverTrash ? 'var(--bg-primary)' : 'var(--text-primary)' }}>{activeTask.title}</span>
                </>
              )}
            </div>
          ) : null}
        </DragOverlay>

        {isDragging && <TrashDropZone />}
      </DndContext>

      {selectedDay && (
        <DayTaskList 
          date={selectedDay} 
          tasks={selectedDayTasks} 
          onClose={() => setSelectedDay(null)} 
          onEditTask={(task) => {
            setSelectedDay(null);
            handleTaskClick(task, {} as any);
          }}
          onDeleteTask={deleteTask}
          onAddTask={handleAddTask}
        />
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editTask={editingTask}
        defaultScheduledDate={defaultScheduledDate}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar tarea"
        message={`¿Estás seguro de eliminar "${confirmDelete?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (confirmDelete?.id) {
            deleteTask(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
