import { parseISO, differenceInDays, getDay, startOfDay } from 'date-fns';
import type { Habit } from '../types/habit';

/**
 * Determina si un hábito debe realizarse en una fecha específica según su frecuencia.
 * 
 * @param habit El hábito a evaluar
 * @param dateStr La fecha a consultar en formato 'YYYY-MM-DD'
 * @returns true si el hábito está programado para ese día, false si no.
 */
export function isHabitScheduledOnDate(habit: Habit, dateStr: string): boolean {
  const { frequency } = habit;
  
  // Si no hay frecuencia definida (datos antiguos), asumimos diario
  if (!frequency || frequency.type === 'daily') {
    return true;
  }

  const targetDate = startOfDay(parseISO(dateStr));
  
  if (frequency.type === 'weekly') {
    // getDay() devuelve 0 para Domingo, 1 para Lunes... 6 para Sábado
    const dayOfWeek = getDay(targetDate);
    if (!frequency.daysOfWeek || frequency.daysOfWeek.length === 0) {
      return true; // Fallback a diario si no se configuraron días
    }
    return frequency.daysOfWeek.includes(dayOfWeek);
  }

  if (frequency.type === 'interval') {
    if (!frequency.interval || frequency.interval <= 1) {
      return true;
    }
    
    // Si no hay fecha de inicio definida, usamos la fecha de creación del hábito
    const startDateStr = frequency.startDate || habit.createdAt.split('T')[0];
    const startDate = startOfDay(parseISO(startDateStr));
    
    // Solo mostramos hábitos después de su fecha de inicio
    if (targetDate < startDate) {
      return false;
    }

    const diffDays = differenceInDays(targetDate, startDate);
    
    // Si la diferencia de días es múltiplo del intervalo, toca hoy.
    // Ejemplo: intervalo 3 (cada 3 días). diff=0 (toca), diff=1 (no), diff=2 (no), diff=3 (toca)
    return diffDays % frequency.interval === 0;
  }

  return true;
}
