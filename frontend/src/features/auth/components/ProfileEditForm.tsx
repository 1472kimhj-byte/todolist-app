import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useUpdateMe } from '@/features/auth/hooks/use-update-me';
import { useDeleteMe } from '@/features/auth/hooks/use-delete-me';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import type { ApiError } from '@/shared/types/common-types';

export default function ProfileEditForm() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  
  const updateMeMutation = useUpdateMe();
  const deleteMeMutation = useDeleteMe();

  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setNameError('이름을 입력해주세요.');
      return;
    }
    setNameError('');
    updateMeMutation.mutate({ name });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setPasswordError('');
    setConfirmPasswordError('');
    updateMeMutation.mutate({ currentPassword, password: newPassword }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert('비밀번호가 성공적으로 변경되었습니다.');
      }
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      deleteMeMutation.mutate();
    }
  };

  const getApiError = (error: unknown) => {
    if (!error) return null;
    return (error as AxiosError<ApiError>).response?.data ?? '요청에 실패했습니다.';
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '0 20px',
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <button 
          onClick={() => navigate('/todos')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6157EA',
            fontSize: '1.6rem',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          &larr; 돌아가기
        </button>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: '#190331', margin: 0 }}>프로필 설정</h1>
      </div>

      {/* 섹션 1: 이름 수정 */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '16px', color: '#242428' }}>기본 정보 수정</h2>
        <form onSubmit={handleUpdateName}>
          <Input
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            placeholder="이름을 입력하세요"
          />
          <Button 
            type="submit" 
            style={{ marginTop: '16px' }}
            loading={updateMeMutation.isPending && !currentPassword}
            disabled={updateMeMutation.isPending}
          >
            이름 변경
          </Button>
          {updateMeMutation.error && !currentPassword && (
            <div style={{ marginTop: '8px' }}>
              <ErrorMessage error={getApiError(updateMeMutation.error)} />
            </div>
          )}
        </form>
      </section>

      {/* 섹션 2: 비밀번호 변경 */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '16px', color: '#242428' }}>비밀번호 변경</h2>
        <form onSubmit={handleUpdatePassword}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              type="password"
              label="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={passwordError}
              placeholder="현재 비밀번호를 입력하세요"
            />
            <Input
              type="password"
              label="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요 (8자 이상)"
            />
            <Input
              type="password"
              label="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPasswordError}
              placeholder="새 비밀번호를 다시 입력하세요"
            />
          </div>
          <Button 
            type="submit" 
            style={{ marginTop: '16px' }}
            loading={updateMeMutation.isPending && !!currentPassword}
            disabled={updateMeMutation.isPending}
          >
            비밀번호 변경
          </Button>
          {updateMeMutation.error && !!currentPassword && (
            <div style={{ marginTop: '8px' }}>
              <ErrorMessage error={getApiError(updateMeMutation.error)} />
            </div>
          )}
        </form>
      </section>

      {/* 섹션 3: 회원 탈퇴 */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '8px', color: '#DC2626' }}>계정 삭제</h2>
        <p style={{ color: '#6B7280', fontSize: '1.4rem', marginBottom: '16px' }}>
          계정을 삭제하면 모든 할일과 카테고리 정보가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        <Button 
          variant="danger" 
          onClick={handleDeleteAccount}
          loading={deleteMeMutation.isPending}
          disabled={deleteMeMutation.isPending}
        >
          회원 탈퇴
        </Button>
        {deleteMeMutation.error && (
          <div style={{ marginTop: '8px' }}>
            <ErrorMessage error={getApiError(deleteMeMutation.error)} />
          </div>
        )}
      </section>
    </div>
  );
}
