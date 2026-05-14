'use strict';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../services/auth-service');

const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth-routes');
const errorHandler = require('../middlewares/error-handler');
const authService = require('../services/auth-service');
const AppError = require('../utils/app-error');

// ----------------------------------------------------------------
// 테스트용 미니 앱
// ----------------------------------------------------------------
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// ----------------------------------------------------------------
// 공통 픽스처
// ----------------------------------------------------------------
const MOCK_AUTH_RESULT = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: { id: '1', email: 'a@a.com', name: '홍' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------------
// POST /api/auth/register
// ----------------------------------------------------------------
describe('POST /api/auth/register', () => {
  test('정상 등록 시 201과 accessToken, refreshToken, user를 반환한다', async () => {
    authService.register.mockResolvedValue(MOCK_AUTH_RESULT);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@a.com', password: 'pw123', name: '홍' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken', 'mock-access-token');
    expect(res.body).toHaveProperty('refreshToken', 'mock-refresh-token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ id: '1', email: 'a@a.com' });
  });

  test('중복 이메일 등록 시 409와 error.code = EMAIL_ALREADY_EXISTS를 반환한다', async () => {
    authService.register.mockRejectedValue(
      new AppError(409, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.')
    );

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@a.com', password: 'pw123', name: '홍' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });
  });

  test('name 필드 누락 시 400과 error.code = VALIDATION_ERROR를 반환하며 서비스를 호출하지 않는다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@a.com', password: 'pw123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(authService.register).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------
describe('POST /api/auth/login', () => {
  test('정상 로그인 시 200과 accessToken, refreshToken, user를 반환한다', async () => {
    authService.login.mockResolvedValue(MOCK_AUTH_RESULT);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.com', password: 'pw123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken', 'mock-access-token');
    expect(res.body).toHaveProperty('refreshToken', 'mock-refresh-token');
    expect(res.body).toHaveProperty('user');
  });

  test('잘못된 자격증명으로 로그인 시 401과 error.code = INVALID_CREDENTIALS를 반환한다', async () => {
    authService.login.mockRejectedValue(
      new AppError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  test('password 필드 누락 시 400과 error.code = VALIDATION_ERROR를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(authService.login).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// POST /api/auth/logout
// ----------------------------------------------------------------
describe('POST /api/auth/logout', () => {
  test('정상 로그아웃 시 200과 message를 반환한다', async () => {
    authService.logout.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'some-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('refreshToken 없이 요청 시 400과 error.code = VALIDATION_ERROR를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(authService.logout).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// POST /api/auth/refresh
// ----------------------------------------------------------------
describe('POST /api/auth/refresh', () => {
  test('유효한 refresh token으로 요청 시 200과 accessToken, refreshToken을 반환한다', async () => {
    authService.refreshTokens.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken', 'new-access-token');
    expect(res.body).toHaveProperty('refreshToken', 'new-refresh-token');
  });

  test('유효하지 않은 토큰으로 요청 시 401과 error.code = INVALID_REFRESH_TOKEN을 반환한다', async () => {
    authService.refreshTokens.mockRejectedValue(
      new AppError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않거나 만료된 리프레시 토큰입니다.')
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });

  test('refreshToken 없이 요청 시 400과 error.code = VALIDATION_ERROR를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(authService.refreshTokens).not.toHaveBeenCalled();
  });
});
