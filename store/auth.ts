import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Rider } from '@/types';

interface AuthState {
  rider: Rider | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  updateRider: (rider: Partial<Rider>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  rider: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('shield_token') : null,
  isLoading: false,
  isAuthenticated: false,

  login: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const { token, rider } = await api.login(phone, password);
      api.setToken(token);
      set({ rider, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const { token, rider } = await api.register(data);
      api.setToken(token);
      set({ rider, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchMe: async () => {
    try {
      const { rider } = await api.getMe();
      set({ rider, isAuthenticated: true });
    } catch {
      set({ rider: null, isAuthenticated: false, token: null });
      api.setToken(null);
    }
  },

  logout: () => {
    api.setToken(null);
    set({ rider: null, token: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  updateRider: (updates: Partial<Rider>) => {
    const current = get().rider;
    if (current) {
      set({ rider: { ...current, ...updates } });
    }
  },
}));
