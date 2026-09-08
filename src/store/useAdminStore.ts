import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface AdminState {
  isAdmin: boolean | null; // null = todavía no chequeado
  checking: boolean;
  checkAdmin: (userId: string | undefined) => Promise<void>;
  reset: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: null,
  checking: false,

  checkAdmin: async (userId) => {
    if (!userId) {
      set({ isAdmin: false, checking: false });
      return;
    }
    set({ checking: true });
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    set({ isAdmin: !error && !!data, checking: false });
  },

  reset: () => set({ isAdmin: null, checking: false }),
}));
