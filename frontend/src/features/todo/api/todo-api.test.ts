import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import httpClient from '@/shared/api/http-client';
import { getTodos, createTodo, updateTodo, toggleTodo, deleteTodo } from './todo-api';

const mock = new MockAdapter(httpClient);

const mockTodo = {
  id: 'todo-1',
  user_id: 'user-1',
  category_id: 'cat-1',
  title: '장보기',
  description: '우유, 계란',
  is_completed: false,
  due_date: '2026-05-20',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

describe('todo-api', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('getTodos()', () => {
    it('할일 목록을 배열로 반환한다', async () => {
      mock.onGet('/api/todos').reply(200, { todos: [mockTodo] });

      const result = await getTodos();
      expect(result).toEqual([mockTodo]);
    });

    it('filterParams를 query string으로 전달한다', async () => {
      mock.onGet('/api/todos').reply(200, { todos: [] });

      await getTodos({ category_id: 'cat-1', is_completed: false });
      expect(mock.history['get'][0].params).toMatchObject({
        category_id: 'cat-1',
        is_completed: false,
      });
    });

    it('빈 목록도 정상 반환한다', async () => {
      mock.onGet('/api/todos').reply(200, { todos: [] });

      const result = await getTodos();
      expect(result).toEqual([]);
    });
  });

  describe('createTodo()', () => {
    it('생성된 할일을 반환한다', async () => {
      mock.onPost('/api/todos').reply(201, { todo: mockTodo });

      const result = await createTodo({ title: '장보기' });
      expect(result).toEqual(mockTodo);
    });

    it('요청 body에 title이 포함된다', async () => {
      mock.onPost('/api/todos').reply(201, { todo: mockTodo });

      await createTodo({ title: '장보기', description: '우유', due_date: '2026-05-20' });
      const body = JSON.parse(mock.history['post'][0].data as string) as Record<string, unknown>;
      expect(body).toMatchObject({ title: '장보기', description: '우유' });
    });
  });

  describe('updateTodo()', () => {
    it('수정된 할일을 반환한다', async () => {
      const updated = { ...mockTodo, title: '수정된 제목' };
      mock.onPatch('/api/todos/todo-1').reply(200, { todo: updated });

      const result = await updateTodo('todo-1', { title: '수정된 제목' });
      expect(result).toEqual(updated);
    });

    it('올바른 엔드포인트로 요청한다', async () => {
      mock.onPatch('/api/todos/todo-1').reply(200, { todo: mockTodo });

      await updateTodo('todo-1', { title: '수정' });
      expect(mock.history['patch'][0].url).toBe('/api/todos/todo-1');
    });
  });

  describe('toggleTodo()', () => {
    it('토글된 할일을 반환한다', async () => {
      const toggled = { ...mockTodo, is_completed: true };
      mock.onPatch('/api/todos/todo-1/toggle').reply(200, { todo: toggled });

      const result = await toggleTodo('todo-1');
      expect(result.is_completed).toBe(true);
    });

    it('/toggle 엔드포인트로 요청한다', async () => {
      mock.onPatch('/api/todos/todo-1/toggle').reply(200, { todo: mockTodo });

      await toggleTodo('todo-1');
      expect(mock.history['patch'][0].url).toBe('/api/todos/todo-1/toggle');
    });
  });

  describe('deleteTodo()', () => {
    it('삭제 성공 시 undefined를 반환한다', async () => {
      mock.onDelete('/api/todos/todo-1').reply(204);

      await expect(deleteTodo('todo-1')).resolves.toBeUndefined();
    });

    it('올바른 엔드포인트로 요청한다', async () => {
      mock.onDelete('/api/todos/todo-1').reply(204);

      await deleteTodo('todo-1');
      expect(mock.history['delete'][0].url).toBe('/api/todos/todo-1');
    });
  });
});
