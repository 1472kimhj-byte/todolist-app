import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo } from '@/features/todo/api/todo-api';
import type { UpdateTodoRequest } from '@/features/todo/types/todo-types';

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoRequest }) =>
      updateTodo(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
