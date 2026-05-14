import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TodoForm from './TodoForm';
import * as todoApi from '@/features/todo/api/todo-api';
import * as categoryApi from '@/features/category/api/category-api';
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

const mockCategories = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-2', name: '운동', is_default: false, user_id: 'u1', created_at: '2026-05-14T00:00:00Z' },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
  });

  describe('생성 모드', () => {
    it('aria-label이 "할일 생성 폼"이다', () => {
      renderWithClient(<TodoForm mode="create" onClose={vi.fn()} />);
      expect(screen.getByRole('form', { name: '할일 생성 폼' })).toBeInTheDocument();
    });

    it('제목이 비어있을 때 제출 시 오류 메시지를 표시한다', () => {
      renderWithClient(<TodoForm mode="create" onClose={vi.fn()} />);
      fireEvent.submit(screen.getByRole('form', { name: '할일 생성 폼' }));
      expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
    });

    it('유효한 제목으로 제출 시 createTodo를 호출한다', async () => {
      vi.spyOn(todoApi, 'createTodo').mockResolvedValue(mockTodo);
      const onClose = vi.fn();
      renderWithClient(<TodoForm mode="create" onClose={onClose} />);

      fireEvent.change(screen.getByPlaceholderText('할일 제목 입력'), {
        target: { value: '장보기' },
      });
      fireEvent.submit(screen.getByRole('form', { name: '할일 생성 폼' }));

      await waitFor(() =>
        expect(todoApi.createTodo).toHaveBeenCalledWith(
          expect.objectContaining({ title: '장보기' })
        )
      );
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('카테고리 드롭다운이 렌더링된다', async () => {
      renderWithClient(<TodoForm mode="create" onClose={vi.fn()} />);
      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: '카테고리 선택' })).toBeInTheDocument()
      );
    });

    it('취소 버튼 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      renderWithClient(<TodoForm mode="create" onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('추가 버튼 텍스트가 "추가"이다', () => {
      renderWithClient(<TodoForm mode="create" onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument();
    });
  });

  describe('수정 모드', () => {
    it('aria-label이 "할일 수정 폼"이다', () => {
      renderWithClient(<TodoForm mode="edit" todo={mockTodo} onClose={vi.fn()} />);
      expect(screen.getByRole('form', { name: '할일 수정 폼' })).toBeInTheDocument();
    });

    it('기존 할일 제목이 입력 필드 초기값으로 설정된다', () => {
      renderWithClient(<TodoForm mode="edit" todo={mockTodo} onClose={vi.fn()} />);
      expect(screen.getByDisplayValue('장보기')).toBeInTheDocument();
    });

    it('기존 할일 설명이 textarea 초기값으로 설정된다', () => {
      renderWithClient(<TodoForm mode="edit" todo={mockTodo} onClose={vi.fn()} />);
      expect(screen.getByDisplayValue('우유, 계란')).toBeInTheDocument();
    });

    it('유효한 제목으로 제출 시 updateTodo를 호출한다', async () => {
      vi.spyOn(todoApi, 'updateTodo').mockResolvedValue({ ...mockTodo, title: '수정된 제목' });
      const onClose = vi.fn();
      renderWithClient(<TodoForm mode="edit" todo={mockTodo} onClose={onClose} />);

      fireEvent.change(screen.getByDisplayValue('장보기'), {
        target: { value: '수정된 제목' },
      });
      fireEvent.submit(screen.getByRole('form', { name: '할일 수정 폼' }));

      await waitFor(() =>
        expect(todoApi.updateTodo).toHaveBeenCalledWith(
          'todo-1',
          expect.objectContaining({ title: '수정된 제목' })
        )
      );
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('저장 버튼 텍스트가 "저장"이다', () => {
      renderWithClient(<TodoForm mode="edit" todo={mockTodo} onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });
  });
});
