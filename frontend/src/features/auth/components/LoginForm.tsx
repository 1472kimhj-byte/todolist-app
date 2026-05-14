import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useLogin } from '@/features/auth/hooks/use-login';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import type { ApiError } from '@/shared/types/common-types';

function validateLoginForm(email: string, password: string) {
  const errors = { email: '', password: '' };
  if (!email) {
    errors.email = '이메일을 입력해주세요.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '올바른 이메일을 입력해주세요.';
  }
  if (!password) {
    errors.password = '비밀번호를 입력해주세요.';
  } else if (password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.';
  }
  return errors;
}

export default function LoginForm() {
  const { mutate, isPending, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const apiError: ApiError | string | null = error
    ? ((error as AxiosError<ApiError>).response?.data ?? '로그인에 실패했습니다.')
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateLoginForm(email, password);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="로그인 폼">
      <h2 style={{
        fontSize: '2.0rem', fontWeight: 600, color: '#242428',
        marginBottom: '20px', letterSpacing: '-0.5px',
      }}>
        로그인
      </h2>

      {apiError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorMessage error={apiError} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          type="email"
          label="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          placeholder="이메일을 입력하세요"
          autoComplete="email"
        />
        <Input
          type="password"
          label="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        loading={isPending}
        disabled={isPending}
        style={{ width: '100%', marginTop: '24px' }}
      >
        로그인
      </Button>
    </form>
  );
}
