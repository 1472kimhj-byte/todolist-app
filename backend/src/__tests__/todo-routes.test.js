'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../services/todo-service');
jest.mock('../middlewares/authenticate', () => (req, res, next) => {
  req.user = { userId: 'uid-1', email: 'test@test.com' };
  next();
});

const request      = require('supertest');
const express      = require('express');
const todoRoutes   = require('../routes/todo-routes');
const errorHandler = require('../middlewares/error-handler');
const todoService  = require('../services/todo-service');
const AppError     = require('../utils/app-error');

// ----------------------------------------------------------------
// 테스트용 미니 앱
// ----------------------------------------------------------------
const app = express();
app.use(express.json());
app.use('/api/todos', todoRoutes);
app.use(errorHandler);

// ----------------------------------------------------------------
// 공통 픽스처
// ----------------------------------------------------------------
const mockTodo = { id: 'todo-1', title: '테스트 할일', is_completed: false };

beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------------
// GET /api/todos
// ----------------------------------------------------------------
describe('GET /api/todos', () => {
  test('200과 { todos: [mockTodo] }를 반환한다 (필터 없음)', async () => {
    todoService.getTodos.mockResolvedValue([mockTodo]);

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todos');
    expect(res.body.todos).toHaveLength(1);
    expect(res.body.todos[0]).toMatchObject({ id: 'todo-1', title: '테스트 할일' });
    expect(todoService.getTodos).toHaveBeenCalledTimes(1);
  });

  test('query string 필터를 서비스에 그대로 전달한다', async () => {
    todoService.getTodos.mockResolvedValue([mockTodo]);

    const res = await request(app)
      .get('/api/todos')
      .query({ category_id: 'cat-1', is_completed: 'false' });

    expect(res.status).toBe(200);
    expect(todoService.getTodos).toHaveBeenCalledWith(
      'uid-1',
      expect.objectContaining({ category_id: 'cat-1', is_completed: 'false' })
    );
  });

  test('할일이 없을 때 200과 { todos: [] }를 반환한다', async () => {
    todoService.getTodos.mockResolvedValue([]);

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ todos: [] });
  });
});

// ----------------------------------------------------------------
// POST /api/todos
// ----------------------------------------------------------------
describe('POST /api/todos', () => {
  test('title이 있으면 201과 { todo }를 반환한다', async () => {
    todoService.createTodo.mockResolvedValue(mockTodo);

    const res = await request(app)
      .post('/api/todos')
      .send({ title: '테스트 할일' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('todo');
    expect(res.body.todo).toMatchObject({ id: 'todo-1', title: '테스트 할일' });
    expect(todoService.createTodo).toHaveBeenCalledTimes(1);
  });

  test('title이 없으면 400 VALIDATION_ERROR를 반환하고 서비스를 호출하지 않는다', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });

  test('title이 빈 문자열이면 400 VALIDATION_ERROR를 반환하고 서비스를 호출하지 않는다', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });

  test('서비스 오류 시 500 INTERNAL_SERVER_ERROR를 반환한다', async () => {
    todoService.createTodo.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/todos')
      .send({ title: '테스트 할일' });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});

// ----------------------------------------------------------------
// PATCH /api/todos/:id/toggle
// ----------------------------------------------------------------
describe('PATCH /api/todos/:id/toggle', () => {
  test('200과 { todo }를 반환하고 is_completed가 반전된다', async () => {
    const toggled = { ...mockTodo, is_completed: true };
    todoService.toggleTodo.mockResolvedValue(toggled);

    const res = await request(app).patch('/api/todos/todo-1/toggle');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todo');
    expect(res.body.todo).toMatchObject({ id: 'todo-1', is_completed: true });
    expect(todoService.toggleTodo).toHaveBeenCalledWith('uid-1', 'todo-1');
  });

  test('할일을 찾지 못하면 404 NOT_FOUND를 반환한다', async () => {
    todoService.toggleTodo.mockRejectedValue(
      new AppError(404, 'NOT_FOUND', '할일을 찾을 수 없습니다.')
    );

    const res = await request(app).patch('/api/todos/todo-999/toggle');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ----------------------------------------------------------------
// PATCH /api/todos/:id
// ----------------------------------------------------------------
describe('PATCH /api/todos/:id', () => {
  test('200과 { todo }를 반환한다', async () => {
    const updated = { ...mockTodo, title: '수정됨' };
    todoService.updateTodo.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/todos/todo-1')
      .send({ title: '수정됨' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todo');
    expect(res.body.todo).toMatchObject({ id: 'todo-1', title: '수정됨' });
    expect(todoService.updateTodo).toHaveBeenCalledWith('uid-1', 'todo-1', expect.objectContaining({ title: '수정됨' }));
  });

  test('할일을 찾지 못하면 404 NOT_FOUND를 반환한다', async () => {
    todoService.updateTodo.mockRejectedValue(
      new AppError(404, 'NOT_FOUND', '할일을 찾을 수 없습니다.')
    );

    const res = await request(app)
      .patch('/api/todos/todo-999')
      .send({ title: '수정됨' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ----------------------------------------------------------------
// DELETE /api/todos/:id
// ----------------------------------------------------------------
describe('DELETE /api/todos/:id', () => {
  test('204와 빈 body를 반환한다', async () => {
    todoService.deleteTodo.mockResolvedValue();

    const res = await request(app).delete('/api/todos/todo-1');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(todoService.deleteTodo).toHaveBeenCalledWith('uid-1', 'todo-1');
  });

  test('할일을 찾지 못하면 404 NOT_FOUND를 반환한다', async () => {
    todoService.deleteTodo.mockRejectedValue(
      new AppError(404, 'NOT_FOUND', '할일을 찾을 수 없습니다.')
    );

    const res = await request(app).delete('/api/todos/todo-999');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });
});
