import httpClient from '@/shared/api/http-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenRefreshResponse,
  UpdateMeRequest,
  DeleteMeRequest,
  User,
} from '@/features/auth/types/auth-types';

export const login = (data: LoginRequest): Promise<LoginResponse> =>
  httpClient.post<LoginResponse>('/api/auth/login', data).then((res) => res.data);

export const register = (data: RegisterRequest): Promise<RegisterResponse> =>
  httpClient.post<RegisterResponse>('/api/auth/register', data).then((res) => res.data);

export const logout = (token: string): Promise<void> =>
  httpClient.post('/api/auth/logout', { refreshToken: token }).then(() => undefined);

export const refreshToken = (token: string): Promise<TokenRefreshResponse> =>
  httpClient.post<TokenRefreshResponse>('/api/auth/refresh', { refreshToken: token }).then((res) => res.data);

export const getMe = (): Promise<User> =>
  httpClient.get<User>('/api/users/me').then((res) => res.data);

export const updateMe = (data: UpdateMeRequest): Promise<User> =>
  httpClient.patch<User>('/api/users/me', data).then((res) => res.data);

export const deleteMe = (data: DeleteMeRequest): Promise<void> =>
  httpClient.delete('/api/users/me', { data }).then(() => undefined);
