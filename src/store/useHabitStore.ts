import { create } from 'zustand';
import { toast } from 'sonner';
import { habitRepository } from '../services/HabitRepository';
import type { Habit, HabitLog, HabitLogStatus } from '../types/habit';
import { format, startOfWeek, subWeeks, addWeeks, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

interface HabitState {
  habits: Habit[];
  logs: Record<string, Record<string, HabitLogStatus>>; // habitId -> date (YYYY-MM-DD) -> status
  loading: boolean;
  currentDate: Date; // Anchor date (start of week or start of month depending on mode)
  viewMode: 'week' | 'month';

  // Actions
  fetchData: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'orderIndex'>) => Promise<void>;
  updateHabit: (id: string, data: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'orderIndex'>>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitLog: (habitId: string, date: string) => Promise<void>;
  reorderHabits: (activeId: string, overId: string) => Promise<void>;
  
  // Navigation
  setViewMode: (mode: 'week' | 'month') => void;
  prevPeriod: () => void;
  nextPeriod: () => void;
  goToToday: () => void;
}

const getInitialLogsState = (logsArr: HabitLog[]) => {
  const map: Record<string, Record<string, HabitLogStatus>> = {};
  logsArr.forEach(log => {
    if (!map[log.habitId]) map[log.habitId] = {};
    map[log.habitId][log.date] = log.status;
  });
  return map;
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: {},
  loading: false,
  currentDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Empezar en lunes
  viewMode: 'week',

  fetchData: async () => {
    set({ loading: true });
    try {
      const habits = await habitRepository.getAllHabits();
      
      // Obtener logs para un rango más amplio (2 meses) para soportar navegación
      const today = new Date();
      const start = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
      const end = format(endOfMonth(addMonths(today, 1)), 'yyyy-MM-dd');
      
      const logsArr = await habitRepository.getLogsForMonth(start, end);
      const logs = getInitialLogsState(logsArr);

      set({ habits, logs, loading: false });
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar hábitos');
      set({ loading: false });
    }
  },

  addHabit: async (habitData) => {
    try {
      const orderIndex = get().habits.length;
      const newHabit = await habitRepository.addHabit({ ...habitData, orderIndex });
      set((state) => ({
        habits: [...state.habits, newHabit]
      }));
      toast.success('Hábito creado');
    } catch (error) {
      console.error(error);
      toast.error('Error al crear hábito');
    }
  },

  updateHabit: async (id, data) => {
    const prev = get().habits;
    set((state) => ({
      habits: state.habits.map(h => h.id === id ? { ...h, ...data } : h)
    }));
    try {
      await habitRepository.updateHabit(id, data);
    } catch (error) {
      set({ habits: prev });
      toast.error('Error al actualizar hábito');
      console.error(error);
    }
  },

  deleteHabit: async (id) => {
    const prev = get().habits;
    set((state) => ({
      habits: state.habits.filter(h => h.id !== id)
    }));
    try {
      await habitRepository.deleteHabit(id);
      toast.success('Hábito eliminado');
    } catch (error) {
      set({ habits: prev });
      toast.error('Error al eliminar hábito');
      console.error(error);
    }
  },

  toggleHabitLog: async (habitId, date) => {
    const prevLogs = get().logs;
    const currentStatus = prevLogs[habitId]?.[date] || 'none';
    
    let nextStatus: HabitLogStatus = 'completed';
    if (currentStatus === 'completed') nextStatus = 'skipped';
    else if (currentStatus === 'skipped') nextStatus = 'none';

    // Optimistic update
    set((state) => {
      const newLogs = { ...state.logs };
      if (!newLogs[habitId]) newLogs[habitId] = {};
      newLogs[habitId] = { ...newLogs[habitId], [date]: nextStatus };
      return { logs: newLogs };
    });

    try {
      await habitRepository.upsertLog(habitId, date, nextStatus);
    } catch (error) {
      // Rollback
      set({ logs: prevLogs });
      toast.error('Error al guardar el registro');
      console.error(error);
    }
  },

  reorderHabits: async (activeId, overId) => {
    if (activeId === overId) return;

    const prevHabits = get().habits;
    const oldIndex = prevHabits.findIndex(h => h.id === activeId);
    const newIndex = prevHabits.findIndex(h => h.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Clonar y mover
    const newHabits = [...prevHabits];
    const [movedHabit] = newHabits.splice(oldIndex, 1);
    newHabits.splice(newIndex, 0, movedHabit);

    // Actualizar orderIndex
    const reordered = newHabits.map((habit, index) => ({
      ...habit,
      orderIndex: index
    }));

    // Optimistic update
    set({ habits: reordered });

    try {
      await habitRepository.updateHabitsOrder(
        reordered.map(h => ({ id: h.id, orderIndex: h.orderIndex }))
      );
    } catch (error) {
      // Rollback
      set({ habits: prevHabits });
      toast.error('Error al reordenar los hábitos');
      console.error(error);
    }
  },

  setViewMode: (mode) => set({ viewMode: mode, currentDate: mode === 'week' ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date()) }),
  prevPeriod: () => set((state) => ({
    currentDate: state.viewMode === 'week' ? subWeeks(state.currentDate, 1) : subMonths(state.currentDate, 1)
  })),
  nextPeriod: () => set((state) => ({
    currentDate: state.viewMode === 'week' ? addWeeks(state.currentDate, 1) : addMonths(state.currentDate, 1)
  })),
  goToToday: () => set((state) => ({
    currentDate: state.viewMode === 'week' ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date())
  })),
}));
