import { supabase } from './supabase';
import type { Note } from '../types/note';

export class NoteRepository {
  async getAllNotes(): Promise<Note[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapNoteToClient);
  }

  async addNote(note: { title: string; content: string; folderId?: string | null }): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        folder_id: note.folderId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapNoteToClient(data);
  }

  async updateNote(id: string, updates: { title?: string; content?: string; folderId?: string | null }): Promise<Note> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.folderId !== undefined) payload.folder_id = updates.folderId;

    const { data, error } = await supabase
      .from('notes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapNoteToClient(data);
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async setFavorite(id: string, isFavorite: boolean): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapNoteToClient(data);
  }

  private mapNoteToClient(dbNote: Record<string, unknown>): Note {
    return {
      id: dbNote.id as string,
      userId: dbNote.user_id as string,
      title: dbNote.title as string,
      content: (dbNote.content as string) || '',
      isFavorite: Boolean(dbNote.is_favorite),
      folderId: (dbNote.folder_id as string | null) ?? null,
      createdAt: dbNote.created_at as string,
      updatedAt: (dbNote.updated_at as string) || (dbNote.created_at as string),
    };
  }
}

export const noteRepository = new NoteRepository();
