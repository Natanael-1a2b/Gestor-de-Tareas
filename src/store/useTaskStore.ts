import { create } from 'zustand';
import { db } from '../services/db';
import type { Task, Status, Priority, Category } from '../services/db';

/* ─── Filtros y ordenamiento ─── */
export type SortField = 'dueDate' | 'priority' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

interface Filters {
  search: string;
  category: Category | null;
  priority: Priority | null;
  status: Status | null;
  sort: SortField;
  sortDir: SortDirection;
}

/* ─── Store State ─── */
interface TaskState {
  tasks: Task[];
  loading: boolean;
  filters: Filters;

  // CRUD
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: number, data: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  updateTaskStatus: (id: number, status: Status) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;

  // Filtros
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;

  // Helpers
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: Status) => Task[];
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: null,
  priority: null,
  status: null,
  sort: 'createdAt',
  sortDir: 'desc',
};

const PRIORITY_ORDER: Record<Priority, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  filters: { ...DEFAULT_FILTERS },

  /* ─── CRUD ─── */

  fetchTasks: async () => {
    set({ loading: true });
    const tasks = await db.tasks.toArray();
    set({ tasks, loading: false });
  },

  addTask: async (taskData) => {
    const newTask: Task = {
      ...taskData,
      createdAt: new Date().toISOString(),
      subtasks: taskData.subtasks ?? [],
    };
    await db.tasks.add(newTask);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  updateTask: async (id, data) => {
    await db.tasks.update(id, data);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  updateTaskStatus: async (id, status) => {
    await db.tasks.update(id, { status });
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    const tasks = await db.tasks.toArray();
    set({ tasks });
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

    // Búsqueda por título
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Filtros
    if (filters.category) {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }

    // Ordenamiento
    result.sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;

      if (filters.sort === 'priority') {
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
      }
      if (filters.sort === 'dueDate') {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return (aDate - bDate) * dir;
      }
      // createdAt
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });

    return result;
  },

  getTasksByStatus: (status) => {
    return get().getFilteredTasks().filter((t) => t.status === status);
  },
}));
