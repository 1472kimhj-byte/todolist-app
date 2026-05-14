import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useLogin } from '@/features/auth/hooks/use-login';

vi.mock('@/features/auth/hooks/use-login');

vi.mocked(useLogin).mockReturnValue({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  isSuccess: false,
  isIdle: true,
  status: 'idle',
  reset: vi.fn(),
  context: undefined,
  data: undefined,
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
  variables: undefined,
} as unknown as ReturnType<typeof useLogin>);

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('앱 타이틀 "TodoListApp"을 표시한다', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { level: 1, name: 'TodoListApp' })).toBeInTheDocument();
  });

  it('슬로건 "개인 할일 관리 앱"을 표시한다', () => {
    renderLoginPage();
    expect(screen.getByText('개인 할일 관리 앱')).toBeInTheDocument();
  });

  it('LoginForm이 렌더링된다', () => {
    renderLoginPage();
    expect(screen.getByRole('form', { name: '로그인 폼' })).toBeInTheDocument();
  });

  it('회원가입 링크가 /register를 가리킨다', () => {
    renderLoginPage();
    const link = screen.getByRole('link', { name: '회원가입' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });
});
