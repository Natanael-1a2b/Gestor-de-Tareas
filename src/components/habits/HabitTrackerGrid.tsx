import { useMemo, useState } from 'react';
import { format, addDays, isToday, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useHabitStore } from '../../store/useHabitStore';
import type { Habit } from '../../types/habit';
import { isHabitScheduledOnDate } from '../../utils/habitFrequency';
import { ConfirmDialog } from '../ConfirmDialog';
import { SortableHabitRow } from './SortableHabitRow';
import './HabitTrackerGrid.css';

interface Props {
  onEditHabit: (habitId: string) => void;
  searchQuery?: string;
}

export function HabitTrackerGrid({ onEditHabit, searchQuery = '' }: Props) {
  const { habits: allHabits, logs, currentDate, prevPeriod, nextPeriod, goToToday, viewMode, setViewMode, toggleHabitLog, deleteHabit } = useHabitStore();
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const habits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allHabits;
    return allHabits.filter((h) => h.title.toLowerCase().includes(query));
  }, [allHabits, searchQuery]);

  const displayDays = useMemo(() => {
    if (viewMode === 'week') {
      return Array.from({ length: 7 }).map((_, i) => addDays(currentDate, i));
    } else {
      const start = startOfMonth(currentDate);
      const daysInMonth = getDaysInMonth(start);
      return Array.from({ length: daysInMonth }).map((_, i) => addDays(start, i));
    }
  }, [currentDate, viewMode]);

  const handleCellClick = (habitId: string, dateStr: string) => {
    toggleHabitLog(habitId, dateStr);
  };

  const getCellContent = (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isScheduled = isHabitScheduledOnDate(habit, dateStr);
    const status = logs[habit.id]?.[dateStr] || 'none';

    // Si no está programado, PERO tiene un registro histórico (completado o saltado), lo mostramos.
    if (!isScheduled && status === 'none') {
      return (
        <div key={dateStr} className="habit-cell disabled" title="No programado para este día">
          <div className="cell-content-inner">
            <div className="disabled-dot" />
          </div>
        </div>
      );
    }

    let content = null;
    let className = 'habit-cell';
    let style = {};

    if (status === 'completed') {
      content = <Check size={16} />;
      className += ' completed';
      style = { backgroundColor: habit.color, borderColor: habit.color };
    } else if (status === 'skipped') {
      content = <XIcon size={16} />;
      className += ' skipped';
    } else {
      className += ' none';
    }

    const isCurrentDay = isToday(date);
    if (isCurrentDay) className += ' today';

    return (
      <button
        key={dateStr}
        className={className}
        style={style}
        onClick={() => handleCellClick(habit.id, dateStr)}
        aria-label={`Marcar ${habit.title} para ${format(date, 'PPPP', { locale: es })}`}
        title={format(date, 'PPPP', { locale: es })}
      >
        <div className="cell-content-inner">
          {content}
        </div>
      </button>
    );
  };

  return (
    <div className="habit-grid-container">
      <div className="habit-grid-header">
        <div className="view-mode-selector app-nav">
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>
            Semana
          </button>
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>
            Mes
          </button>
        </div>

        <div className="week-navigation">
          <button className="btn btn-ghost" onClick={prevPeriod} aria-label="Anterior">
            <ChevronLeft size={20} />
          </button>
          <span className="week-label">
            {viewMode === 'week' 
              ? `${format(displayDays[0], 'd MMM', { locale: es })} - ${format(displayDays[6], 'd MMM yyyy', { locale: es })}`
              : format(currentDate, 'MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase())
            }
          </span>
          <button className="btn btn-ghost" onClick={nextPeriod} aria-label="Siguiente">
            <ChevronRight size={20} />
          </button>
          <button className="btn btn-outline btn-sm today-btn" onClick={goToToday}>
            Hoy
          </button>
        </div>
      </div>

      <div className={`habit-grid ${viewMode === 'month' ? 'monthly-view' : ''}`}>
        <div className="grid-row grid-header-row">
          <div className="habit-info-col">Hábitos</div>
          <div className="days-col">
            {displayDays.map(date => (
              <div key={date.toISOString()} className={`day-header ${isToday(date) ? 'today' : ''}`}>
                <span className="day-name">{format(date, 'EEE', { locale: es })}</span>
                <span className="day-number">{format(date, 'd')}</span>
              </div>
            ))}
          </div>
        </div>

        {allHabits.length === 0 ? (
          <div className="empty-habits">
            <p>No tienes hábitos registrados. ¡Crea uno para empezar!</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="empty-habits">
            <p>No se encontraron hábitos para "{searchQuery}".</p>
          </div>
        ) : (
          <SortableContext
            items={habits.map(h => h.id)}
            strategy={verticalListSortingStrategy}
          >
            {habits.map(habit => (
              <SortableHabitRow
                key={habit.id}
                habit={habit}
                onEdit={onEditHabit}
                onDelete={setHabitToDelete}
              >
                {displayDays.map(date => getCellContent(habit, date))}
              </SortableHabitRow>
            ))}
          </SortableContext>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!habitToDelete}
        title="Mover a la papelera"
        message={`"${habitToDelete?.title}" se moverá a la papelera junto con su historial. Podrás restaurarlo desde ahí antes de que se borre definitivamente en 30 días.`}
        confirmLabel="Mover a la papelera"
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
        onCancel={() => setHabitToDelete(null)}
      />
    </div>
  );
}
