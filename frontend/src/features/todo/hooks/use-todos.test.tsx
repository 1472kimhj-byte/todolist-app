import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodos } from './use-todos';
import * as todoApi from '@/features/todo/api/todo-api';

const mockTodos = [
  {
    id: 'todo-1',
    user_id: 'u1',
    category_id: 'cat-1',
    title: '장보기',
    description: null,
    is_completed: false,
    due_date: null,
    created_at: '2026-05-14T00:00:00Z',
    updated_at: '2026-05-14T00:00:00Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('할일 목록을 fetch하여 반환한다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue(mockTodos);

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTodos);
  });

  it('filterParams를 getTodos에 전달한다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue([]);

    const filter = { category_id: 'cat-1', is_completed: false };
    const { result } = renderHook(() => useTodos(filter), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(todoApi.getTodos).toHaveBeenCalledWith(filter);
  });

  it('초기 상태에서 isLoading이 true이다', () => {
    vi.spyOn(todoApi, 'getTodos').mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('API 실패 시 isError가 true이다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("filterParams가 포함된 query key를 사용한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const filter = { is_completed: true };
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue(mockTodos);

    const { result } = renderHook(() => useTodos(filter), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['todos', filter])).toEqual(mockTodos);
  });
});
