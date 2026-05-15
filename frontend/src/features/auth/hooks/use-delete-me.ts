import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteMe } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/store/auth-store';
import type { DeleteMeRequest } from '@/features/auth/types/auth-types';

export function useDeleteMe() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: DeleteMeRequest) => deleteMe(data),
    onSuccess: () => {
      clearAuth();
      void navigate('/login');
    },
  });
}
