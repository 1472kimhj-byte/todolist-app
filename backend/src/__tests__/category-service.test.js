'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../repositories/category-repository');
jest.mock('../config/db');

const categoryRepo = require('../repositories/category-repository');
const db = require('../config/db');
const AppError = require('../utils/app-error');
const categoryService = require('../services/category-service');

// ----------------------------------------------------------------
// 공통 픽스처
// ----------------------------------------------------------------
const mockDefaultCategory = { id: 'def-1', name: '업무', is_default: true,  user_id: null    };
const mockUserCategory    = { id: 'cat-1', name: '내 카테고리', is_default: false, user_id: 'uid-1' };

// ----------------------------------------------------------------
// categoryService.getCategories
// ----------------------------------------------------------------
describe('categoryService.getCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findAllByUserId를 호출하고 기본 + 사용자 카테고리 배열을 반환한다', async () => {
    const expected = [mockDefaultCategory, mockUserCategory];
    categoryRepo.findAllByUserId.mockResolvedValue(expected);

    const result = await categoryService.getCategories('uid-1');

    expect(categoryRepo.findAllByUserId).toHaveBeenCalledTimes(1);
    expect(categoryRepo.findAllByUserId).toHaveBeenCalledWith('uid-1');
    expect(result).toEqual(expected);
  });
});

// ----------------------------------------------------------------
// categoryService.createCategory
// ----------------------------------------------------------------
describe('categoryService.createCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('categoryRepo.create를 호출하고 생성된 카테고리를 반환한다', async () => {
    categoryRepo.create.mockResolvedValue(mockUserCategory);

    const dto = { name: '내 카테고리' };
    const result = await categoryService.createCategory('uid-1', dto);

    expect(categoryRepo.create).toHaveBeenCalledTimes(1);
    expect(categoryRepo.create).toHaveBeenCalledWith('uid-1', dto);
    expect(result).toEqual(mockUserCategory);
  });
});

// ----------------------------------------------------------------
// categoryService.updateCategory
// ----------------------------------------------------------------
describe('categoryService.updateCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    categoryRepo.findByIdAndUserId.mockResolvedValue(mockUserCategory);
    categoryRepo.updateByIdAndUserId.mockResolvedValue({ ...mockUserCategory, name: '수정됨' });
  });

  test('성공: findByIdAndUserId로 사용자 카테고리 조회 후 updateByIdAndUserId 결과를 반환한다', async () => {
    const dto = { name: '수정됨' };
    const result = await categoryService.updateCategory('uid-1', 'cat-1', dto);

    expect(categoryRepo.findByIdAndUserId).toHaveBeenCalledWith('cat-1', 'uid-1');
    expect(categoryRepo.updateByIdAndUserId).toHaveBeenCalledWith('cat-1', 'uid-1', dto);
    expect(result).toMatchObject({ id: 'cat-1', name: '수정됨' });
  });

  test('카테고리를 찾지 못하면 AppError(404, NOT_FOUND)를 던진다', async () => {
    categoryRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      categoryService.updateCategory('uid-1', 'cat-1', { name: '수정됨' })
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });

    expect(categoryRepo.updateByIdAndUserId).not.toHaveBeenCalled();
  });

  test('기본 카테고리 수정 시도 시 AppError(403, CANNOT_MODIFY_DEFAULT)를 던진다', async () => {
    categoryRepo.findByIdAndUserId.mockResolvedValue(mockDefaultCategory);

    await expect(
      categoryService.updateCategory('uid-1', 'def-1', { name: '수정됨' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'CANNOT_MODIFY_DEFAULT' });

    expect(categoryRepo.updateByIdAndUserId).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// categoryService.deleteCategory
// ----------------------------------------------------------------
describe('categoryService.deleteCategory', () => {
  const mockClient = { query: jest.fn(), release: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    categoryRepo.findByIdAndUserId.mockResolvedValue(mockUserCategory);
    categoryRepo.findFirstDefault.mockResolvedValue(mockDefaultCategory);
    categoryRepo.reassignTodos.mockResolvedValue();
    db.getClient.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({});
  });

  test('성공: BEGIN → reassignTodos → DELETE → COMMIT 순으로 실행되고 client.release가 호출된다', async () => {
    await categoryService.deleteCategory('uid-1', 'cat-1');

    // BEGIN, DELETE, COMMIT 순서 검증
    const queryCalls = mockClient.query.mock.calls;
    expect(queryCalls[0][0]).toBe('BEGIN');
    expect(queryCalls[1][0]).toMatch(/DELETE FROM categories/);
    expect(queryCalls[2][0]).toBe('COMMIT');

    // reassignTodos 호출 검증
    expect(categoryRepo.reassignTodos).toHaveBeenCalledTimes(1);
    expect(categoryRepo.reassignTodos).toHaveBeenCalledWith('cat-1', 'def-1', mockClient);

    // release 호출 검증
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  test('카테고리를 찾지 못하면 AppError(404, NOT_FOUND)를 던진다', async () => {
    categoryRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      categoryService.deleteCategory('uid-1', 'cat-1')
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });

    expect(db.getClient).not.toHaveBeenCalled();
  });

  test('기본 카테고리 삭제 시도 시 AppError(403, CANNOT_MODIFY_DEFAULT)를 던진다', async () => {
    categoryRepo.findByIdAndUserId.mockResolvedValue(mockDefaultCategory);

    await expect(
      categoryService.deleteCategory('uid-1', 'def-1')
    ).rejects.toMatchObject({ statusCode: 403, code: 'CANNOT_MODIFY_DEFAULT' });

    expect(db.getClient).not.toHaveBeenCalled();
  });

  test('DB 오류 시 ROLLBACK을 호출하고 client.release를 호출한 뒤 에러를 재throw한다', async () => {
    const dbError = new Error('DB connection lost');
    // BEGIN은 성공, 이후 쿼리에서 오류 발생 시뮬레이션
    mockClient.query
      .mockResolvedValueOnce({})           // BEGIN
      .mockRejectedValueOnce(dbError);     // DELETE → 오류

    // reassignTodos도 정상이지만 DELETE에서 오류 발생
    categoryRepo.reassignTodos.mockResolvedValue();

    await expect(
      categoryService.deleteCategory('uid-1', 'cat-1')
    ).rejects.toThrow('DB connection lost');

    // ROLLBACK 호출 여부 확인
    const queryCalls = mockClient.query.mock.calls.map((c) => c[0]);
    expect(queryCalls).toContain('ROLLBACK');

    // release 호출 여부 확인 (finally 블록)
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  test('성공 시 client.release가 호출된다', async () => {
    await categoryService.deleteCategory('uid-1', 'cat-1');

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
