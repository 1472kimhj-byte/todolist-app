'use strict';

require('dotenv').config();

const request = require('supertest');
const app = require('../app');
const { truncateAuthTables, closePool } = require('./setup');

// 테스트용 사용자 데이터
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
  name: '테스터',
};

describe('인증 API 통합 테스트', () => {
  beforeEach(async () => {
    await truncateAuthTables();
  });

  afterAll(async () => {
    await closePool();
  });

  // helper: 회원가입 후 토큰 반환
  async function registerAndGetTokens(userData = TEST_USER) {
    const res = await request(app).post('/api/auth/register').send(userData);
    return { accessToken: res.body.accessToken, refreshToken: res.body.refreshToken };
  }

  // ----------------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    test('성공(201): 유효한 데이터로 등록 시 201과 accessToken, refreshToken, user를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', TEST_USER.email);
      expect(res.body.user).toHaveProperty('name', TEST_USER.name);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.refreshToken.length).toBeGreaterThan(0);
    });

    test('중복 이메일(409): 같은 이메일로 두 번 등록 시 409와 code: EMAIL_ALREADY_EXISTS를 반환한다', async () => {
      // 첫 번째 등록 성공
      await request(app).post('/api/auth/register').send(TEST_USER);

      // 동일 이메일로 두 번째 등록 시도
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'EMAIL_ALREADY_EXISTS');
      expect(res.body.error).toHaveProperty('message');
    });

    test('필수 필드 누락(400): 빈 바디 전송 시 400과 code: VALIDATION_ERROR를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('필수 필드 누락(400): name 필드 누락 시 400과 code: VALIDATION_ERROR를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('응답에 password_hash 미포함: user 객체에 password_hash 필드가 없어야 한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(201);
      expect(res.body.user).not.toHaveProperty('password_hash');
    });
  });

  // ----------------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    test('성공(200): 등록 후 올바른 자격증명으로 로그인 시 200과 accessToken, refreshToken을 반환한다', async () => {
      // 사전 등록
      await request(app).post('/api/auth/register').send(TEST_USER);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.refreshToken.length).toBeGreaterThan(0);
    });

    test('잘못된 비밀번호(401): 틀린 비밀번호로 로그인 시 401과 code: INVALID_CREDENTIALS를 반환한다', async () => {
      // 사전 등록
      await request(app).post('/api/auth/register').send(TEST_USER);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    test('없는 이메일(401): 미가입 이메일로 로그인 시 401과 code: INVALID_CREDENTIALS를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: TEST_USER.password });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  // ----------------------------------------------------------------
  // POST /api/auth/logout
  // ----------------------------------------------------------------
  describe('POST /api/auth/logout', () => {
    test('성공(200): 로그인 후 유효한 refreshToken으로 로그아웃 시 200을 반환한다', async () => {
      const { refreshToken } = await registerAndGetTokens();

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
    });

    test('로그아웃 후 refresh 시도(401): 무효화된 refreshToken으로 refresh 요청 시 401과 code: INVALID_REFRESH_TOKEN을 반환한다', async () => {
      const { refreshToken } = await registerAndGetTokens();

      // 로그아웃으로 토큰 무효화
      await request(app).post('/api/auth/logout').send({ refreshToken });

      // 무효화된 토큰으로 refresh 시도
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });

    test('필수 필드 누락(400): refreshToken 없이 로그아웃 요청 시 400과 code: VALIDATION_ERROR를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  // ----------------------------------------------------------------
  // POST /api/auth/refresh
  // ----------------------------------------------------------------
  describe('POST /api/auth/refresh', () => {
    test('성공(200): 유효한 refreshToken으로 refresh 시 200과 새 accessToken, refreshToken을 반환한다', async () => {
      const { refreshToken } = await registerAndGetTokens();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.refreshToken.length).toBeGreaterThan(0);
    });

    test('토큰 rotation 확인: 재발급 후 이전 refreshToken으로 다시 refresh 시 401을 반환한다', async () => {
      const { refreshToken: originalRefreshToken } = await registerAndGetTokens();

      // JWT iat는 초 단위이므로 register와 refresh가 같은 초에 발생하면
      // 동일한 토큰이 발급될 수 있다. 1초 대기로 새 iat를 보장한다.
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 첫 번째 refresh — 새 토큰 발급 및 기존 토큰 무효화
      const firstRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken });

      expect(firstRefreshRes.status).toBe(200);

      // 기존(무효화된) refreshToken으로 재시도
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });

    test('재발급된 토큰으로 연속 refresh 가능: 새 refreshToken으로 다시 refresh 시 200을 반환한다', async () => {
      const { refreshToken: firstRefreshToken } = await registerAndGetTokens();

      // 첫 번째 refresh
      const firstRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: firstRefreshToken });

      expect(firstRefreshRes.status).toBe(200);
      const newRefreshToken = firstRefreshRes.body.refreshToken;

      // 새 refreshToken으로 두 번째 refresh
      const secondRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: newRefreshToken });

      expect(secondRefreshRes.status).toBe(200);
      expect(secondRefreshRes.body).toHaveProperty('accessToken');
      expect(secondRefreshRes.body).toHaveProperty('refreshToken');
    });

    test('유효하지 않은 토큰(401): 임의 문자열로 refresh 시 401과 code: INVALID_REFRESH_TOKEN을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'this-is-totally-invalid-token-string' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });

    test('필수 필드 누락(400): 빈 바디로 refresh 요청 시 400과 code: VALIDATION_ERROR를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
