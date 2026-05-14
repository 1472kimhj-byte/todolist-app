import type { ApiError } from '@/shared/types/common-types';

interface ErrorMessageProps {
  error: ApiError | string | null | undefined;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;

  const message =
    typeof error === 'string'
      ? error
      : error.error?.message || '오류가 발생했습니다.';

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        backgroundColor: 'var(--danger-bg)',
        color: 'var(--danger-color)',
        border: '1px solid var(--danger-color)',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '1.4rem',
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
        transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
      }}
    >
      {message}
    </div>
  );
}
