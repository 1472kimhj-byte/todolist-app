'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../repositories/user-repository');
jest.mock('../utils/hash-utils');
jest.mock('../config/db');

const userRepo = require('../repositories/user-repository');
const { hashPassword, comparePassword } = require('../utils/hash-utils');
const db = require('../config/db');
const AppError = require('../utils/app-error');
const userService = require('../services/user-service');

// ----------------------------------------------------------------
// userService.getMe
// ----------------------------------------------------------------
describe('userService.getMe', () => {
  const MOCK_USER = {
    id: 'uid-1',
    email: 'test@test.com',
    name: '홍길동',
    password_hash: 'hashed',
    created_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('userId로 findById를 호출하고 password_hash가 제외된 user를 반환한다', async () => {
    userRepo.findById.mockResolvedValue(MOCK_USER);

    const result = await userService.getMe('uid-1');

    expect(userRepo.findById).toHaveBeenCalledWith('uid-1');
    expect(result).toMatchObject({ id: 'uid-1', email: 'test@test.com', name: '홍길동' });
  });

  test('반환 객체에 password_hash 필드가 없다', async () => {
    userRepo.findById.mockResolvedValue(MOCK_USER);

    const result = await userService.getMe('uid-1');

    expect(result).not.toHaveProperty('password_hash');
  });

  test('findById가 null을 반환하면 AppError(404, USER_NOT_FOUND)를 던진다', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(userService.getMe('uid-1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });
});

// ----------------------------------------------------------------
// userService.updateMe
// ----------------------------------------------------------------
describe('userService.updateMe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userRepo.findById.mockResolvedValue({
      id: 'uid-1',
      email: 'test@test.com',
      name: '홍길동',
      password_hash: 'hashed-old',
    });
    userRepo.updateById.mockResolvedValue({
      id: 'uid-1',
      email: 'test@test.com',
      name: '새이름',
      password_hash: 'hashed-new',
    });
    comparePassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue('hashed-new');
  });

  test('dto.name만 있으면 name 필드로 updateById를 호출하고 password_hash 없는 user를 반환한다', async () => {
    const result = await userService.updateMe('uid-1', { name: '새이름' });

    expect(userRepo.updateById).toHaveBeenCalledWith('uid-1', { name: '새이름' });
    expect(result).toMatchObject({ id: 'uid-1', name: '새이름' });
    expect(result).not.toHaveProperty('password_hash');
  });

  test('dto.password와 dto.currentPassword가 있고 비밀번호 일치 시 hashPassword를 호출한 후 password_hash로 updateById를 호출한다', async () => {
    await userService.updateMe('uid-1', {
      password: 'new-password',
      currentPassword: 'old-password',
    });

    expect(comparePassword).toHaveBeenCalledWith('old-password', 'hashed-old');
    expect(hashPassword).toHaveBeenCalledWith('new-password');
    expect(userRepo.updateById).toHaveBeenCalledWith('uid-1', { password_hash: 'hashed-new' });
  });

  test('dto.password와 dto.currentPassword가 있고 비밀번호 불일치 시 AppError(401, WRONG_PASSWORD)를 던진다', async () => {
    comparePassword.mockResolvedValue(false);

    await expect(
      userService.updateMe('uid-1', { password: 'new-password', currentPassword: 'wrong-password' })
    ).rejects.toMatchObject({ statusCode: 401, code: 'WRONG_PASSWORD' });
  });

  test('dto.password만 있고 currentPassword가 없으면 AppError(400, VALIDATION_ERROR)를 던진다', async () => {
    await expect(
      userService.updateMe('uid-1', { password: 'new-password' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  test('dto가 빈 객체이면 updateById를 호출하지 않고 기존 user를 반환한다 (password_hash 없음)', async () => {
    const result = await userService.updateMe('uid-1', {});

    expect(userRepo.updateById).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'uid-1', email: 'test@test.com', name: '홍길동' });
    expect(result).not.toHaveProperty('password_hash');
  });

  test('findById가 null을 반환하면 AppError(404, USER_NOT_FOUND)를 던진다', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(userService.updateMe('uid-1', { name: '새이름' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  test('반환 user에 password_hash 필드가 없다', async () => {
    const result = await userService.updateMe('uid-1', { name: '새이름' });

    expect(result).not.toHaveProperty('password_hash');
  });
});

// ----------------------------------------------------------------
// userService.deleteMe
// ----------------------------------------------------------------
describe('userService.deleteMe', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    db.getClient.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({});
  });

  test('정상 실행 시 BEGIN, UPDATE refresh_tokens, DELETE FROM users, COMMIT 순으로 query를 호출한다', async () => {
    await userService.deleteMe('uid-1');

    const calls = mockClient.query.mock.calls;
    expect(calls[0][0]).toBe('BEGIN');
    expect(calls[1][0]).toBe('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1');
    expect(calls[1][1]).toEqual(['uid-1']);
    expect(calls[2][0]).toBe('DELETE FROM users WHERE id = $1');
    expect(calls[2][1]).toEqual(['uid-1']);
    expect(calls[3][0]).toBe('COMMIT');
  });

  test('DB 오류 발생 시 ROLLBACK을 호출하고 에러를 재throw한다', async () => {
    const dbError = new Error('DB connection lost');
    mockClient.query
      .mockResolvedValueOnce({})   // BEGIN
      .mockRejectedValueOnce(dbError); // UPDATE → throw

    await expect(userService.deleteMe('uid-1')).rejects.toThrow('DB connection lost');

    const rollbackCall = mockClient.query.mock.calls.find((c) => c[0] === 'ROLLBACK');
    expect(rollbackCall).toBeDefined();
  });

  test('DB 오류 발생 시 client.release()가 호출된다', async () => {
    const dbError = new Error('DB error');
    mockClient.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(dbError);

    await expect(userService.deleteMe('uid-1')).rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  test('정상 완료 후 client.release()가 호출된다', async () => {
    await userService.deleteMe('uid-1');

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
