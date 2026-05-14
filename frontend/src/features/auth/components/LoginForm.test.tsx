import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';
import { useLogin } from '@/features/auth/hooks/use-login';

vi.mock('@/features/auth/hooks/use-login');

const mockMutate = vi.fn();

function setupMock(overrides = {}) {
  vi.mocked(useLogin).mockReturnValue({
    mutate: mockMutate,
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
    ...overrides,
  } as unknown as ReturnType<typeof useLogin>);
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  it('이메일, 비밀번호 입력 필드와 로그인 버튼을 렌더링한다', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/ })).toBeInTheDocument();
  });

  it('이메일이 빈 경우 제출 시 유효성 에러를 표시하고 mutate를 호출하지 않는다', async () => {
    render(<LoginForm />);
    fireEvent.submit(screen.getByRole('form', { name: '로그인 폼' }));
    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('잘못된 이메일 형식 시 에러 메시지를 표시한다', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('이메일'), 'invalid-email');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }));
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일을 입력해주세요.')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('비밀번호가 8자 미만이면 에러를 표시한다', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('이메일'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), '1234567');
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }));
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument();
    });
  });

  it('유효한 입력으로 제출 시 mutate를 올바른 값으로 호출한다', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('이메일'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('isPending이 true이면 버튼이 비활성화되고 "처리 중..." 텍스트를 표시한다', () => {
    setupMock({ isPending: true });
    render(<LoginForm />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('처리 중...');
  });

  it('API 에러 발생 시 ErrorMessage 컴포넌트(role=alert)를 표시한다', () => {
    const mockError = {
      response: {
        data: { error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
      },
    };
    setupMock({ error: mockError as unknown as Error, isError: true });
    render(<LoginForm />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('API 에러가 없으면 alert를 표시하지 않는다', () => {
    render(<LoginForm />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
