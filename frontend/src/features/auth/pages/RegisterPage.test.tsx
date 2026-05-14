import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { useRegister } from '@/features/auth/hooks/use-register';

vi.mock('@/features/auth/hooks/use-register');

vi.mocked(useRegister).mockReturnValue({
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
} as unknown as ReturnType<typeof useRegister>);

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  it('앱 타이틀 "TodoListApp"을 표시한다', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { level: 1, name: 'TodoListApp' })).toBeInTheDocument();
  });

  it('슬로건 "개인 할일 관리 앱"을 표시한다', () => {
    renderRegisterPage();
    expect(screen.getByText('개인 할일 관리 앱')).toBeInTheDocument();
  });

  it('RegisterForm이 렌더링된다', () => {
    renderRegisterPage();
    expect(screen.getByRole('form', { name: '회원가입 폼' })).toBeInTheDocument();
  });

  it('로그인 링크가 /login을 가리킨다', () => {
    renderRegisterPage();
    const link = screen.getByRole('link', { name: '로그인' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});
