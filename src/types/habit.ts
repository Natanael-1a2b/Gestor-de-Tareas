import type { Category } from './index';

export type HabitFrequencyType = 'daily' | 'weekly' | 'interval';

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek?: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  interval?: number; // Ej. cada 2 días
  startDate?: string; // Fecha base para calcular el intervalo
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: Category;
  color: string;
  orderIndex: number;
  frequency: HabitFrequency;
  createdAt: string;
}

export type HabitLogStatus = 'completed' | 'skipped' | 'none';

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // Formato YYYY-MM-DD
  status: HabitLogStatus;
  createdAt: string;
}
