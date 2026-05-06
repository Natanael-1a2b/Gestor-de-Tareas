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
  completedAt?: string;
}
