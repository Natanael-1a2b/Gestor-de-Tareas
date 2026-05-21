import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskModal } from '../TaskModal';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';
import { DayTaskList } from './DayTaskList';
import type { Task } from '../../types';
import './CalendarView.css';

type ViewMode = 'week' | 'month' | 'year';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // TaskModal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultScheduledDate, setDefaultScheduledDate] = useState<string | undefined>(undefined);

  const tasks = useTaskStore(useShallow(s => s.getFilteredTasks()));
  const updateTaskScheduledDate = useTaskStore(s => s.updateTaskScheduledDate);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
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
    return tasks.filter(t => t.scheduledDate === dateStr);
  }, [tasks, selectedDay]);

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
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          {view === 'month' && (
            <MonthView 
              currentDate={currentDate} 
              tasks={tasks} 
              onDayClick={handleDayClick} 
              onTaskClick={handleTaskClick} 
            />
          )}
          {view === 'week' && (
            <WeekView 
              currentDate={currentDate} 
              tasks={tasks} 
              onAddTask={handleAddTask} 
              onTaskClick={handleTaskClick} 
            />
          )}
          {view === 'year' && (
            <YearView 
              currentDate={currentDate} 
              tasks={tasks} 
              onMonthClick={(date) => {
                setCurrentDate(date);
                setView('month');
              }} 
            />
          )}
        </div>
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
          onAddTask={handleAddTask}
        />
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editTask={editingTask}
        defaultScheduledDate={defaultScheduledDate}
      />
    </div>
  );
}
