import { useQuery } from '@tanstack/react-query';
import { getTodos } from '@/features/todo/api/todo-api';
import type { TodoFilterParams } from '@/features/todo/types/todo-types';

export function useTodos(filterParams?: TodoFilterParams) {
  return useQuery({
    queryKey: ['todos', filterParams],
    queryFn: () => getTodos(filterParams),
  });
}
