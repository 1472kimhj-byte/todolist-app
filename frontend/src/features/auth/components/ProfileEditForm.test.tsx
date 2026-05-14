import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import ProfileEditForm from './ProfileEditForm';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useUpdateMe } from '@/features/auth/hooks/use-update-me';
import { useDeleteMe } from '@/features/auth/hooks/use-delete-me';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock hooks and store
vi.mock('@/features/auth/store/auth-store');
vi.mock('@/features/auth/hooks/use-update-me');
vi.mock('@/features/auth/hooks/use-delete-me');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    // Note: variables used in vi.mock must be prefixed with 'mock'
    useNavigate: () => mockNavigate,
  };
});

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: '테스터',
  created_at: '2024-01-01T00:00:00Z',
};

const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

function setupMocks() {
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({
      user: mockUser,
      clearAuth: vi.fn(),
      updateUser: vi.fn(),
    })
  );

  vi.mocked(useUpdateMe).mockReturnValue({
    mutate: mockUpdateMutate,
    isPending: false,
    error: null,
  } as any);

  vi.mocked(useDeleteMe).mockReturnValue({
    mutate: mockDeleteMutate,
    isPending: false,
    error: null,
  } as any);
}

describe('ProfileEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('alert', vi.fn());
  });

  it('초기값이 스토어의 유저 정보로 설정된다', () => {
    render(
      <BrowserRouter>
        <ProfileEditForm />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('이름')).toHaveValue(mockUser.name);
  });

  it('돌아가기 버튼 클릭 시 /todos로 이동한다', () => {
    render(
      <BrowserRouter>
        <ProfileEditForm />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('← 돌아가기'));
    expect(mockNavigate).toHaveBeenCalledWith('/todos');
  });

  describe('이름 수정 섹션', () => {
    it('이름을 비우고 제출하면 에러 메시지를 표시한다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      const nameInput = screen.getByLabelText('이름');
      await userEvent.clear(nameInput);
      fireEvent.click(screen.getByRole('button', { name: '이름 변경' }));
      
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('유효한 이름으로 제출하면 mutate를 호출한다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      const nameInput = screen.getByLabelText('이름');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, '새이름');
      fireEvent.click(screen.getByRole('button', { name: '이름 변경' }));
      
      expect(mockUpdateMutate).toHaveBeenCalledWith({ name: '새이름' });
    });

    it('API 에러 발생 시 에러 메시지를 표시한다', () => {
      const mockError = {
        response: {
          data: { error: { code: 'UPDATE_FAILED', message: '이름 변경에 실패했습니다.' } },
        },
      };
      vi.mocked(useUpdateMe).mockReturnValue({
        mutate: mockUpdateMutate,
        isPending: false,
        error: mockError,
      } as any);

      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      
      expect(screen.getByRole('alert')).toHaveTextContent('이름 변경에 실패했습니다.');
    });
  });

  describe('비밀번호 변경 섹션', () => {
    it('현재 비밀번호가 비어있으면 에러를 표시한다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
      expect(screen.getByText('현재 비밀번호를 입력해주세요.')).toBeInTheDocument();
    });

    it('새 비밀번호가 8자 미만이면 에러를 표시한다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'oldpassword');
      await userEvent.type(screen.getByLabelText('새 비밀번호'), 'short');
      fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
      expect(screen.getByText('새 비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument();
    });

    it('새 비밀번호와 확인이 일치하지 않으면 에러를 표시한다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'oldpassword');
      await userEvent.type(screen.getByLabelText('새 비밀번호'), 'newpassword123');
      await userEvent.type(screen.getByLabelText('새 비밀번호 확인'), 'different123');
      fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });

    it('유효한 비밀번호로 제출하면 mutate를 호출한다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'oldpassword');
      await userEvent.type(screen.getByLabelText('새 비밀번호'), 'newpassword123');
      await userEvent.type(screen.getByLabelText('새 비밀번호 확인'), 'newpassword123');
      fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
      
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        { currentPassword: 'oldpassword', password: 'newpassword123' },
        expect.any(Object)
      );
    });

    it('비밀번호 변경 API 에러 발생 시 에러 메시지를 표시한다', async () => {
      const mockError = {
        response: {
          data: { error: { code: 'INVALID_PASSWORD', message: '현재 비밀번호가 틀립니다.' } },
        },
      };
      vi.mocked(useUpdateMe).mockReturnValue({
        mutate: mockUpdateMutate,
        isPending: false,
        error: mockError,
      } as any);

      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      
      // currentPassword가 있어야 비밀번호 섹션에 에러가 표시됨
      await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'wrongpassword');
      
      expect(screen.getByRole('alert')).toHaveTextContent('현재 비밀번호가 틀립니다.');
    });
  });

  describe('계정 삭제 섹션', () => {
    it('회원 탈퇴 버튼 클릭 시 확인 창을 띄운다', async () => {
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
      expect(window.confirm).toHaveBeenCalled();
    });

    it('확인 창에서 확인을 누르면 mutate를 호출한다', async () => {
      vi.stubGlobal('confirm', vi.fn(() => true));
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
      expect(mockDeleteMutate).toHaveBeenCalled();
    });

    it('확인 창에서 취소를 누르면 mutate를 호출하지 않는다', async () => {
      vi.stubGlobal('confirm', vi.fn(() => false));
      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('삭제 API 에러 발생 시 에러 메시지를 표시한다', () => {
      const mockError = {
        response: {
          data: { error: { code: 'DELETE_FAILED', message: '탈퇴 처리에 실패했습니다.' } },
        },
      };
      vi.mocked(useDeleteMe).mockReturnValue({
        mutate: mockDeleteMutate,
        isPending: false,
        error: mockError,
      } as any);

      render(
        <BrowserRouter>
          <ProfileEditForm />
        </BrowserRouter>
      );
      
      expect(screen.getByRole('alert')).toHaveTextContent('탈퇴 처리에 실패했습니다.');
    });
  });
});
