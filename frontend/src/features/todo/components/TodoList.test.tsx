import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TodoList from './TodoList';
import * as todoApi from '@/features/todo/api/todo-api';
import * as categoryApi from '@/features/category/api/category-api';

const mockTodos = [
  {
    id: 'todo-1',
    user_id: 'u1',
    category_id: 'cat-1',
    title: '장보기',
    description: null,
    is_completed: false,
    due_date: null,
    created_at: '2026-05-14T00:00:00Z',
    updated_at: '2026-05-14T00:00:00Z',
  },
  {
    id: 'todo-2',
    user_id: 'u1',
    category_id: 'cat-1',
    title: '운동하기',
    description: '30분 달리기',
    is_completed: true,
    due_date: null,
    created_at: '2026-05-14T00:00:00Z',
    updated_at: '2026-05-14T00:00:00Z',
  },
];

const mockCategories = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
  });

  it('로딩 중에 스켈레톤을 표시한다', () => {
    vi.spyOn(todoApi, 'getTodos').mockImplementation(() => new Promise(() => {}));
    renderWithClient(<TodoList />);
    const skeletons = document.querySelectorAll('[style*="height: 72px"]');
    expect(skeletons.length).toBe(3);
  });

  it('에러 시 에러 메시지를 표시한다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockRejectedValue(new Error('Network error'));
    renderWithClient(<TodoList />);
    await waitFor(() =>
      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
    );
  });

  it('할일이 없을 때 빈 상태 메시지를 표시한다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue([]);
    renderWithClient(<TodoList />);
    await waitFor(() =>
      expect(screen.getByText('할일이 없습니다')).toBeInTheDocument()
    );
  });

  it('할일 목록을 렌더링한다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue(mockTodos);
    renderWithClient(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('장보기')).toBeInTheDocument();
      expect(screen.getByText('운동하기')).toBeInTheDocument();
    });
  });

  it('filterParams를 useTodos에 전달한다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue([]);
    const filter = { category_id: 'cat-1' };
    renderWithClient(<TodoList filterParams={filter} />);
    await waitFor(() => expect(todoApi.getTodos).toHaveBeenCalledWith(filter));
  });

  it('수정 버튼 클릭 시 수정 모달이 열린다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue(mockTodos);
    renderWithClient(<TodoList />);
    await waitFor(() => expect(screen.getByText('장보기')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('장보기 수정'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('할일 수정')).toBeInTheDocument();
    });
  });

  it('수정 모달에서 취소 클릭 시 닫힌다', async () => {
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue(mockTodos);
    renderWithClient(<TodoList />);
    await waitFor(() => expect(screen.getByText('장보기')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('장보기 수정'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: '취소' })[0]);
    await waitFor(() => expect(screen.queryByText('할일 수정')).not.toBeInTheDocument());
  });
});
