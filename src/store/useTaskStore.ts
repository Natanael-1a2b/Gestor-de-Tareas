import { create } from 'zustand';
import { toast } from 'sonner';
import { taskRepository } from '../services/IndexedDBRepository';
import type { Task, Status, Priority, Category, Subtask } from '../services/db';

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

  // Subtareas
  addSubtask: (taskId: number, title: string) => Promise<void>;
  toggleSubtask: (taskId: number, subtaskId: string) => Promise<void>;
  removeSubtask: (taskId: number, subtaskId: string) => Promise<void>;

  // Filtros
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;

  // Helpers
  getFilteredTasks: (ignoreStatus?: boolean) => Task[];
  getTasksByStatus: (status: Status) => Task[];
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: null,
  priority: null,
  status: null,
  sort: 'priority',
  sortDir: 'asc',
};

const PRIORITY_ORDER: Record<Priority, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  filters: { ...DEFAULT_FILTERS },

  /* ─── CRUD ─── */

  fetchTasks: async () => {
    try {
      set({ loading: true });
      const tasks = await taskRepository.getAll();
      set({ tasks });
    } catch (error) {
      toast.error('Error al cargar las tareas');
      console.error(error);
    } finally {
      set({ loading: false });
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
    try {
      await taskRepository.update(id, data);
      const tasks = await taskRepository.getAll();
      set({ tasks });
    } catch (error) {
      toast.error('Error al actualizar la tarea');
      console.error(error);
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      await taskRepository.updateStatus(id, status);
      const tasks = await taskRepository.getAll();
      set({ tasks });
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error(error);
    }
  },

  deleteTask: async (id) => {
    try {
      await taskRepository.delete(id);
      const tasks = await taskRepository.getAll();
      set({ tasks });
      toast.success('Tarea eliminada');
    } catch (error) {
      toast.error('Error al eliminar la tarea');
      console.error(error);
    }
  },

  /* ─── Subtareas ─── */

  addSubtask: async (taskId, title) => {
    try {
      const task = await taskRepository.getById(taskId);
      if (!task) return;
      const newSubtask: Subtask = { id: generateId(), title, completed: false };
      const subtasks = [...task.subtasks, newSubtask];
      await taskRepository.update(taskId, { subtasks });
      const tasks = await taskRepository.getAll();
      set({ tasks });
    } catch (error) {
      toast.error('Error al agregar la subtarea');
      console.error(error);
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const task = await taskRepository.getById(taskId);
      if (!task) return;
      const subtasks = task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );
      await taskRepository.update(taskId, { subtasks });
      const tasks = await taskRepository.getAll();
      set({ tasks });
    } catch (error) {
      toast.error('Error al modificar la subtarea');
      console.error(error);
    }
  },

  removeSubtask: async (taskId, subtaskId) => {
    try {
      const task = await taskRepository.getById(taskId);
      if (!task) return;
      const subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
      await taskRepository.update(taskId, { subtasks });
      const tasks = await taskRepository.getAll();
      set({ tasks });
    } catch (error) {
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

  getFilteredTasks: (ignoreStatus = false) => {
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
    if (filters.status && !ignoreStatus) {
      result = result.filter((t) => t.status === filters.status);
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
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
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
