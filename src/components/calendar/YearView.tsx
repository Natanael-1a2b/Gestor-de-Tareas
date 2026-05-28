import { useMemo } from 'react';
import { format, startOfYear, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '../../types';

interface YearViewProps {
  currentDate: Date;
  tasks: Task[];
  onMonthClick: (date: Date) => void;
}

export function YearView({ currentDate, tasks, onMonthClick }: YearViewProps) {
  const months = useMemo(() => {
    const start = startOfYear(currentDate);
    return Array.from({ length: 12 }).map((_, i) => addMonths(start, i));
  }, [currentDate]);

  return (
    <div className="year-grid">
      {months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const isCurrentMonth = isSameMonth(month, new Date());
        
        // Contar tareas en este mes
        let totalTasks = 0;
        
        return (
          <div 
            key={month.toISOString()} 
            className={`year-month card ${isCurrentMonth ? 'is-current-month' : ''}`} 
            onClick={() => onMonthClick(month)}
          >
            <div className="year-month-header">
              <h3 style={{ textTransform: 'capitalize' }}>{format(month, 'MMMM', { locale: es })}</h3>
              {isCurrentMonth && <span className="current-month-badge">Actual</span>}
            </div>
            
            <div className="year-mini-grid">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                <div key={d} className="year-mini-header">{d}</div>
              ))}
              
              {Array.from({ length: (getDay(monthStart) + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="year-mini-cell empty" />
              ))}

              {daysInMonth.map(day => {
                const dayTasksCount = tasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate + 'T12:00:00'), day)).length;
                totalTasks += dayTasksCount;
                
                let intensityClass = '';
                if (dayTasksCount > 0) {
                  if (dayTasksCount <= 1) intensityClass = 'has-tasks-1';
                  else if (dayTasksCount <= 3) intensityClass = 'has-tasks-2';
                  else if (dayTasksCount <= 5) intensityClass = 'has-tasks-3';
                  else intensityClass = 'has-tasks-4';
                }
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className={`year-mini-cell ${intensityClass}`}
                    title={`${format(day, 'd MMM', { locale: es })}: ${dayTasksCount} tareas`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {totalTasks} {totalTasks === 1 ? 'tarea' : 'tareas'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
