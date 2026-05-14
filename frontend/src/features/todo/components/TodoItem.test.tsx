import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TodoItem from './TodoItem';
import * as todoApi from '@/features/todo/api/todo-api';
import type { Todo } from '@/features/todo/types/todo-types';

const mockTodo: Todo = {
  id: 'todo-1',
  user_id: 'u1',
  category_id: 'cat-1',
  title: '장보기',
  description: '우유, 계란',
  is_completed: false,
  due_date: '2026-05-20',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

const completedTodo: Todo = { ...mockTodo, is_completed: true };

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('할일 제목을 렌더링한다', () => {
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    expect(screen.getByText('장보기')).toBeInTheDocument();
  });

  it('설명을 렌더링한다', () => {
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    expect(screen.getByText('우유, 계란')).toBeInTheDocument();
  });

  it('마감일을 렌더링한다', () => {
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    expect(screen.getByText(/2026-05-20/)).toBeInTheDocument();
  });

  it('설명이 없으면 렌더링하지 않는다', () => {
    const todo = { ...mockTodo, description: null };
    renderWithClient(<TodoItem todo={todo} onEdit={vi.fn()} />);
    expect(screen.queryByText('우유, 계란')).not.toBeInTheDocument();
  });

  it('미완료 상태에서 체크박스 aria-label이 "완료로 표시"이다', () => {
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    expect(screen.getByRole('button', { name: '완료로 표시' })).toBeInTheDocument();
  });

  it('완료 상태에서 체크박스 aria-label이 "미완료로 표시"이다', () => {
    renderWithClient(<TodoItem todo={completedTodo} onEdit={vi.fn()} />);
    expect(screen.getByRole('button', { name: '미완료로 표시' })).toBeInTheDocument();
  });

  it('체크박스 클릭 시 toggleTodo를 호출한다', async () => {
    vi.spyOn(todoApi, 'toggleTodo').mockResolvedValue({ ...mockTodo, is_completed: true });
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '완료로 표시' }));
    await waitFor(() => expect(todoApi.toggleTodo).toHaveBeenCalledWith('todo-1'));
  });

  it('수정 버튼 클릭 시 onEdit이 호출된다', () => {
    const onEdit = vi.fn();
    renderWithClient(<TodoItem todo={mockTodo} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('장보기 수정'));
    expect(onEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('삭제 버튼 클릭 시 확인 다이얼로그가 표시된다', () => {
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('장보기 삭제'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/'장보기' 할일을 삭제하시겠습니까\?/)).toBeInTheDocument();
  });

  it('확인 다이얼로그 취소 클릭 시 다이얼로그가 닫힌다', () => {
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('장보기 삭제'));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('확인 다이얼로그 삭제 클릭 시 deleteTodo를 호출한다', async () => {
    vi.spyOn(todoApi, 'deleteTodo').mockResolvedValue(undefined);
    renderWithClient(<TodoItem todo={mockTodo} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('장보기 삭제'));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(todoApi.deleteTodo).toHaveBeenCalledWith('todo-1'));
  });
});
