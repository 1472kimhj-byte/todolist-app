import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TodoListPage from './TodoListPage';
import * as todoApi from '@/features/todo/api/todo-api';
import * as categoryApi from '@/features/category/api/category-api';
import * as authApi from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/store/auth-store';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => mockNavigate };
});

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
];

const mockCategories = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-2', name: '개인', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={['/todos']}>
      <QueryClientProvider client={queryClient}>
        <TodoListPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('TodoListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(todoApi, 'getTodos').mockResolvedValue(mockTodos);
    vi.spyOn(categoryApi, 'getCategories').mockResolvedValue(mockCategories);
    useAuthStore.getState().clearAuth();
  });

  it('앱 타이틀이 렌더링된다', () => {
    renderPage();
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
  });

  it('프로필 링크가 /profile로 이동한다', () => {
    renderPage();
    expect(screen.getByRole('link', { name: '프로필' })).toHaveAttribute('href', '/profile');
  });

  it('로그인된 사용자 이름이 프로필 링크에 표시된다', () => {
    useAuthStore
      .getState()
      .setAuth({ id: 'u1', email: 'test@test.com', name: '홍길동' }, 'access', 'refresh');
    renderPage();
    expect(screen.getByRole('link', { name: '홍길동' })).toHaveAttribute('href', '/profile');
  });

  it('로그아웃 버튼이 렌더링된다', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  it('페이지 진입 시 카테고리와 할일 목록을 동시 fetch한다', async () => {
    renderPage();
    await waitFor(() => {
      expect(categoryApi.getCategories).toHaveBeenCalled();
      expect(todoApi.getTodos).toHaveBeenCalled();
    });
  });

  it('카테고리 선택 시 해당 category_id로 할일을 필터링한다', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '업무 선택' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: '업무 선택' }));
    await waitFor(() =>
      expect(todoApi.getTodos).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 'cat-1' })
      )
    );
  });

  it('TodoFilter의 완료 필터와 카테고리 사이드바 선택이 복합 적용된다', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '업무 선택' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: '업무 선택' }));
    await waitFor(() =>
      expect(todoApi.getTodos).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 'cat-1' })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: '미완료' }));
    await waitFor(() =>
      expect(todoApi.getTodos).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 'cat-1', is_completed: false })
      )
    );
  });

  it('로그아웃 버튼 클릭 시 API 호출 후 store 초기화 및 /login으로 이동한다', async () => {
    useAuthStore
      .getState()
      .setAuth({ id: 'u1', email: 'test@test.com', name: 'Test' }, 'access-token', 'refresh-token');
    vi.spyOn(authApi, 'logout').mockResolvedValue(undefined);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalledWith('refresh-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('로그아웃 API 실패 시에도 store 초기화 및 /login으로 이동한다', async () => {
    useAuthStore
      .getState()
      .setAuth({ id: 'u1', email: 'test@test.com', name: 'Test' }, 'access-token', 'refresh-token');
    vi.spyOn(authApi, 'logout').mockRejectedValue(new Error('Network error'));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('할일 추가 버튼 클릭 시 모달이 열린다', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '할일 추가' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '할일 추가' })).toBeInTheDocument();
  });

  it('할일 추가 폼 취소 클릭 시 모달이 닫힌다', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '할일 추가' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
