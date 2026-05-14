import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage 컴포넌트', () => {
  it('error가 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('error가 undefined이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ErrorMessage error={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('문자열 에러를 표시한다', () => {
    render(<ErrorMessage error="네트워크 오류가 발생했습니다." />);
    expect(screen.getByRole('alert')).toHaveTextContent('네트워크 오류가 발생했습니다.');
  });

  it('ApiError 객체의 message를 표시한다', () => {
    const apiError = {
      error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
    };
    render(<ErrorMessage error={apiError} />);
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('ApiError의 message가 없으면 기본 메시지를 표시한다', () => {
    const apiError = { error: { code: 'UNKNOWN', message: '' } };
    render(<ErrorMessage error={apiError} />);
    expect(screen.getByRole('alert')).toHaveTextContent('오류가 발생했습니다.');
  });

  it('role="alert"와 aria-live="polite"를 가진다', () => {
    render(<ErrorMessage error="에러" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('에러 메시지 스타일이 적용된다', () => {
    render(<ErrorMessage error="에러" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveStyle({ color: '#E1535D' });
  });
});
