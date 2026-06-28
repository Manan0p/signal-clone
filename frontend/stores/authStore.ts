import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';
import { wsManager } from '@/lib/websocket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initFromStorage: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('signal_token', token);
    localStorage.setItem('signal_user', JSON.stringify(user));
    set({ user, token, isLoading: false });
    wsManager.connect(user.id, token);
  },

  logout: () => {
    localStorage.removeItem('signal_token');
    localStorage.removeItem('signal_user');
    wsManager.disconnect();
    set({ user: null, token: null, isLoading: false });
  },

  initFromStorage: () => {
    try {
      const token = localStorage.getItem('signal_token');
      const userStr = localStorage.getItem('signal_user');
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isLoading: false });
        wsManager.connect(user.id, token);
        // Refresh user data from server
        api.get('/api/auth/me').then((res) => {
          const fresh = res.data as User;
          localStorage.setItem('signal_user', JSON.stringify(fresh));
          set({ user: fresh });
        }).catch(() => {
          get().logout();
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem('signal_user', JSON.stringify(updated));
    set({ user: updated });
  },
}));
