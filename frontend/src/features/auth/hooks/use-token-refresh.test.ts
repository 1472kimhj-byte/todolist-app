import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { refreshTokens } from './use-token-refresh';
import { useAuthStore } from '@/features/auth/store/auth-store';

describe('refreshTokens()', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
  });

  it('성공 시 새 토큰을 반환한다', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });

    const result = await refreshTokens('old-refresh-token');

    expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });

  it('성공 시 store의 토큰이 갱신된다', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', email: 'a@a.com', name: '테스트', created_at: '' },
      'old-access',
      'old-refresh'
    );

    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });

    await refreshTokens('old-refresh');

    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
  });

  it('성공 시 user와 isAuthenticated는 유지된다', async () => {
    const mockUser = { id: 'u1', email: 'a@a.com', name: '테스트', created_at: '' };
    useAuthStore.getState().setAuth(mockUser, 'old-access', 'old-refresh');

    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });

    await refreshTokens('old-refresh');

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('실패 시 에러가 전파되고 store는 변경되지 않는다', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', email: 'a@a.com', name: '테스트', created_at: '' },
      'access',
      'refresh'
    );

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('INVALID_REFRESH_TOKEN'));

    await expect(refreshTokens('invalid-token')).rejects.toThrow('INVALID_REFRESH_TOKEN');
    expect(useAuthStore.getState().accessToken).toBe('access');
  });

  it('올바른 엔드포인트로 요청한다', async () => {
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r' },
    });

    await refreshTokens('my-token');

    expect(postSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      { refreshToken: 'my-token' }
    );
  });
});
