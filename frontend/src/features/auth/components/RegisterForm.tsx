import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useRegister } from '@/features/auth/hooks/use-register';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import type { ApiError } from '@/shared/types/common-types';

function validateRegisterForm(
  name: string, email: string, password: string, passwordConfirm: string
) {
  const errors = { name: '', email: '', password: '', passwordConfirm: '' };
  if (!name.trim()) errors.name = '이름을 입력해주세요.';
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
  if (!passwordConfirm) {
    errors.passwordConfirm = '비밀번호를 다시 입력해주세요.';
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }
  return errors;
}

export default function RegisterForm() {
  const { mutate, isPending, error } = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '', email: '', password: '', passwordConfirm: '',
  });

  const apiError: ApiError | string | null = error
    ? ((error as AxiosError<ApiError>).response?.data ?? '회원가입에 실패했습니다.')
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateRegisterForm(name, email, password, passwordConfirm);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    mutate({ name: name.trim(), email, password });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="회원가입 폼">
      <h2 style={{
        fontSize: '2.0rem', fontWeight: 600, color: '#242428',
        marginBottom: '20px', letterSpacing: '-0.5px',
      }}>
        회원가입
      </h2>

      {apiError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorMessage error={apiError} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          type="text"
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          placeholder="이름을 입력하세요"
          autoComplete="name"
        />
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
          autoComplete="new-password"
          helperText="8자 이상 입력해주세요"
        />
        <Input
          type="password"
          label="비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={fieldErrors.passwordConfirm}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        loading={isPending}
        disabled={isPending}
        style={{ width: '100%', marginTop: '24px' }}
      >
        가입하기
      </Button>
    </form>
  );
}
