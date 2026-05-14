import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoryList from './CategoryList';
import * as categoryApi from '@/features/category/api/category-api';

const mockCategories = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-2', name: '운동', is_default: false, user_id: 'u1', created_at: '2026-05-14T00:00:00Z' },
];

function renderWithClient(
  selectedCategoryId: string | null = null,
  onSelectCategory = vi.fn()
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryList
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
      />
    </QueryClientProvider>
  );
}

describe('CategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 중에 로딩 메시지를 표시한다', () => {
    vi.spyOn(categoryApi, 'getCategories').mockImplementation(() => new Promise(() => {}));
    renderWithClient();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('에러 시 에러 메시지를 표시한다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockRejectedValue(new Error('Network error'));
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText('카테고리를 불러오지 못했습니다.')).toBeInTheDocument()
    );
  });

  it('카테고리 목록을 렌더링한다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    renderWithClient();
    await waitFor(() => {
      expect(screen.getByText('업무')).toBeInTheDocument();
      expect(screen.getByText('운동')).toBeInTheDocument();
    });
  });

  it('"전체" 항목이 항상 표시된다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    renderWithClient();
    await waitFor(() => expect(screen.getByText('전체')).toBeInTheDocument());
  });

  it('"전체" 클릭 시 onSelectCategory(null)이 호출된다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    const onSelectCategory = vi.fn();
    renderWithClient('cat-1', onSelectCategory);

    await waitFor(() => expect(screen.getByText('전체')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '전체' }));
    expect(onSelectCategory).toHaveBeenCalledWith(null);
  });

  it('selectedCategoryId가 null이면 "전체"가 선택 상태이다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    renderWithClient(null);
    await waitFor(() => expect(screen.getByText('전체')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('+ 추가 버튼 클릭 시 카테고리 생성 모달이 열린다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    renderWithClient();
    await waitFor(() => expect(screen.getByText('+ 추가')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '+ 추가' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('카테고리 생성')).toBeInTheDocument();
  });

  it('모달에서 취소 버튼 클릭 시 모달이 닫힌다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    renderWithClient();
    await waitFor(() => expect(screen.getByText('+ 추가')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '+ 추가' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 카테고리 수정 모달이 열린다', async () => {
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    renderWithClient();
    await waitFor(() => expect(screen.getByLabelText('운동 수정')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('운동 수정'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('카테고리 수정')).toBeInTheDocument();
    });
  });
});
