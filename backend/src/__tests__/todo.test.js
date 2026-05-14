'use strict';

require('dotenv').config();

const request = require('supertest');
const app = require('../app');
const { truncateAllTables, closePool } = require('./setup');

describe('할일 API 통합 테스트', () => {
  let accessToken;
  let userId;
  let defaultCategoryId;

  beforeEach(async () => {
    await truncateAllTables();

    // 1. 사용자 생성 및 로그인
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'Test1234!', name: '테스터' });
    
    accessToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;

    // 2. 기본 카테고리 ID 확보
    const catRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    defaultCategoryId = catRes.body.categories.find(c => c.is_default && c.name === '업무').id;
  });

  afterAll(async () => {
    await closePool();
  });

  // ----------------------------------------------------------------
  // POST /api/todos
  // ----------------------------------------------------------------
  describe('POST /api/todos', () => {
    test('정상적으로 할일을 생성한다', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '할일 제목',
          description: '설명입니다',
          category_id: defaultCategoryId,
          due_date: '2026-12-31'
        });

      expect(res.status).toBe(201);
      expect(res.body.todo.title).toBe('할일 제목');
      expect(res.body.todo.user_id).toBe(userId);
      expect(res.body.todo.category_id).toBe(defaultCategoryId);
    });

    test('카테고리 미지정 시 기본 카테고리로 생성된다 (UC-07)', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '카테고리 없는 할일' });

      expect(res.status).toBe(201);
      expect(res.body.todo.category_id).toBeDefined();
      // 기본 카테고리 중 하나여야 함
      const catRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);
      const defaultIds = catRes.body.categories.filter(c => c.is_default).map(c => c.id);
      expect(defaultIds).toContain(res.body.todo.category_id);
    });
  });

  // ----------------------------------------------------------------
  // GET /api/todos
  // ----------------------------------------------------------------
  describe('GET /api/todos', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      await request(app).post('/api/todos').set('Authorization', `Bearer ${accessToken}`).send({ title: '할일 1', due_date: '2026-05-01' });
      const res2 = await request(app).post('/api/todos').set('Authorization', `Bearer ${accessToken}`).send({ title: '할일 2', due_date: '2026-05-15' });
      await request(app).post('/api/todos').set('Authorization', `Bearer ${accessToken}`).send({ title: '할일 3', due_date: '2026-06-01' });

      // 할일 2를 완료 상태로 변경
      const todo2Id = res2.body.todo.id;
      await request(app).patch(`/api/todos/${todo2Id}/toggle`).set('Authorization', `Bearer ${accessToken}`);
    });

    test('전체 목록을 조회한다', async () => {
      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.todos).toHaveLength(3);
    });

    test('데이터 격리: 타인의 할일은 조회되지 않는다 (BR-02)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'other@test.com', password: 'Test1234!', name: '다른유저' });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@test.com', password: 'Test1234!' });
      const otherToken = loginRes.body.accessToken;

      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: '다른사람 할일' });

      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`);

      const titles = res.body.todos.map(t => t.title);
      expect(titles).not.toContain('다른사람 할일');
    });

    test('완료 여부 필터가 동작한다 (BR-10)', async () => {
      const res = await request(app)
        .get('/api/todos')
        .query({ is_completed: 'true' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.body.todos).toHaveLength(1);
      expect(res.body.todos[0].title).toBe('할일 2');
    });

    test('기간 필터가 동작한다 (BR-11)', async () => {
      const res = await request(app)
        .get('/api/todos')
        .query({ due_date_from: '2026-05-10', due_date_to: '2026-05-20' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.body.todos).toHaveLength(1);
      expect(res.body.todos[0].title).toBe('할일 2');
    });
  });

  // ----------------------------------------------------------------
  // PATCH /api/todos/:id
  // ----------------------------------------------------------------
  describe('PATCH /api/todos/:id', () => {
    test('정상적으로 할일을 수정한다', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '수정 전' });
      const todoId = createRes.body.todo.id;

      const res = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '수정 후' });

      expect(res.status).toBe(200);
      expect(res.body.todo.title).toBe('수정 후');
    });

    test('타인의 할일 수정 시도 시 404를 반환한다', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'other2@test.com', password: 'Test1234!', name: '다른유저2' });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other2@test.com', password: 'Test1234!' });
      const otherToken = loginRes.body.accessToken;

      const otherTodoRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: '타인 할일' });
      const otherTodoId = otherTodoRes.body.todo.id;

      const res = await request(app)
        .patch(`/api/todos/${otherTodoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '탈취시도' });

      expect(res.status).toBe(404);
    });
  });

  // ----------------------------------------------------------------
  // PATCH /api/todos/:id/toggle
  // ----------------------------------------------------------------
  describe('PATCH /api/todos/:id/toggle', () => {
    test('완료 상태를 반전시킨다 (BR-09)', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '토글 테스트', is_completed: false });
      const todoId = createRes.body.todo.id;

      // 1회 토글: false -> true
      const res1 = await request(app)
        .patch(`/api/todos/${todoId}/toggle`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res1.body.todo.is_completed).toBe(true);

      // 2회 토글: true -> false
      const res2 = await request(app)
        .patch(`/api/todos/${todoId}/toggle`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res2.body.todo.is_completed).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // DELETE /api/todos/:id
  // ----------------------------------------------------------------
  describe('DELETE /api/todos/:id', () => {
    test('정상적으로 할일을 삭제한다', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '삭제할 것' });
      const todoId = createRes.body.todo.id;

      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // 삭제 확인
      const listRes = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(listRes.body.todos.find(t => t.id === todoId)).toBeUndefined();
    });
  });
});
