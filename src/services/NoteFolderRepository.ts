import { supabase } from './supabase';
import type { NoteFolder } from '../types/noteFolder';

export class NoteFolderRepository {
  async getAllFolders(): Promise<NoteFolder[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('note_folders')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapFolderToClient);
  }

  async addFolder(folder: { name: string; color: string }): Promise<NoteFolder> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('note_folders')
      .insert({
        user_id: user.id,
        name: folder.name,
        color: folder.color,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFolderToClient(data);
  }

  async updateFolder(id: string, updates: { name?: string; color?: string }): Promise<NoteFolder> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.color !== undefined) payload.color = updates.color;

    const { data, error } = await supabase
      .from('note_folders')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFolderToClient(data);
  }

  async deleteFolder(id: string): Promise<void> {
    const { error } = await supabase
      .from('note_folders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapFolderToClient(dbFolder: Record<string, unknown>): NoteFolder {
    return {
      id: dbFolder.id as string,
      userId: dbFolder.user_id as string,
      name: dbFolder.name as string,
      color: dbFolder.color as string,
      createdAt: dbFolder.created_at as string,
    };
  }
}

export const noteFolderRepository = new NoteFolderRepository();
