import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoryItem from './CategoryItem';
import * as categoryApi from '@/features/category/api/category-api';

const mockUserCategory = {
  id: 'cat-2',
  name: '운동',
  is_default: false,
  user_id: 'u1',
  created_at: '2026-05-14T00:00:00Z',
};

const mockDefaultCategory = {
  id: 'cat-1',
  name: '업무',
  is_default: true,
  user_id: null,
  created_at: '2026-05-14T00:00:00Z',
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CategoryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('카테고리 이름을 렌더링한다', () => {
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('운동')).toBeInTheDocument();
  });

  it('선택 상태에서 aria-pressed가 true이다', () => {
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={true}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '운동 선택' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('클릭 시 onSelect가 카테고리 id와 함께 호출된다', () => {
    const onSelect = vi.fn();
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={onSelect}
        onEdit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '운동 선택' }));
    expect(onSelect).toHaveBeenCalledWith('cat-2');
  });

  it('기본 카테고리에는 수정/삭제 버튼이 없다', () => {
    renderWithClient(
      <CategoryItem
        category={mockDefaultCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.queryByLabelText('업무 수정')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('업무 삭제')).not.toBeInTheDocument();
  });

  it('사용자 카테고리에는 수정/삭제 버튼이 있다', () => {
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByLabelText('운동 수정')).toBeInTheDocument();
    expect(screen.getByLabelText('운동 삭제')).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 onEdit이 호출된다', () => {
    const onEdit = vi.fn();
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByLabelText('운동 수정'));
    expect(onEdit).toHaveBeenCalledWith(mockUserCategory);
  });

  it('삭제 버튼 클릭 시 확인 다이얼로그가 표시된다', () => {
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('운동 삭제'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/'운동' 카테고리를 삭제하시겠습니까\?/)).toBeInTheDocument();
  });

  it('확인 다이얼로그에서 취소 클릭 시 다이얼로그가 닫힌다', () => {
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('운동 삭제'));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('확인 다이얼로그에서 삭제 클릭 시 deleteCategory를 호출한다', async () => {
    vi.spyOn(categoryApi, 'deleteCategory').mockResolvedValue(undefined);
    renderWithClient(
      <CategoryItem
        category={mockUserCategory}
        isSelected={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('운동 삭제'));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(categoryApi.deleteCategory).toHaveBeenCalledWith('cat-2'));
  });
});
