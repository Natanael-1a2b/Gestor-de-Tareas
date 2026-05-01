import { db } from './db';
import type { Task, Status } from './db';
import type { ITaskRepository } from './TaskRepository';

export class IndexedDBRepository implements ITaskRepository {
  async getAll(): Promise<Task[]> {
    return db.tasks.toArray();
  }

  async getById(id: number): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async add(task: Omit<Task, 'id'>): Promise<number> {
    const id = await db.tasks.add(task as Task);
    return id as number;
  }

  async update(id: number, data: Partial<Task>): Promise<number> {
    return db.tasks.update(id, data);
  }

  async delete(id: number): Promise<void> {
    return db.tasks.delete(id);
  }

  async updateStatus(id: number, status: Status): Promise<number> {
    return db.tasks.update(id, { status });
  }
}

// Exportamos una instancia por defecto para inyectar en el store
export const taskRepository = new IndexedDBRepository();
