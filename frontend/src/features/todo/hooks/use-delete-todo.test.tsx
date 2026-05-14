import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteTodo } from './use-delete-todo';
import * as todoApi from '@/features/todo/api/todo-api';
import type { Todo } from '@/features/todo/types/todo-types';

const mockTodos: Todo[] = [
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
  {
    id: 'todo-2',
    user_id: 'u1',
    category_id: 'cat-1',
    title: '운동',
    description: null,
    is_completed: false,
    due_date: null,
    created_at: '2026-05-14T00:00:00Z',
    updated_at: '2026-05-14T00:00:00Z',
  },
];

function createWrapper(initialTodos?: Todo[]) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  if (initialTodos) {
    queryClient.setQueryData(['todos', undefined], initialTodos);
  }
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

describe('useDeleteTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('삭제 성공 시 isSuccess가 true이다', async () => {
    const { Wrapper } = createWrapper(mockTodos);
    vi.spyOn(todoApi, 'deleteTodo').mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('optimistic update: 삭제 요청 즉시 캐시에서 제거한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockTodos);
    vi.spyOn(todoApi, 'deleteTodo').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
    );

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(['todos', undefined]);
      expect(cached?.find((t) => t.id === 'todo-1')).toBeUndefined();
    });
  });

  it('optimistic update: 다른 할일은 유지한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockTodos);
    vi.spyOn(todoApi, 'deleteTodo').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
    );

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(['todos', undefined]);
      expect(cached?.find((t) => t.id === 'todo-2')).toBeDefined();
    });
  });

  it('삭제 실패 시 캐시를 이전 상태로 롤백한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockTodos);
    vi.spyOn(todoApi, 'deleteTodo').mockRejectedValue(new Error('Server Error'));

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Todo[]>(['todos', undefined]);
    expect(cached).toEqual(mockTodos);
  });

  it('성공 후 todos 쿼리를 invalidate한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockTodos);
    vi.spyOn(todoApi, 'deleteTodo').mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });
});
