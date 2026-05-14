import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '@/features/auth/store/auth-store';

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  name: '테스트',
  created_at: '2026-05-14T00:00:00.000Z',
};

function renderWithRouter(initialPath: string, authenticated: boolean) {
  if (authenticated) {
    useAuthStore.getState().setAuth(mockUser, 'access-token', 'refresh-token');
  }

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">로그인 페이지</div>} />
        <Route
          path="/todos"
          element={
            <ProtectedRoute>
              <div data-testid="protected-page">보호된 페이지</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div data-testid="profile-page">프로필 페이지</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('미인증 상태에서 /todos 접근 시 /login으로 리다이렉트한다', () => {
    renderWithRouter('/todos', false);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
  });

  it('미인증 상태에서 /profile 접근 시 /login으로 리다이렉트한다', () => {
    renderWithRouter('/profile', false);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
  });

  it('인증 상태에서 children을 정상 렌더링한다', () => {
    renderWithRouter('/todos', true);
    expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('인증 후 clearAuth() 호출 시 리다이렉트된다', () => {
    useAuthStore.getState().setAuth(mockUser, 'access-token', 'refresh-token');

    const { rerender } = render(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page" />} />
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <div data-testid="protected-page" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-page')).toBeInTheDocument();

    act(() => {
      useAuthStore.getState().clearAuth();
    });
    rerender(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page" />} />
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <div data-testid="protected-page" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
