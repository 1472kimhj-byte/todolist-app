import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateCategory } from './use-create-category';
import * as categoryApi from '@/features/category/api/category-api';

const mockCategory = {
  id: 'cat-new',
  name: '운동',
  is_default: false,
  user_id: 'u1',
  created_at: '2026-05-14T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 생성된 카테고리를 반환한다', async () => {
    const { Wrapper } = createWrapper();
    vi.spyOn(categoryApi, 'createCategory').mockResolvedValue(mockCategory);

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper });

    result.current.mutate({ name: '운동' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCategory);
  });

  it('성공 후 categories 쿼리를 invalidate한다', async () => {
    const { queryClient, Wrapper } = createWrapper();
    vi.spyOn(categoryApi, 'createCategory').mockResolvedValue(mockCategory);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper });

    result.current.mutate({ name: '운동' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] });
  });

  it('실패 시 isError가 true이다', async () => {
    const { Wrapper } = createWrapper();
    vi.spyOn(categoryApi, 'createCategory').mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper });

    result.current.mutate({ name: '운동' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('요청 중 isPending이 true이다', async () => {
    const { Wrapper } = createWrapper();
    vi.spyOn(categoryApi, 'createCategory').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCategory), 100))
    );

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper });

    result.current.mutate({ name: '운동' });

    await waitFor(() => expect(result.current.isPending).toBe(true));
  });
});
