import { create } from 'zustand';
import type { User } from '@monorepo/shared';

export const TOKEN_STORAGE_KEY = 'monorepo.token';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

function readStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: readStoredToken(),

  login: (user: User, token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ user: null, token: null });
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));
