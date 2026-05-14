'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../services/user-service');
jest.mock('../middlewares/authenticate', () => (req, res, next) => {
  req.user = { userId: 'uid-1', email: 'test@test.com' };
  next();
});

const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/user-routes');
const errorHandler = require('../middlewares/error-handler');
const userService = require('../services/user-service');
const AppError = require('../utils/app-error');

// ----------------------------------------------------------------
// 테스트용 미니 앱
// ----------------------------------------------------------------
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

// ----------------------------------------------------------------
// GET /api/users/me
// ----------------------------------------------------------------
describe('GET /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('200과 { user } 를 반환하며 user에 password_hash가 없다', async () => {
    userService.getMe.mockResolvedValue({
      id: 'uid-1',
      email: 'test@test.com',
      name: '홍길동',
    });

    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ id: 'uid-1', email: 'test@test.com', name: '홍길동' });
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('서비스가 AppError(404, USER_NOT_FOUND)를 던지면 404와 error.code = USER_NOT_FOUND를 반환한다', async () => {
    userService.getMe.mockRejectedValue(
      new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.')
    );

    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

// ----------------------------------------------------------------
// PATCH /api/users/me
// ----------------------------------------------------------------
describe('PATCH /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('name 변경 요청 시 200과 { user }를 반환한다', async () => {
    userService.updateMe.mockResolvedValue({
      id: 'uid-1',
      name: '새이름',
      email: 'test@test.com',
    });

    const res = await request(app).patch('/api/users/me').send({ name: '새이름' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ id: 'uid-1', name: '새이름' });
  });

  test('비밀번호 불일치 시 401과 error.code = WRONG_PASSWORD를 반환한다', async () => {
    userService.updateMe.mockRejectedValue(
      new AppError(401, 'WRONG_PASSWORD', '현재 비밀번호가 올바르지 않습니다.')
    );

    const res = await request(app)
      .patch('/api/users/me')
      .send({ password: 'new-pw', currentPassword: 'wrong-pw' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: 'WRONG_PASSWORD' });
  });

  test('currentPassword 없이 password만 보내면 400과 error.code = VALIDATION_ERROR를 반환한다', async () => {
    userService.updateMe.mockRejectedValue(
      new AppError(400, 'VALIDATION_ERROR', '현재 비밀번호를 입력해주세요.')
    );

    const res = await request(app).patch('/api/users/me').send({ password: 'new-pw' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('userService.updateMe가 req.user.userId와 req.body를 인자로 호출된다', async () => {
    userService.updateMe.mockResolvedValue({
      id: 'uid-1',
      name: '새이름',
      email: 'test@test.com',
    });

    await request(app).patch('/api/users/me').send({ name: '새이름' });

    expect(userService.updateMe).toHaveBeenCalledWith('uid-1', { name: '새이름' });
  });
});

// ----------------------------------------------------------------
// DELETE /api/users/me
// ----------------------------------------------------------------
describe('DELETE /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('정상 삭제 시 204와 빈 body를 반환한다', async () => {
    userService.deleteMe.mockResolvedValue();

    const res = await request(app).delete('/api/users/me');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  test('서비스 오류 시 500을 반환한다', async () => {
    userService.deleteMe.mockRejectedValue(new Error('Unexpected DB failure'));

    const res = await request(app).delete('/api/users/me');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });

  test('userService.deleteMe가 req.user.userId를 인자로 호출된다', async () => {
    userService.deleteMe.mockResolvedValue();

    await request(app).delete('/api/users/me');

    expect(userService.deleteMe).toHaveBeenCalledWith('uid-1');
  });
});
