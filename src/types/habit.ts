import type { Category } from './index';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: Category;
  color: string;
  orderIndex: number;
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
