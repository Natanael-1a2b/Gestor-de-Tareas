import type { Task, Status } from '../types';

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  add(task: Omit<Task, 'id'>): Promise<string>;
  update(id: string, data: Partial<Task>): Promise<string>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: Status): Promise<string>;
  
  // Subtasks
  addSubtask?(taskId: string, title: string): Promise<void>;
  toggleSubtask?(taskId: string, subtaskId: string): Promise<void>;
  removeSubtask?(taskId: string, subtaskId: string): Promise<void>;

  // Historial
  getArchived(): Promise<Task[]>;
  archiveTask(id: string): Promise<void>;
  archiveAllCompletedTasks(): Promise<void>;
  restoreTask(id: string): Promise<void>;
}
