import { create } from 'zustand';
import type { AuthState, User } from '@/features/auth/types/auth-types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user: User, accessToken: string, refreshToken: string) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  updateTokens: (accessToken: string, refreshToken: string) =>
    set((state) => ({ ...state, accessToken, refreshToken })),
  updateUser: (user: User) =>
    set((state) => ({ ...state, user })),
  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
