import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoryForm from './CategoryForm';
import * as categoryApi from '@/features/category/api/category-api';

const mockCategory = {
  id: 'cat-2',
  name: '운동',
  is_default: false,
  user_id: 'u1',
  created_at: '2026-05-14T00:00:00Z',
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('생성 모드', () => {
    it('aria-label이 "카테고리 생성 폼"이다', () => {
      renderWithClient(<CategoryForm mode="create" onClose={vi.fn()} />);
      expect(screen.getByRole('form', { name: '카테고리 생성 폼' })).toBeInTheDocument();
    });

    it('이름이 비어있을 때 제출 시 오류 메시지를 표시한다', () => {
      renderWithClient(<CategoryForm mode="create" onClose={vi.fn()} />);
      fireEvent.submit(screen.getByRole('form', { name: '카테고리 생성 폼' }));
      expect(screen.getByText('카테고리 이름을 입력해주세요.')).toBeInTheDocument();
    });

    it('유효한 이름으로 제출 시 createCategory를 호출한다', async () => {
      vi.spyOn(categoryApi, 'createCategory').mockResolvedValue(mockCategory);
      const onClose = vi.fn();

      renderWithClient(<CategoryForm mode="create" onClose={onClose} />);

      fireEvent.change(screen.getByPlaceholderText('카테고리 이름 입력'), {
        target: { value: '운동' },
      });
      fireEvent.submit(screen.getByRole('form', { name: '카테고리 생성 폼' }));

      await waitFor(() => expect(categoryApi.createCategory).toHaveBeenCalledWith({ name: '운동' }));
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('취소 버튼 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      renderWithClient(<CategoryForm mode="create" onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('생성 버튼 텍스트가 "생성"이다', () => {
      renderWithClient(<CategoryForm mode="create" onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: '생성' })).toBeInTheDocument();
    });
  });

  describe('수정 모드', () => {
    it('aria-label이 "카테고리 수정 폼"이다', () => {
      renderWithClient(<CategoryForm mode="edit" category={mockCategory} onClose={vi.fn()} />);
      expect(screen.getByRole('form', { name: '카테고리 수정 폼' })).toBeInTheDocument();
    });

    it('기존 카테고리 이름이 입력 필드 초기값으로 설정된다', () => {
      renderWithClient(<CategoryForm mode="edit" category={mockCategory} onClose={vi.fn()} />);
      expect(screen.getByDisplayValue('운동')).toBeInTheDocument();
    });

    it('유효한 이름으로 제출 시 updateCategory를 호출한다', async () => {
      vi.spyOn(categoryApi, 'updateCategory').mockResolvedValue({ ...mockCategory, name: '헬스' });
      const onClose = vi.fn();

      renderWithClient(<CategoryForm mode="edit" category={mockCategory} onClose={onClose} />);

      fireEvent.change(screen.getByDisplayValue('운동'), {
        target: { value: '헬스' },
      });
      fireEvent.submit(screen.getByRole('form', { name: '카테고리 수정 폼' }));

      await waitFor(() =>
        expect(categoryApi.updateCategory).toHaveBeenCalledWith('cat-2', { name: '헬스' })
      );
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('수정 버튼 텍스트가 "수정"이다', () => {
      renderWithClient(<CategoryForm mode="edit" category={mockCategory} onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    });
  });
});
