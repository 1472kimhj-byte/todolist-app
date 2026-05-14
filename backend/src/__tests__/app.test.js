'use strict';

// ----------------------------------------------------------------
// 환경변수 설정 (DB/JWT import 시 process.exit 방지)
// ----------------------------------------------------------------
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const request = require('supertest');
const app = require('../app');

// ----------------------------------------------------------------
// 1. GET /health
// ----------------------------------------------------------------
describe('GET /health', () => {
  it('200 상태코드를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('{ status: "ok" } 응답 바디를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ----------------------------------------------------------------
// 2. 404 Not Found Handler
// ----------------------------------------------------------------
describe('404 Not Found Handler', () => {
  it('미등록 경로 /unknown-path → 404를 반환한다', async () => {
    const res = await request(app).get('/unknown-path');
    expect(res.status).toBe(404);
  });

  it('미등록 경로 응답이 { error: { code: "NOT_FOUND", message: ... } } 형식이다', async () => {
    const res = await request(app).get('/unknown-path');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('/api/unknown-endpoint → 404를 반환한다', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
  });

  it('/api/unknown-endpoint 응답이 { error: { code: "NOT_FOUND" } } 형식이다', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});

// ----------------------------------------------------------------
// 3. 인증 미들웨어 — 토큰 없이 보호된 라우트 접근
// ----------------------------------------------------------------
describe('인증 미들웨어 (토큰 없이 접근)', () => {
  it('GET /api/todos → 401을 반환한다', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });

  it('GET /api/todos → code가 UNAUTHORIZED이다', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('GET /api/categories → 401을 반환한다', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('GET /api/categories → code가 UNAUTHORIZED이다', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('GET /api/users/me → 401을 반환한다', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/users/me → code가 UNAUTHORIZED이다', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });
});

// ----------------------------------------------------------------
// 4. 유효성 검사 미들웨어 — auth 라우트, DB 접근 없이 400 반환
// ----------------------------------------------------------------
describe('유효성 검사 미들웨어 (auth 라우트)', () => {
  it('POST /api/auth/register with {} → 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register with {} → code가 VALIDATION_ERROR이다', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('POST /api/auth/login with {} → 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login with {} → code가 VALIDATION_ERROR이다', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });
});

// ----------------------------------------------------------------
// 5. 에러 응답 형식 — { error: { code, message } } 준수 확인
// ----------------------------------------------------------------
describe('에러 응답 형식', () => {
  it('404 응답이 error.code와 error.message를 모두 포함한다', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });

  it('401 응답이 error.code와 error.message를 모두 포함한다', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });

  it('401 응답의 code가 UNAUTHORIZED이다', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('400 응답의 code가 VALIDATION_ERROR이다', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ----------------------------------------------------------------
// 6. 헤더 검사 — helmet 적용 확인
// ----------------------------------------------------------------
describe('helmet 보안 헤더', () => {
  it('/health 응답에 x-content-type-options 헤더가 존재한다', async () => {
    const res = await request(app).get('/health');
    const hasContentTypeOptions = 'x-content-type-options' in res.headers;
    const hasDnsPrefetchControl = 'x-dns-prefetch-control' in res.headers;
    expect(hasContentTypeOptions || hasDnsPrefetchControl).toBe(true);
  });
});
