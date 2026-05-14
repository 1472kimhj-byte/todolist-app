import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { useAuthStore } from '@/features/auth/store/auth-store';
import httpClient from './http-client';

const mockAxios = new MockAdapter(axios);
const mockHttpClient = new MockAdapter(httpClient);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트',
  created_at: '2026-05-14T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  mockHttpClient.reset();
  mockAxios.reset();
  vi.stubGlobal('location', { href: '' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http-client 요청 인터셉터', () => {
  it('accessToken이 없으면 Authorization 헤더를 주입하지 않는다', async () => {
    mockHttpClient.onGet('/api/test').reply(200, { ok: true });

    const res = await httpClient.get('/api/test');

    expect(res.status).toBe(200);
    expect(res.config.headers?.Authorization).toBeUndefined();
  });

  it('accessToken이 있으면 Authorization: Bearer 헤더를 자동 주입한다', async () => {
    useAuthStore.getState().setAuth(mockUser, 'my-access-token', 'my-refresh-token');
    mockHttpClient.onGet('/api/test').reply(200, { ok: true });

    const res = await httpClient.get('/api/test');

    expect(res.config.headers?.Authorization).toBe('Bearer my-access-token');
  });
});

describe('http-client 응답 인터셉터 — 401 처리', () => {
  it('401 응답 시 /api/auth/refresh를 호출한다', async () => {
    useAuthStore.getState().setAuth(mockUser, 'expired-token', 'valid-refresh');

    mockHttpClient
      .onGet('/api/protected')
      .replyOnce(401)
      .onGet('/api/protected')
      .reply(200, { data: 'ok' });

    mockAxios
      .onPost('http://localhost:3000/api/auth/refresh')
      .reply(200, { accessToken: 'new-access', refreshToken: 'new-refresh' });

    const res = await httpClient.get('/api/protected');

    expect(res.status).toBe(200);
    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
  });

  it('토큰 재발급 성공 시 원래 요청을 새 토큰으로 재시도한다', async () => {
    useAuthStore.getState().setAuth(mockUser, 'expired-token', 'valid-refresh');

    mockHttpClient
      .onGet('/api/protected')
      .replyOnce(401)
      .onGet('/api/protected')
      .reply(200, { message: 'success' });

    mockAxios
      .onPost('http://localhost:3000/api/auth/refresh')
      .reply(200, { accessToken: 'new-access', refreshToken: 'new-refresh' });

    const res = await httpClient.get('/api/protected');
    expect(res.data).toEqual({ message: 'success' });
  });

  it('토큰 재발급 실패 시 clearAuth()를 호출한다', async () => {
    useAuthStore.getState().setAuth(mockUser, 'expired-token', 'expired-refresh');

    mockHttpClient.onGet('/api/protected').reply(401);
    mockAxios
      .onPost('http://localhost:3000/api/auth/refresh')
      .reply(401, { error: { code: 'INVALID_REFRESH_TOKEN', message: '만료된 토큰' } });

    await expect(httpClient.get('/api/protected')).rejects.toBeDefined();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('토큰 재발급 실패 시 /login으로 리다이렉트한다', async () => {
    useAuthStore.getState().setAuth(mockUser, 'expired-token', 'expired-refresh');

    mockHttpClient.onGet('/api/protected').reply(401);
    mockAxios
      .onPost('http://localhost:3000/api/auth/refresh')
      .reply(401);

    await expect(httpClient.get('/api/protected')).rejects.toBeDefined();

    expect(window.location.href).toBe('/login');
  });

  it('401이 아닌 에러는 그대로 reject된다', async () => {
    mockHttpClient.onGet('/api/test').reply(500, { error: { code: 'INTERNAL_SERVER_ERROR' } });

    await expect(httpClient.get('/api/test')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
