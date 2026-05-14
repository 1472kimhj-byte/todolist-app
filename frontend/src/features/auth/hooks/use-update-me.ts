import { useMutation } from '@tanstack/react-query';
import { updateMe } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/store/auth-store';
import type { UpdateMeRequest } from '@/features/auth/types/auth-types';

export function useUpdateMe() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: UpdateMeRequest) => updateMe(data),
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}
