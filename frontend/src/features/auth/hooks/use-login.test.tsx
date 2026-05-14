import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useLogin } from './use-login';
import { useAuthStore } from '@/features/auth/store/auth-store';
import * as authApi from '@/features/auth/api/auth-api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트',
  created_at: '2026-05-14T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('useLogin', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it('성공 시 setAuth를 호출하고 /todos로 이동한다', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'test@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe('access-token');
    expect(mockNavigate).toHaveBeenCalledWith('/todos');
  });

  it('실패 시 isError가 true가 되고 store 상태는 변경되지 않는다', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new Error('INVALID_CREDENTIALS'));

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'wrong@example.com', password: 'wrong' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('요청 중 isPending이 true이다', async () => {
    vi.spyOn(authApi, 'login').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        user: mockUser, accessToken: 'a', refreshToken: 'r',
      }), 100))
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ email: 'test@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isPending).toBe(true));
  });

  it('초기 상태에서 isPending은 false, isIdle은 true이다', () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(false);
  });
});
