import { create } from 'zustand';
import { toast } from 'sonner';
import { taskRepository } from '../services/SupabaseRepository';
import { supabase } from '../services/supabase';
import type { Task, Status, Priority, Category, Subtask } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/* ─── Filtros y ordenamiento ─── */
export type SortField = 'dueDate' | 'priority' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

interface Filters {
  search: string;
  category: Category | null;
  priority: Priority | null;
  sort: SortField;
  sortDir: SortDirection;
}

/* ─── Store State ─── */
interface TaskState {
  tasks: Task[];
  archivedTasks: Task[];
  loading: boolean;
  filters: Filters;

  // CRUD
  fetchTasks: (background?: boolean) => Promise<void>;
  fetchArchivedTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  updateTaskStatus: (id: string, status: Status) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  archiveAllCompletedTasks: () => Promise<void>;
  restoreTask: (id: string) => Promise<void>;

  // Subtareas
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  removeSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Filtros
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;

  // Realtime
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;

  // Helpers
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: Status) => Task[];
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: null,
  priority: null,
  sort: 'priority',
  sortDir: 'asc',
};

const PRIORITY_ORDER: Record<Priority, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
};

let realtimeChannel: RealtimeChannel | null = null;

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  archivedTasks: [],
  loading: false,
  filters: { ...DEFAULT_FILTERS },

  /* ─── Realtime ─── */
  subscribeToRealtime: () => {
    if (realtimeChannel) return; // Ya está suscrito
    
    realtimeChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          get().fetchTasks(true);
          get().fetchArchivedTasks();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subtasks' },
        () => {
          get().fetchTasks(true);
        }
      )
      .subscribe();
  },

  unsubscribeFromRealtime: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },

  /* ─── CRUD ─── */

  fetchTasks: async (background = false) => {
    try {
      if (!background) set({ loading: true });
      const tasks = await taskRepository.getAll();
      set({ tasks });
      get().fetchArchivedTasks();
    } catch (error) {
      toast.error('Error al cargar las tareas');
      console.error(error);
    } finally {
      if (!background) set({ loading: false });
    }
  },

  fetchArchivedTasks: async () => {
    try {
      const archivedTasks = await taskRepository.getArchived();
      set({ archivedTasks });
    } catch (error) {
      console.error('Error al cargar tareas archivadas:', error);
    }
  },

  addTask: async (taskData) => {
    try {
      const newTask: Omit<Task, 'id'> = {
        ...taskData,
        createdAt: new Date().toISOString(),
        subtasks: taskData.subtasks ?? [],
      };
      await taskRepository.add(newTask);
      const tasks = await taskRepository.getAll();
      set({ tasks });
      toast.success('Tarea creada');
    } catch (error) {
      toast.error('Error al crear la tarea');
      console.error(error);
    }
  },

  updateTask: async (id, data) => {
    const previousTasks = get().tasks;
    // Optimistic update
    set({
      tasks: previousTasks.map(t => t.id === id ? { ...t, ...data } : t)
    });

    try {
      await taskRepository.update(id, data);
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      toast.error('Error al actualizar la tarea');
      console.error(error);
    }
  },

  updateTaskStatus: async (id, status) => {
    const previousTasks = get().tasks;
    // Optimistic update
    set({ tasks: previousTasks.map(t => t.id === id ? { ...t, status } : t) });

    try {
      await taskRepository.updateStatus(id, status);
      // fetchTasks() is handled by Realtime subscription or explicit call
      // In this case, subscribeToRealtime will handle the sync
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      toast.error('Error al actualizar el estado');
      console.error(error);
    }
  },

  deleteTask: async (id) => {
    const previousTasks = get().tasks;
    const previousArchived = get().archivedTasks;
    
    // Optimistic update
    set({ 
      tasks: previousTasks.filter(t => t.id !== id),
      archivedTasks: previousArchived.filter(t => t.id !== id)
    });

    try {
      await taskRepository.delete(id);
      toast.success('Tarea eliminada');
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks, archivedTasks: previousArchived });
      toast.error('Error al eliminar la tarea');
      console.error(error);
    }
  },

  archiveTask: async (id) => {
    const previousTasks = get().tasks;
    const previousArchived = get().archivedTasks;
    
    const taskToArchive = previousTasks.find(t => t.id === id);
    if (!taskToArchive) return;

    // Optimistic update
    set({
      tasks: previousTasks.filter(t => t.id !== id),
      archivedTasks: [{ ...taskToArchive, status: 'Archivada' }, ...previousArchived]
    });

    try {
      await taskRepository.archiveTask(id);
      toast.success('Tarea archivada');
    } catch (error) {
      set({ tasks: previousTasks, archivedTasks: previousArchived });
      toast.error('Error al archivar la tarea');
      console.error(error);
    }
  },

  archiveAllCompletedTasks: async () => {
    const previousTasks = get().tasks;
    const previousArchived = get().archivedTasks;
    
    const tasksToArchive = previousTasks.filter(t => t.status === 'Completadas');
    if (tasksToArchive.length === 0) return;

    // Optimistic update
    set({
      tasks: previousTasks.filter(t => t.status !== 'Completadas'),
      archivedTasks: [
        ...tasksToArchive.map(t => ({ ...t, status: 'Archivada' as Status })),
        ...previousArchived
      ]
    });

    try {
      await taskRepository.archiveAllCompletedTasks();
      toast.success(`${tasksToArchive.length} tareas archivadas`);
    } catch (error) {
      set({ tasks: previousTasks, archivedTasks: previousArchived });
      toast.error('Error al archivar tareas');
      console.error(error);
    }
  },

  restoreTask: async (id) => {
    const previousTasks = get().tasks;
    const previousArchived = get().archivedTasks;
    
    const taskToRestore = previousArchived.find(t => t.id === id);
    if (!taskToRestore) return;

    // Optimistic update
    set({
      archivedTasks: previousArchived.filter(t => t.id !== id),
      tasks: [{ ...taskToRestore, status: 'Por hacer' }, ...previousTasks]
    });

    try {
      await taskRepository.restoreTask(id);
      toast.success('Tarea restaurada');
    } catch (error) {
      set({ tasks: previousTasks, archivedTasks: previousArchived });
      toast.error('Error al restaurar la tarea');
      console.error(error);
    }
  },

  /* ─── Subtareas ─── */

  addSubtask: async (taskId, title) => {
    const previousTasks = get().tasks;
    const tempId = 'temp-' + Date.now();
    const newSubtask: Subtask = { id: tempId, title, completed: false };

    // Optimistic update
    set({
      tasks: previousTasks.map(t => t.id === taskId ? {
        ...t,
        subtasks: [...(t.subtasks || []), newSubtask]
      } : t)
    });

    try {
      if (taskRepository.addSubtask) {
        await taskRepository.addSubtask(taskId, title);
      }
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      toast.error('Error al agregar la subtarea');
      console.error(error);
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const previousTasks = get().tasks;
    // Optimistic update
    set({
      tasks: previousTasks.map(t => t.id === taskId ? {
        ...t,
        subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      } : t)
    });

    try {
      if (taskRepository.toggleSubtask) {
        await taskRepository.toggleSubtask(taskId, subtaskId);
      }
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      toast.error('Error al cambiar el estado de la subtarea');
      console.error(error);
    }
  },

  removeSubtask: async (taskId, subtaskId) => {
    const previousTasks = get().tasks;
    // Optimistic update
    set({
      tasks: previousTasks.map(t => t.id === taskId ? {
        ...t,
        subtasks: t.subtasks.filter(st => st.id !== subtaskId)
      } : t)
    });

    try {
      if (taskRepository.removeSubtask) {
        await taskRepository.removeSubtask(taskId, subtaskId);
      }
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      toast.error('Error al eliminar la subtarea');
      console.error(error);
    }
  },

  /* ─── Filtros ─── */

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  /* ─── Helpers ─── */

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    let result = [...tasks];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filters.category) {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }

    result.sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      
      // Si el usuario elige ordenar por prioridad, aplicamos el criterio secundario por categoría
      if (filters.sort === 'priority') {
        const pDiff = (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
        if (pDiff !== 0) return pDiff;
        // Orden secundario: Categoría (alfabético)
        return a.category.localeCompare(b.category) * dir;
      }
      
      if (filters.sort === 'dueDate') {
        const aDate = a.dueDate ? new Date(a.dueDate + 'T12:00:00').getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate + 'T12:00:00').getTime() : Infinity;
        return (aDate - bDate) * dir;
      }
      
      // Default: Por fecha de creación (createdAt) + fallback a prioridad si son iguales
      const timeDiff = (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      if (timeDiff !== 0) return timeDiff;
      return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
    });

    return result;
  },

  getTasksByStatus: (status) => {
    return get().getFilteredTasks().filter((t) => t.status === status);
  },
}));
