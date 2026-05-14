'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../services/category-service');
jest.mock('../middlewares/authenticate', () => (req, res, next) => {
  req.user = { userId: 'uid-1', email: 'test@test.com' };
  next();
});

const request = require('supertest');
const express = require('express');
const categoryRoutes = require('../routes/category-routes');
const errorHandler = require('../middlewares/error-handler');
const categoryService = require('../services/category-service');
const AppError = require('../utils/app-error');

// ----------------------------------------------------------------
// 테스트용 미니 앱
// ----------------------------------------------------------------
const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);
app.use(errorHandler);

// ----------------------------------------------------------------
// 공통 픽스처
// ----------------------------------------------------------------
const mockDefaultCategory = { id: 'def-1', name: '업무',       is_default: true,  user_id: null    };
const mockUserCategory    = { id: 'cat-1', name: '내 카테고리', is_default: false, user_id: 'uid-1' };

beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------------
// GET /api/categories
// ----------------------------------------------------------------
describe('GET /api/categories', () => {
  test('200과 { categories: [...] }를 반환한다', async () => {
    categoryService.getCategories.mockResolvedValue([mockDefaultCategory, mockUserCategory]);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(res.body.categories).toHaveLength(2);
    expect(res.body.categories[0]).toMatchObject({ id: 'def-1', is_default: true });
    expect(res.body.categories[1]).toMatchObject({ id: 'cat-1', is_default: false });
  });

  test('카테고리가 없을 때 200과 { categories: [] }를 반환한다', async () => {
    categoryService.getCategories.mockResolvedValue([]);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ categories: [] });
  });
});

// ----------------------------------------------------------------
// POST /api/categories
// ----------------------------------------------------------------
describe('POST /api/categories', () => {
  test('name이 있으면 201과 { category }를 반환한다', async () => {
    categoryService.createCategory.mockResolvedValue(mockUserCategory);

    const res = await request(app)
      .post('/api/categories')
      .send({ name: '내 카테고리' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('category');
    expect(res.body.category).toMatchObject({ id: 'cat-1', name: '내 카테고리' });
    expect(categoryService.createCategory).toHaveBeenCalledTimes(1);
  });

  test('name이 없으면 400 VALIDATION_ERROR를 반환하고 서비스를 호출하지 않는다', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(categoryService.createCategory).not.toHaveBeenCalled();
  });

  test('name이 빈 문자열이면 400 VALIDATION_ERROR를 반환하고 서비스를 호출하지 않는다', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(categoryService.createCategory).not.toHaveBeenCalled();
  });

  test('서비스 오류 시 500 INTERNAL_SERVER_ERROR를 반환한다', async () => {
    categoryService.createCategory.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/categories')
      .send({ name: '내 카테고리' });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});

// ----------------------------------------------------------------
// PATCH /api/categories/:id
// ----------------------------------------------------------------
describe('PATCH /api/categories/:id', () => {
  test('200과 { category }를 반환한다', async () => {
    const updated = { ...mockUserCategory, name: '수정됨' };
    categoryService.updateCategory.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/categories/cat-1')
      .send({ name: '수정됨' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('category');
    expect(res.body.category).toMatchObject({ id: 'cat-1', name: '수정됨' });
  });

  test('카테고리가 없으면 404 NOT_FOUND를 반환한다', async () => {
    categoryService.updateCategory.mockRejectedValue(
      new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.')
    );

    const res = await request(app)
      .patch('/api/categories/cat-999')
      .send({ name: '수정됨' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });

  test('기본 카테고리 수정 시도 시 403 CANNOT_MODIFY_DEFAULT를 반환한다', async () => {
    categoryService.updateCategory.mockRejectedValue(
      new AppError(403, 'CANNOT_MODIFY_DEFAULT', '기본 카테고리는 수정할 수 없습니다.')
    );

    const res = await request(app)
      .patch('/api/categories/def-1')
      .send({ name: '수정됨' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatchObject({ code: 'CANNOT_MODIFY_DEFAULT' });
  });
});

// ----------------------------------------------------------------
// DELETE /api/categories/:id
// ----------------------------------------------------------------
describe('DELETE /api/categories/:id', () => {
  test('204와 빈 body를 반환한다', async () => {
    categoryService.deleteCategory.mockResolvedValue();

    const res = await request(app).delete('/api/categories/cat-1');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  test('카테고리가 없으면 404 NOT_FOUND를 반환한다', async () => {
    categoryService.deleteCategory.mockRejectedValue(
      new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.')
    );

    const res = await request(app).delete('/api/categories/cat-999');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });

  test('기본 카테고리 삭제 시도 시 403 CANNOT_MODIFY_DEFAULT를 반환한다', async () => {
    categoryService.deleteCategory.mockRejectedValue(
      new AppError(403, 'CANNOT_MODIFY_DEFAULT', '기본 카테고리는 삭제할 수 없습니다.')
    );

    const res = await request(app).delete('/api/categories/def-1');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatchObject({ code: 'CANNOT_MODIFY_DEFAULT' });
  });
});
