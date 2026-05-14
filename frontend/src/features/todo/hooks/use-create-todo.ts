import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from '@/features/todo/api/todo-api';
import type { CreateTodoRequest } from '@/features/todo/types/todo-types';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTodoRequest) => createTodo(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
