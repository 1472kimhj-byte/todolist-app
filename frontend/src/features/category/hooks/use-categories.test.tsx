import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCategories } from './use-categories';
import * as categoryApi from '@/features/category/api/category-api';

const mockCategories = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-2', name: '운동', is_default: false, user_id: 'u1', created_at: '2026-05-14T00:00:00Z' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('카테고리 목록을 fetch하여 반환한다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCategories);
  });

  it('초기 상태에서 isLoading이 true이다', () => {
    vi.spyOn(categoryApi, 'getCategories').mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('API 실패 시 isError가 true이다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("query key가 ['categories']이다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['categories'])).toEqual(mockCategories);
  });
});
