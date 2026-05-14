import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '@/features/category/api/category-api';
import type { CreateCategoryRequest } from '@/features/category/types/category-types';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
