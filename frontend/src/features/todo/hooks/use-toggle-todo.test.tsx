import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToggleTodo } from './use-toggle-todo';
import * as todoApi from '@/features/todo/api/todo-api';
import type { Todo } from '@/features/todo/types/todo-types';

const mockTodo: Todo = {
  id: 'todo-1',
  user_id: 'u1',
  category_id: 'cat-1',
  title: '장보기',
  description: null,
  is_completed: false,
  due_date: null,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

const mockTodo2: Todo = {
  ...mockTodo,
  id: 'todo-2',
  title: '운동',
  is_completed: true,
};

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

describe('useToggleTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('토글 성공 시 isSuccess가 true이다', async () => {
    const { Wrapper } = createWrapper([mockTodo]);
    vi.spyOn(todoApi, 'toggleTodo').mockResolvedValue({ ...mockTodo, is_completed: true });

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('optimistic update: 즉시 is_completed를 반전한다', async () => {
    const { queryClient, Wrapper } = createWrapper([mockTodo, mockTodo2]);
    vi.spyOn(todoApi, 'toggleTodo').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ...mockTodo, is_completed: true }), 50))
    );

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(['todos', undefined]);
      const todo = cached?.find((t) => t.id === 'todo-1');
      expect(todo?.is_completed).toBe(true);
    });
  });

  it('optimistic update: 다른 할일은 변경하지 않는다', async () => {
    const { queryClient, Wrapper } = createWrapper([mockTodo, mockTodo2]);
    vi.spyOn(todoApi, 'toggleTodo').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ...mockTodo, is_completed: true }), 50))
    );

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(['todos', undefined]);
      const todo2 = cached?.find((t) => t.id === 'todo-2');
      expect(todo2?.is_completed).toBe(true);
    });
  });

  it('토글 실패 시 캐시를 이전 상태로 롤백한다', async () => {
    const { queryClient, Wrapper } = createWrapper([mockTodo]);
    vi.spyOn(todoApi, 'toggleTodo').mockRejectedValue(new Error('Server Error'));

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Todo[]>(['todos', undefined]);
    expect(cached?.find((t) => t.id === 'todo-1')?.is_completed).toBe(false);
  });

  it('성공 후 todos 쿼리를 invalidate한다', async () => {
    const { queryClient, Wrapper } = createWrapper([mockTodo]);
    vi.spyOn(todoApi, 'toggleTodo').mockResolvedValue({ ...mockTodo, is_completed: true });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useToggleTodo(), { wrapper: Wrapper });

    result.current.mutate('todo-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });
});
