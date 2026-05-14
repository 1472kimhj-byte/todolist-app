import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTodo } from '@/features/todo/api/todo-api';
import type { Todo } from '@/features/todo/types/todo-types';

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const queriesData = queryClient.getQueriesData<Todo[]>({ queryKey: ['todos'] });

      queriesData.forEach(([queryKey, todos]) => {
        if (todos) {
          queryClient.setQueryData<Todo[]>(queryKey, (old) =>
            old ? old.filter((t) => t.id !== id) : []
          );
        }
      });

      return { queriesData };
    },
    onError: (_err, _id, context) => {
      context?.queriesData.forEach(([queryKey, todos]) => {
        queryClient.setQueryData(queryKey, todos);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
