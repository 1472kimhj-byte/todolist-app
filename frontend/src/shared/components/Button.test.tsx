import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button 컴포넌트', () => {
  describe('기본 렌더링', () => {
    it('children 텍스트를 렌더링한다', () => {
      render(<Button>저장</Button>);
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });

    it('기본 variant는 primary이다', () => {
      render(<Button>버튼</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveStyle({ backgroundColor: '#6157EA', color: '#FFFFFF' });
    });
  });

  describe('variant prop', () => {
    it('secondary variant가 올바르게 렌더링된다', () => {
      render(<Button variant="secondary">취소</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveStyle({ color: '#242428' });
    });

    it('danger variant가 올바르게 렌더링된다', () => {
      render(<Button variant="danger">삭제</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveStyle({ backgroundColor: '#E1535D' });
    });

    it('ghost variant가 올바르게 렌더링된다', () => {
      render(<Button variant="ghost">링크</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveStyle({ color: '#6157EA' });
    });
  });

  describe('size prop', () => {
    it('sm 사이즈가 적용된다', () => {
      render(<Button size="sm">소</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveStyle({ fontSize: '1.4rem' });
    });

    it('lg 사이즈가 적용된다', () => {
      render(<Button size="lg">대</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveStyle({ fontSize: '1.7rem' });
    });
  });

  describe('disabled 상태', () => {
    it('disabled prop이 true이면 버튼이 비활성화된다', () => {
      render(<Button disabled>비활성</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled 상태에서 배경색이 #F2F2F2로 변경된다', () => {
      render(<Button disabled>비활성</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#F2F2F2' });
    });

    it('disabled 상태에서 텍스트 색상이 #888888로 변경된다', () => {
      render(<Button disabled>비활성</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ color: '#888888' });
    });

    it('disabled 상태에서 클릭 이벤트가 발생하지 않는다', () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>비활성</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('loading 상태', () => {
    it('loading이 true이면 "처리 중..." 텍스트를 표시한다', () => {
      render(<Button loading>저장</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('처리 중...');
    });

    it('loading 상태에서 버튼이 비활성화된다', () => {
      render(<Button loading>저장</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('클릭 이벤트', () => {
    it('onClick 핸들러가 호출된다', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>클릭</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('type prop', () => {
    it('type="submit"이 올바르게 설정된다', () => {
      render(<Button type="submit">제출</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });
});
