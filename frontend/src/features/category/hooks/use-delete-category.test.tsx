import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteCategory } from './use-delete-category';
import * as categoryApi from '@/features/category/api/category-api';
import type { Category } from '@/features/category/types/category-types';

const mockCategories: Category[] = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-2', name: '운동', is_default: false, user_id: 'u1', created_at: '2026-05-14T00:00:00Z' },
];

function createWrapper(categories?: Category[]) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  if (categories) {
    queryClient.setQueryData(['categories'], categories);
  }
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('삭제 성공 시 isSuccess가 true이다', async () => {
    const { Wrapper } = createWrapper(mockCategories);
    vi.spyOn(categoryApi, 'deleteCategory').mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: Wrapper });

    result.current.mutate('cat-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('optimistic update: 삭제 요청 즉시 캐시에서 제거한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockCategories);
    vi.spyOn(categoryApi, 'deleteCategory').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
    );

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: Wrapper });

    result.current.mutate('cat-2');

    await waitFor(() => {
      const cached = queryClient.getQueryData<Category[]>(['categories']);
      expect(cached?.find((c) => c.id === 'cat-2')).toBeUndefined();
    });
  });

  it('삭제 실패 시 캐시를 이전 상태로 롤백한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockCategories);
    vi.spyOn(categoryApi, 'deleteCategory').mockRejectedValue(new Error('Server Error'));

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: Wrapper });

    result.current.mutate('cat-2');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Category[]>(['categories']);
    expect(cached).toEqual(mockCategories);
  });

  it('성공 후 categories 쿼리를 invalidate한다', async () => {
    const { queryClient, Wrapper } = createWrapper(mockCategories);
    vi.spyOn(categoryApi, 'deleteCategory').mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: Wrapper });

    result.current.mutate('cat-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] });
  });
});
