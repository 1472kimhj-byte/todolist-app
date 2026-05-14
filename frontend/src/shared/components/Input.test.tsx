import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input 컴포넌트', () => {
  describe('기본 렌더링', () => {
    it('input 요소를 렌더링한다', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('label prop', () => {
    it('label이 주어지면 렌더링된다', () => {
      render(<Input label="이메일" id="email" />);
      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    });

    it('label이 없으면 label 요소가 렌더링되지 않는다', () => {
      render(<Input />);
      expect(screen.queryByText(/label/i)).not.toBeInTheDocument();
    });
  });

  describe('error prop', () => {
    it('error 메시지가 표시된다', () => {
      render(<Input error="필수 입력 항목입니다." />);
      expect(screen.getByRole('alert')).toHaveTextContent('필수 입력 항목입니다.');
    });

    it('error가 있으면 aria-invalid가 true이다', () => {
      render(<Input error="에러" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('error가 없으면 aria-invalid가 false이다', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('error가 있으면 테두리 색상이 #E1535D로 변경된다', () => {
      render(<Input error="에러" />);
      expect(screen.getByRole('textbox')).toHaveStyle({ borderColor: '#E1535D' });
    });
  });

  describe('helperText prop', () => {
    it('helperText가 표시된다', () => {
      render(<Input helperText="8자 이상 입력하세요." />);
      expect(screen.getByText('8자 이상 입력하세요.')).toBeInTheDocument();
    });

    it('error가 있으면 helperText는 표시되지 않는다', () => {
      render(<Input error="에러" helperText="도움말" />);
      expect(screen.queryByText('도움말')).not.toBeInTheDocument();
    });
  });

  describe('disabled 상태', () => {
    it('disabled prop이 적용된다', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disabled 상태에서 배경색이 변경된다', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toHaveStyle({ backgroundColor: '#F2F2F2' });
    });
  });

  describe('사용자 입력', () => {
    it('텍스트를 입력할 수 있다', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');
      expect(input).toHaveValue('hello');
    });

    it('onChange 핸들러가 호출된다', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Input onChange={onChange} />);
      await user.type(screen.getByRole('textbox'), 'a');
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('label과 input이 htmlFor로 연결된다', () => {
      render(<Input label="이름" id="name" />);
      const input = screen.getByLabelText('이름');
      expect(input).toBeInTheDocument();
    });

    it('error 메시지가 aria-describedby로 input과 연결된다', () => {
      render(<Input id="email" error="에러 메시지" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveTextContent('에러 메시지');
    });
  });
});
