import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteMe } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/store/auth-store';

export function useDeleteMe() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => deleteMe(),
    onSuccess: () => {
      clearAuth();
      void navigate('/login');
    },
  });
}
