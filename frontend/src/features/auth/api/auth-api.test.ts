import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import httpClient from '@/shared/api/http-client';
import { login, register, logout, refreshToken, getMe, updateMe, deleteMe } from './auth-api';

const mock = new MockAdapter(httpClient);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트',
  created_at: '2026-05-14T00:00:00.000Z',
};

describe('auth-api', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('login()', () => {
    it('로그인 성공 시 LoginResponse를 반환한다', async () => {
      const response = { accessToken: 'access', refreshToken: 'refresh', user: mockUser };
      mock.onPost('/api/auth/login').reply(200, response);

      const result = await login({ email: 'test@example.com', password: 'password123' });
      expect(result).toEqual(response);
    });

    it('요청 body에 email과 password가 포함된다', async () => {
      mock.onPost('/api/auth/login').reply(200, {
        accessToken: 'a', refreshToken: 'r', user: mockUser,
      });

      await login({ email: 'test@example.com', password: 'pw' });
      expect(mock.history['post'][0].data).toContain('test@example.com');
    });
  });

  describe('register()', () => {
    it('회원가입 성공 시 RegisterResponse를 반환한다', async () => {
      const response = { accessToken: 'access', refreshToken: 'refresh', user: mockUser };
      mock.onPost('/api/auth/register').reply(201, response);

      const result = await register({ name: '테스트', email: 'test@example.com', password: 'password123' });
      expect(result).toEqual(response);
    });
  });

  describe('logout()', () => {
    it('로그아웃 성공 시 undefined를 반환한다', async () => {
      mock.onPost('/api/auth/logout').reply(200, { message: '로그아웃 되었습니다.' });

      await expect(logout('refresh-token')).resolves.toBeUndefined();
    });

    it('요청 body에 refreshToken이 포함된다', async () => {
      mock.onPost('/api/auth/logout').reply(200, {});

      await logout('my-refresh-token');
      expect(mock.history['post'][0].data).toContain('my-refresh-token');
    });
  });

  describe('refreshToken()', () => {
    it('토큰 재발급 성공 시 새 토큰을 반환한다', async () => {
      const response = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      mock.onPost('/api/auth/refresh').reply(200, response);

      const result = await refreshToken('old-refresh');
      expect(result).toEqual(response);
    });
  });

  describe('getMe()', () => {
    it('내 정보 조회 성공 시 User를 반환한다', async () => {
      mock.onGet('/api/users/me').reply(200, mockUser);

      const result = await getMe();
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateMe()', () => {
    it('이름 수정 성공 시 수정된 User를 반환한다', async () => {
      const updated = { ...mockUser, name: '새이름' };
      mock.onPatch('/api/users/me').reply(200, updated);

      const result = await updateMe({ name: '새이름' });
      expect(result).toEqual(updated);
    });

    it('비밀번호 변경 요청 시 currentPassword와 password가 포함된다', async () => {
      mock.onPatch('/api/users/me').reply(200, mockUser);

      await updateMe({ currentPassword: 'old', password: 'new' });
      const body = JSON.parse(mock.history['patch'][0].data as string) as Record<string, unknown>;
      expect(body).toMatchObject({ currentPassword: 'old', password: 'new' });
    });
  });

  describe('deleteMe()', () => {
    it('회원 탈퇴 성공 시 undefined를 반환한다', async () => {
      mock.onDelete('/api/users/me').reply(204);

      await expect(deleteMe()).resolves.toBeUndefined();
    });
  });
});
