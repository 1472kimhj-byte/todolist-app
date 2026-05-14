'use strict';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../repositories/user-repository');
jest.mock('../repositories/refresh-token-repository');
jest.mock('../utils/hash-utils');
jest.mock('../utils/jwt-utils');

const userRepo = require('../repositories/user-repository');
const refreshTokenRepo = require('../repositories/refresh-token-repository');
const { hashPassword, comparePassword } = require('../utils/hash-utils');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt-utils');
const AppError = require('../utils/app-error');
const authService = require('../services/auth-service');

// ----------------------------------------------------------------
// 공통 픽스처
// ----------------------------------------------------------------
const MOCK_USER = {
  id: 'uid-1',
  email: 'test@test.com',
  name: '홍길동',
  password_hash: 'hashed',
  created_at: new Date('2024-01-01T00:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
  signAccessToken.mockReturnValue('mock-access-token');
  signRefreshToken.mockReturnValue('mock-refresh-token');
  refreshTokenRepo.save.mockResolvedValue({});
  refreshTokenRepo.revokeByToken.mockResolvedValue();
});

// ----------------------------------------------------------------
// authService.register
// ----------------------------------------------------------------
describe('authService.register', () => {
  test('새 이메일로 가입 성공 시 accessToken, refreshToken, user를 반환한다', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed-pw');
    userRepo.create.mockResolvedValue({ ...MOCK_USER, password_hash: 'hashed-pw' });

    const result = await authService.register({
      email: 'test@test.com',
      password: 'plain-pw',
      name: '홍길동',
    });

    expect(result).toHaveProperty('accessToken', 'mock-access-token');
    expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    expect(result.user).toMatchObject({ id: 'uid-1', email: 'test@test.com' });
  });

  test('중복 이메일 가입 시 AppError(409, EMAIL_ALREADY_EXISTS)를 던진다', async () => {
    userRepo.findByEmail.mockResolvedValue({ id: 'uid-1', email: 'test@test.com' });

    await expect(
      authService.register({ email: 'test@test.com', password: 'pw', name: '홍길동' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
  });

  test('register 성공 시 refreshTokenRepo.save가 호출된다', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed-pw');
    userRepo.create.mockResolvedValue({ ...MOCK_USER, password_hash: 'hashed-pw' });

    await authService.register({ email: 'test@test.com', password: 'pw', name: '홍길동' });

    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.save).toHaveBeenCalledWith(
      'uid-1',
      'mock-refresh-token',
      expect.any(Date)
    );
  });

  test('register 성공 시 응답 user에 password_hash 필드가 포함되지 않는다', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed-pw');
    userRepo.create.mockResolvedValue({ ...MOCK_USER, password_hash: 'hashed-pw' });

    const result = await authService.register({ email: 'test@test.com', password: 'pw', name: '홍길동' });

    expect(result.user).not.toHaveProperty('password_hash');
  });
});

// ----------------------------------------------------------------
// authService.login
// ----------------------------------------------------------------
describe('authService.login', () => {
  test('올바른 자격증명으로 로그인 성공 시 accessToken, refreshToken, user를 반환한다', async () => {
    userRepo.findByEmail.mockResolvedValue(MOCK_USER);
    comparePassword.mockResolvedValue(true);

    const result = await authService.login({ email: 'test@test.com', password: 'plain-pw' });

    expect(result).toHaveProperty('accessToken', 'mock-access-token');
    expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    expect(result.user).toMatchObject({ id: 'uid-1', email: 'test@test.com', name: '홍길동' });
  });

  test('존재하지 않는 이메일로 로그인 시 AppError(401, INVALID_CREDENTIALS)를 던진다', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'none@test.com', password: 'pw' })
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('잘못된 비밀번호로 로그인 시 AppError(401, INVALID_CREDENTIALS)를 던진다', async () => {
    userRepo.findByEmail.mockResolvedValue(MOCK_USER);
    comparePassword.mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@test.com', password: 'wrong-pw' })
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('로그인 성공 시 refreshTokenRepo.save가 호출된다', async () => {
    userRepo.findByEmail.mockResolvedValue(MOCK_USER);
    comparePassword.mockResolvedValue(true);

    await authService.login({ email: 'test@test.com', password: 'plain-pw' });

    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.save).toHaveBeenCalledWith(
      'uid-1',
      'mock-refresh-token',
      expect.any(Date)
    );
  });
});

// ----------------------------------------------------------------
// authService.logout
// ----------------------------------------------------------------
describe('authService.logout', () => {
  test("logout('some-refresh-token') 호출 시 refreshTokenRepo.revokeByToken이 해당 토큰으로 호출된다", async () => {
    await authService.logout('some-refresh-token');

    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith('some-refresh-token');
  });
});

// ----------------------------------------------------------------
// authService.refreshTokens
// ----------------------------------------------------------------
describe('authService.refreshTokens', () => {
  test('유효한 refresh token으로 새 토큰 쌍을 반환하고 기존 토큰을 폐기한다', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      user_id: 'uid-1',
      revoked: false,
    });
    verifyRefreshToken.mockReturnValue({ userId: 'uid-1', email: 'test@test.com' });

    signAccessToken.mockReturnValue('new-access-token');
    signRefreshToken.mockReturnValue('new-refresh-token');
    refreshTokenRepo.save.mockResolvedValue({});

    const result = await authService.refreshTokens('old-refresh-token');

    // 기존 토큰 폐기 확인
    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith('old-refresh-token');
    // 새 토큰 저장 확인
    expect(refreshTokenRepo.save).toHaveBeenCalledWith(
      'uid-1',
      'new-refresh-token',
      expect.any(Date)
    );
    // 반환값 확인
    expect(result).toHaveProperty('accessToken', 'new-access-token');
    expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
  });

  test('DB에 없는 토큰으로 갱신 시 AppError(401, INVALID_REFRESH_TOKEN)를 던진다', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(null);

    await expect(
      authService.refreshTokens('unknown-token')
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
  });

  test('verifyRefreshToken 실패 시 AppError(401, INVALID_REFRESH_TOKEN)를 던진다', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue({
      id: 'rt-1',
      user_id: 'uid-1',
      revoked: false,
    });
    verifyRefreshToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(
      authService.refreshTokens('expired-token')
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
  });
});
