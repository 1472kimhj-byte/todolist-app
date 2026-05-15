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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
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
    setDeletePassword('');
    deleteMeMutation.reset();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!deletePassword) return;
    deleteMeMutation.mutate({ password: deletePassword });
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
      </section>

      {showDeleteDialog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--modal-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: 'calc(100% - 32px)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <h3 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#DC2626', marginBottom: '8px' }}>
              회원 탈퇴 확인
            </h3>
            <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              탈퇴 전 본인 확인을 위해 현재 비밀번호를 입력해주세요.
            </p>
            <Input
              type="password"
              label="현재 비밀번호"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
            />
            {deleteMeMutation.error && (
              <div style={{ marginTop: '8px' }}>
                <ErrorMessage error={getApiError(deleteMeMutation.error)} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteMeMutation.isPending}
              >
                취소
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMeMutation.isPending}
                onClick={handleConfirmDelete}
              >
                탈퇴 확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
