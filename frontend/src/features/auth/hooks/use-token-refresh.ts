import axios from 'axios';
import { useAuthStore } from '@/features/auth/store/auth-store';
import type { TokenRefreshResponse } from '@/features/auth/types/auth-types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function refreshTokens(token: string): Promise<TokenRefreshResponse> {
  const { data } = await axios.post<TokenRefreshResponse>(
    `${BASE_URL}/api/auth/refresh`,
    { refreshToken: token }
  );
  useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken);
  return data;
}
