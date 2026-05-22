import { useState, useEffect } from 'react';
import { Save, Palette } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import type { Category } from '../../types';
import type { HabitFrequency, HabitFrequencyType } from '../../types/habit';
import './HabitFormModal.css';

const PREDEFINED_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const CATEGORIES: Category[] = ['Ministerio', 'Trabajo', 'Estudio', 'Personal', 'Evento'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  habitIdToEdit?: string;
}

export function HabitFormModal({ isOpen, onClose, habitIdToEdit }: Props) {
  const habits = useHabitStore((s) => s.habits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Personal');
  const [color, setColor] = useState(PREDEFINED_COLORS[0]);
  const [freqType, setFreqType] = useState<HabitFrequencyType>('daily');
  const [freqDays, setFreqDays] = useState<number[]>([]);
  const [freqInterval, setFreqInterval] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (habitIdToEdit) {
        const habit = habits.find(h => h.id === habitIdToEdit);
        if (habit) {
          setTitle(habit.title);
          setCategory(habit.category);
          setColor(habit.color);
          if (habit.frequency) {
            setFreqType(habit.frequency.type);
            setFreqDays(habit.frequency.daysOfWeek || []);
            setFreqInterval(habit.frequency.interval || 2);
          } else {
            setFreqType('daily');
            setFreqDays([]);
            setFreqInterval(2);
          }
        }
      } else {
        setTitle('');
        setCategory('Personal');
        setColor(PREDEFINED_COLORS[0]);
        setFreqType('daily');
        setFreqDays([]);
        setFreqInterval(2);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, habitIdToEdit, habits]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const frequency: HabitFrequency = {
        type: freqType,
        daysOfWeek: freqType === 'weekly' ? freqDays : undefined,
        interval: freqType === 'interval' ? freqInterval : undefined,
        startDate: freqType === 'interval' ? new Date().toISOString().split('T')[0] : undefined
      };

      if (habitIdToEdit) {
        await updateHabit(habitIdToEdit, { title, category, color, frequency });
      } else {
        await addHabit({ title, category, color, frequency } as any);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{habitIdToEdit ? 'Editar Hábito' : 'Nuevo Hábito'}</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="habit-title">Nombre del hábito *</label>
            <input
              id="habit-title"
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Leer 20 páginas, Hacer ejercicio..."
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="habit-category">Categoría</label>
              <select
                id="habit-category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Color</label>
              <div className="input color-picker-container" style={{ padding: '0 12px' }}>
                <Palette size={16} className="color-icon" style={{ color }} />
                <div className="color-swatches">
                  {PREDEFINED_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                      aria-label={`Seleccionar color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
            <label>Frecuencia</label>
            <select
              className="input"
              value={freqType}
              onChange={(e) => setFreqType(e.target.value as HabitFrequencyType)}
            >
              <option value="daily">Todos los días</option>
              <option value="weekly">Días específicos de la semana</option>
              <option value="interval">Cada X días (Intervalo)</option>
            </select>
            
            {freqType === 'weekly' && (
              <div className="frequency-days-grid" style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, idx) => {
                  const isSelected = freqDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`freq-day-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) setFreqDays(freqDays.filter(d => d !== idx));
                        else setFreqDays([...freqDays, idx]);
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}

            {freqType === 'interval' && (
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Repetir cada</span>
                <input
                  type="number"
                  className="input"
                  min="2"
                  max="30"
                  value={freqInterval}
                  onChange={(e) => setFreqInterval(Number(e.target.value))}
                  style={{ width: '80px' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>días</span>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !title.trim()}>
              <Save size={16} style={{ marginRight: '6px' }} />
              {isSubmitting ? 'Guardando...' : 'Guardar Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
