import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth-store';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트',
  created_at: '2026-05-14T00:00:00.000Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('초기 상태', () => {
    it('user는 null이다', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('accessToken은 null이다', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('refreshToken은 null이다', () => {
      expect(useAuthStore.getState().refreshToken).toBeNull();
    });

    it('isAuthenticated는 false이다', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('setAuth()', () => {
    it('user, accessToken, refreshToken, isAuthenticated를 설정한다', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-123');
      expect(state.refreshToken).toBe('refresh-456');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('updateTokens()', () => {
    it('user를 유지하면서 accessToken과 refreshToken만 교체한다', () => {
      useAuthStore.getState().setAuth(mockUser, 'old-access', 'old-refresh');
      useAuthStore.getState().updateTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('updateUser()', () => {
    it('user 정보만 업데이트한다', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
      const updatedUser = { ...mockUser, name: '새이름' };
      useAuthStore.getState().updateUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(updatedUser);
      expect(state.accessToken).toBe('access-123');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearAuth()', () => {
    it('모든 상태를 초기값으로 리셋한다', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('localStorage/sessionStorage 사용 금지', () => {
    it('setAuth 후 localStorage에 토큰이 저장되지 않는다', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('setAuth 후 sessionStorage에 토큰이 저장되지 않는다', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
