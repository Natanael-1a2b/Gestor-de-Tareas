import type { Task, Status } from './db';

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: number): Promise<Task | undefined>;
  add(task: Omit<Task, 'id'>): Promise<number>;
  update(id: number, data: Partial<Task>): Promise<number>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, status: Status): Promise<number>;
}
