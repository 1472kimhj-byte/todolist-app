import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from './RegisterForm';
import { useRegister } from '@/features/auth/hooks/use-register';

vi.mock('@/features/auth/hooks/use-register');

const mockMutate = vi.fn();

function setupMock(overrides = {}) {
  vi.mocked(useRegister).mockReturnValue({
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
  } as unknown as ReturnType<typeof useRegister>);
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  it('이름, 이메일, 비밀번호, 비밀번호 확인 필드와 가입 버튼을 렌더링한다', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /가입하기/ })).toBeInTheDocument();
  });

  it('이름이 빈 경우 에러를 표시하고 mutate를 호출하지 않는다', async () => {
    render(<RegisterForm />);
    fireEvent.submit(screen.getByRole('form', { name: '회원가입 폼' }));
    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('비밀번호가 일치하지 않으면 에러를 표시하고 제출을 차단한다', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이름'), '테스트');
    await userEvent.type(screen.getByLabelText('이메일'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'different123');
    fireEvent.click(screen.getByRole('button', { name: /가입하기/ }));
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('유효한 입력으로 제출 시 mutate를 올바른 값으로 호출한다', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이름'), '테스트');
    await userEvent.type(screen.getByLabelText('이메일'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /가입하기/ }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        name: '테스트',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('isPending이 true이면 버튼이 비활성화된다', () => {
    setupMock({ isPending: true });
    render(<RegisterForm />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('처리 중...');
  });

  it('API 에러 발생 시 ErrorMessage를 표시한다', () => {
    const mockError = {
      response: {
        data: { error: { code: 'EMAIL_ALREADY_EXISTS', message: '이미 가입된 이메일입니다.' } },
      },
    };
    setupMock({ error: mockError as unknown as Error, isError: true });
    render(<RegisterForm />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('이미 가입된 이메일입니다.');
  });

  it('비밀번호가 8자 미만이면 에러를 표시한다', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이름'), '테스트');
    await userEvent.type(screen.getByLabelText('이메일'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), '1234567');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), '1234567');
    fireEvent.click(screen.getByRole('button', { name: /가입하기/ }));
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument();
    });
  });
});
