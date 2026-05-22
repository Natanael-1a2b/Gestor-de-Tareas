import { supabase } from './supabase';
import type { Habit, HabitLog, HabitLogStatus } from '../types/habit';

export class HabitRepository {
  async getAllHabits(): Promise<Habit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(this.mapHabitToClient);
  }

  async addHabit(habit: Omit<Habit, 'id' | 'userId' | 'createdAt'>): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        title: habit.title,
        category: habit.category,
        color: habit.color,
        order_index: habit.orderIndex || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapHabitToClient(data);
  }

  async updateHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.color !== undefined) payload.color = updates.color;

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from('habits')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    }
  }

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateHabitsOrder(habits: { id: string; orderIndex: number }[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Supabase JS doesn't have a bulk update by default that works easily without RPC for this specific case,
    // so we can either do parallel updates or a single upsert if we select all fields. 
    // For simplicity and small arrays, parallel updates are fine.
    await Promise.all(
      habits.map(h => 
        supabase
          .from('habits')
          .update({ order_index: h.orderIndex })
          .eq('id', h.id)
      )
    );
  }

  // --- Habit Logs ---

  async getLogsForMonth(startDate: string, endDate: string): Promise<HabitLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*, habits!inner(user_id)')
      .eq('habits.user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return (data || []).map(this.mapLogToClient);
  }

  async upsertLog(habitId: string, date: string, status: HabitLogStatus): Promise<HabitLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    if (status === 'none') {
      // Si el estado es 'none', eliminamos el log si existe
      const { data: existing, error: selectErr } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (selectErr) throw selectErr;

      if (existing) {
        const { error: delErr } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existing.id);
        if (delErr) throw delErr;
      }

      return {
        id: 'none-' + Date.now(),
        habitId,
        date,
        status: 'none',
        createdAt: new Date().toISOString()
      };
    } else {
      // Usar onConflict para hacer upsert basado en habit_id y date
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            habit_id: habitId,
            date: date,
            status: status
          },
          { onConflict: 'habit_id,date', ignoreDuplicates: false }
        )
        .select()
        .single();

      if (error) throw error;
      return this.mapLogToClient(data);
    }
  }

  private mapHabitToClient(dbHabit: any): Habit {
    return {
      id: dbHabit.id,
      userId: dbHabit.user_id,
      title: dbHabit.title,
      category: dbHabit.category,
      color: dbHabit.color || '#10b981',
      orderIndex: dbHabit.order_index || 0,
      createdAt: dbHabit.created_at,
    };
  }

  private mapLogToClient(dbLog: any): HabitLog {
    return {
      id: dbLog.id,
      habitId: dbLog.habit_id,
      date: String(dbLog.date).substring(0, 10), // Asegurar formato YYYY-MM-DD
      status: dbLog.status,
      createdAt: dbLog.created_at,
    };
  }
}

export const habitRepository = new HabitRepository();
