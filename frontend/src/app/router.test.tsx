import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import { PublicOnlyRoute } from './router';
import { useAuthStore } from '@/features/auth/store/auth-store';

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  name: '테스트',
  created_at: '2026-05-14T00:00:00.000Z',
};

describe('PublicOnlyRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('미인증 상태에서 children을 렌더링한다', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <div data-testid="login-page">로그인 페이지</div>
              </PublicOnlyRoute>
            }
          />
          <Route path="/todos" element={<div data-testid="todo-page">할일 목록</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('인증 상태에서 /todos로 리다이렉트한다', () => {
    useAuthStore.getState().setAuth(mockUser, 'access', 'refresh');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <div data-testid="login-page">로그인 페이지</div>
              </PublicOnlyRoute>
            }
          />
          <Route path="/todos" element={<div data-testid="todo-page">할일 목록</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('todo-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('인증 상태에서 /register 접근 시 /todos로 리다이렉트한다', () => {
    useAuthStore.getState().setAuth(mockUser, 'access', 'refresh');

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <div data-testid="register-page">회원가입 페이지</div>
              </PublicOnlyRoute>
            }
          />
          <Route path="/todos" element={<div data-testid="todo-page">할일 목록</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('todo-page')).toBeInTheDocument();
  });
});

describe('루트 리다이렉트 규칙', () => {
  it('/ 접근 시 /todos로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Navigate to="/todos" replace />} />
          <Route path="/todos" element={<div data-testid="todo-page">할일 목록</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('todo-page')).toBeInTheDocument();
  });

  it('정의되지 않은 경로 접근 시 /login으로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/unknown/path']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">로그인</div>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('/abc/unknown 등 알 수 없는 경로도 /login으로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/abc/unknown']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">로그인</div>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
