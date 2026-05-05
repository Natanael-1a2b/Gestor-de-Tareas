import Dexie, { type Table } from 'dexie';

export type Priority = 'Alta' | 'Media' | 'Baja';
export type Category = 'Ministerio' | 'Trabajo' | 'Estudio' | 'Personal';
export type Status = 'Por hacer' | 'En proceso' | 'Completadas' | 'Canceladas' | 'Archivada';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: Priority;
  category: Category;
  status: Status;
  subtasks: Subtask[];
  createdAt: string;
}

export class MyDatabase extends Dexie {
  tasks!: Table<Task>;

  constructor() {
    super('GestorTareasDB');
    this.version(1).stores({
      tasks: '++id, title, priority, category, status, dueDate'
    });
  }
}

export const db = new MyDatabase();
