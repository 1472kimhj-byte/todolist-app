'use strict';

require('dotenv').config();

const request = require('supertest');
const app = require('../app');
const { truncateAllTables, closePool } = require('./setup');

describe('카테고리 API 통합 테스트', () => {
  let accessToken;
  let userId;

  beforeEach(async () => {
    await truncateAllTables();

    // 테스트용 사용자 생성 및 로그인
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'Test1234!', name: '테스터' });
    
    accessToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await closePool();
  });

  // ----------------------------------------------------------------
  // GET /api/categories
  // ----------------------------------------------------------------
  describe('GET /api/categories', () => {
    test('기본 카테고리 포함 목록을 반환한다', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.categories).toBeDefined();
      // 업무, 개인, 쇼핑 3개 기본 카테고리가 있어야 함
      const defaultNames = res.body.categories
        .filter(c => c.is_default)
        .map(c => c.name);
      expect(defaultNames).toContain('업무');
      expect(defaultNames).toContain('개인');
      expect(defaultNames).toContain('쇼핑');
    });

    test('타인의 카테고리는 노출되지 않는다', async () => {
      // 다른 사용자 생성
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'other@test.com', password: 'Test1234!', name: '다른유저' });
      
      // 다른 사용자로 로그인하여 카테고리 생성
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@test.com', password: 'Test1234!' });
      const otherToken = loginRes.body.accessToken;

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: '다른사람 카테고리' });

      // 원래 사용자로 조회
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);

      const names = res.body.categories.map(c => c.name);
      expect(names).not.toContain('다른사람 카테고리');
    });

    test('인증 없이 접근 시 401을 반환한다', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------------
  // POST /api/categories
  // ----------------------------------------------------------------
  describe('POST /api/categories', () => {
    test('정상적으로 카테고리를 생성한다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '새 카테고리' });

      expect(res.status).toBe(201);
      expect(res.body.category.name).toBe('새 카테고리');
      expect(res.body.category.user_id).toBe(userId);
      expect(res.body.category.is_default).toBe(false);
    });

    test('중복된 이름의 카테고리 생성이 가능하다 (사용자별 격리)', async () => {
      // '새 카테고리' 이미 생성됨
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '중복가능' });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '중복가능' });

      expect(res.status).toBe(201);
    });
  });

  // ----------------------------------------------------------------
  // PATCH /api/categories/:id
  // ----------------------------------------------------------------
  describe('PATCH /api/categories/:id', () => {
    test('정상적으로 카테고리명을 수정한다', async () => {
      const createRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '수정 전' });
      const categoryId = createRes.body.category.id;

      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '수정 후' });

      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe('수정 후');
    });

    test('기본 카테고리 수정 시도 시 403을 반환한다 (BR-04)', async () => {
      const listRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);
      const defaultId = listRes.body.categories.find(c => c.is_default).id;

      const res = await request(app)
        .patch(`/api/categories/${defaultId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '수정시도' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CANNOT_MODIFY_DEFAULT');
    });

    test('타인의 카테고리 수정 시도 시 404를 반환한다', async () => {
      // 다른 사용자의 카테고리 생성
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'other2@test.com', password: 'Test1234!', name: '다른유저2' });
      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other2@test.com', password: 'Test1234!' });
      const otherToken = otherLogin.body.accessToken;

      const otherCatRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: '타인 카테고리' });
      const otherCatId = otherCatRes.body.category.id;

      // 원래 사용자로 수정 시도
      const res = await request(app)
        .patch(`/api/categories/${otherCatId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '탈취시도' });

      expect(res.status).toBe(404);
    });
  });

  // ----------------------------------------------------------------
  // DELETE /api/categories/:id
  // ----------------------------------------------------------------
  describe('DELETE /api/categories/:id', () => {
    test('정상적으로 카테고리를 삭제한다', async () => {
      const createRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '삭제할 것' });
      const categoryId = createRes.body.category.id;

      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });

    test('기본 카테고리 삭제 시도 시 403을 반환한다 (BR-04)', async () => {
      const listRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);
      const defaultId = listRes.body.categories.find(c => c.is_default).id;

      const res = await request(app)
        .delete(`/api/categories/${defaultId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CANNOT_MODIFY_DEFAULT');
    });

    test('카테고리 삭제 후 소속 todos가 기본 카테고리로 이동한다 (BR-06)', async () => {
      // 1. 카테고리 생성
      const catRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '삭제될 카테고리' });
      const categoryId = catRes.body.category.id;

      // 2. 해당 카테고리에 할일 생성
      const todoRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '이동될 할일', category_id: categoryId });
      const todoId = todoRes.body.todo.id;

      // 3. 기본 카테고리 ID 확인
      const listRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);
      const defaultCategory = listRes.body.categories.find(c => c.is_default && c.name === '업무');
      const defaultId = defaultCategory.id;

      // 4. 카테고리 삭제
      await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // 5. 할일의 category_id가 기본 카테고리 ID로 변경되었는지 확인
      const checkRes = await request(app)
        .get(`/api/todos`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      const movedTodo = checkRes.body.todos.find(t => t.id === todoId);
      expect(movedTodo.category_id).toBe(defaultId);
    });
  });
});
