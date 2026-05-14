import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleTodo } from '@/features/todo/api/todo-api';
import type { Todo } from '@/features/todo/types/todo-types';

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const queriesData = queryClient.getQueriesData<Todo[]>({ queryKey: ['todos'] });

      queriesData.forEach(([queryKey, todos]) => {
        if (todos) {
          queryClient.setQueryData<Todo[]>(queryKey, (old) =>
            old
              ? old.map((t) =>
                  t.id === id ? { ...t, is_completed: !t.is_completed } : t
                )
              : []
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
