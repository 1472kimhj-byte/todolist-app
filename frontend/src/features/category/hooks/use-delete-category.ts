import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '@/features/category/api/category-api';
import type { Category } from '@/features/category/types/category-types';

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);
      queryClient.setQueryData<Category[]>(['categories'], (old) =>
        old ? old.filter((c) => c.id !== id) : []
      );
      return { previousCategories };
    },
    onError: (_err, _id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
