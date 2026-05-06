import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      set({ user: session?.user ?? null, isInitialized: true, isLoading: false });

      // Listen for auth changes (login, logout, refresh token)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      toast.error("No se pudo conectar con tu cuenta automáticamente");
      set({ isInitialized: true, isLoading: false, user: null });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false });
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
      set({ isLoading: false });
    }
  }
}));
