import { create } from 'zustand';
import { db, Task, Status } from '../services/db';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTaskStatus: (id: number, status: Status) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    const tasks = await db.tasks.toArray();
    set({ tasks, loading: false });
  },

  addTask: async (taskData) => {
    const newTask: Task = {
      ...taskData,
      createdAt: new Date().toISOString(),
      subtasks: taskData.subtasks || [],
    };
    await db.tasks.add(newTask);
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
}));
