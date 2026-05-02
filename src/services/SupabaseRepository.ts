import { supabase } from './supabase';
import type { Task, Status, Subtask } from './db';
import type { ITaskRepository } from './TaskRepository';

export class SupabaseRepository implements ITaskRepository {
  async getAll(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Mapear los nombres de base de datos a los del cliente (ej. due_date a dueDate)
    return (data || []).map(this.mapToClient);
  }

  async getById(id: string): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data ? this.mapToClient(data) : undefined;
  }

  async add(task: Omit<Task, 'id'>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { subtasks, ...taskData } = task;

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        category: taskData.category,
        due_date: taskData.dueDate ? taskData.dueDate : null,
        created_at: taskData.createdAt || new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    if (subtasks && subtasks.length > 0) {
      const { error: subError } = await supabase
        .from('subtasks')
        .insert(
          subtasks.map(st => ({
            task_id: newTask.id,
            title: st.title,
            completed: st.completed
          }))
        );
      if (subError) throw subError;
    }

    return newTask.id;
  }

  async update(id: string, data: Partial<Task>): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subtasks, dueDate, createdAt, ...rest } = data;
    
    const updatePayload: Record<string, unknown> = { ...rest };
    
    if ('dueDate' in data) {
      updatePayload.due_date = data.dueDate ? data.dueDate : null;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
    }

    return id;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateStatus(id: string, status: Status): Promise<string> {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    return id;
  }

  async addSubtask(taskId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, completed: false });
    if (error) throw error;
  }

  async toggleSubtask(_taskId: string, subtaskId: string): Promise<void> {
    // Primero obtenemos el estado actual
    const { data: st, error: fetchErr } = await supabase
      .from('subtasks')
      .select('completed')
      .eq('id', subtaskId)
      .single();
    if (fetchErr) throw fetchErr;

    const { error } = await supabase
      .from('subtasks')
      .update({ completed: !st.completed })
      .eq('id', subtaskId);
    if (error) throw error;
  }

  async removeSubtask(_taskId: string, subtaskId: string): Promise<void> {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);
    if (error) throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToClient(dbTask: any): Task {
    return {
      id: dbTask.id as string,
      title: dbTask.title as string,
      description: dbTask.description as string,
      priority: dbTask.priority,
      category: dbTask.category,
      status: dbTask.status,
      dueDate: dbTask.due_date ? String(dbTask.due_date).substring(0, 10) : undefined,
      createdAt: dbTask.created_at as string,
      subtasks: (dbTask.subtasks || []) as Subtask[],
    };
  }
}

export const taskRepository = new SupabaseRepository();
