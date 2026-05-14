'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

jest.mock('../repositories/todo-repository');
jest.mock('../repositories/category-repository');

const todoRepo     = require('../repositories/todo-repository');
const categoryRepo = require('../repositories/category-repository');
const AppError     = require('../utils/app-error');
const todoService  = require('../services/todo-service');

// ----------------------------------------------------------------
// 공통 픽스처
// ----------------------------------------------------------------
const mockTodo = {
  id: 'todo-1',
  user_id: 'uid-1',
  category_id: 'cat-1',
  title: '테스트 할일',
  description: null,
  due_date: null,
  is_completed: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockDefaultCategory = { id: 'def-1', name: '업무', is_default: true, user_id: null };

// ----------------------------------------------------------------
// todoService.getTodos
// ----------------------------------------------------------------
describe('todoService.getTodos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todoRepo.findAllByUserId.mockResolvedValue([mockTodo]);
  });

  test('todoRepo.findAllByUserId를 호출하고 할일 배열을 반환한다', async () => {
    const result = await todoService.getTodos('uid-1', {});

    expect(todoRepo.findAllByUserId).toHaveBeenCalledTimes(1);
    expect(todoRepo.findAllByUserId).toHaveBeenCalledWith('uid-1', {});
    expect(result).toEqual([mockTodo]);
  });

  test('필터 { category_id: "cat-1" } 전달 시 todoRepo에 그대로 전달한다', async () => {
    const filters = { category_id: 'cat-1' };

    await todoService.getTodos('uid-1', filters);

    expect(todoRepo.findAllByUserId).toHaveBeenCalledWith('uid-1', filters);
  });
});

// ----------------------------------------------------------------
// todoService.createTodo
// ----------------------------------------------------------------
describe('todoService.createTodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todoRepo.create.mockResolvedValue(mockTodo);
    categoryRepo.findFirstDefault.mockResolvedValue(mockDefaultCategory);
  });

  test('dto.category_id가 있으면 findFirstDefault를 호출하지 않고 해당 category_id로 create한다', async () => {
    const dto = { title: '테스트 할일', category_id: 'cat-1' };

    const result = await todoService.createTodo('uid-1', dto);

    expect(categoryRepo.findFirstDefault).not.toHaveBeenCalled();
    expect(todoRepo.create).toHaveBeenCalledTimes(1);
    expect(todoRepo.create).toHaveBeenCalledWith('uid-1', expect.objectContaining({ category_id: 'cat-1' }));
    expect(result).toEqual(mockTodo);
  });

  test('dto.category_id가 없으면 findFirstDefault를 호출하고 기본 카테고리 id를 category_id로 설정한다', async () => {
    const dto = { title: '테스트 할일' };

    const result = await todoService.createTodo('uid-1', dto);

    expect(categoryRepo.findFirstDefault).toHaveBeenCalledTimes(1);
    expect(todoRepo.create).toHaveBeenCalledWith('uid-1', expect.objectContaining({ category_id: 'def-1' }));
    expect(result).toEqual(mockTodo);
  });

  test('findFirstDefault가 null을 반환하면 AppError(500, INTERNAL_SERVER_ERROR)를 던진다', async () => {
    categoryRepo.findFirstDefault.mockResolvedValue(null);
    const dto = { title: '테스트 할일' };

    await expect(todoService.createTodo('uid-1', dto)).rejects.toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(todoRepo.create).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// todoService.updateTodo
// ----------------------------------------------------------------
describe('todoService.updateTodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todoRepo.findByIdAndUserId.mockResolvedValue(mockTodo);
    todoRepo.updateByIdAndUserId.mockResolvedValue({ ...mockTodo, title: '수정됨' });
  });

  test('성공: findByIdAndUserId로 할일을 찾고 updateByIdAndUserId를 호출한 뒤 결과를 반환한다', async () => {
    const dto = { title: '수정됨' };

    const result = await todoService.updateTodo('uid-1', 'todo-1', dto);

    expect(todoRepo.findByIdAndUserId).toHaveBeenCalledWith('todo-1', 'uid-1');
    expect(todoRepo.updateByIdAndUserId).toHaveBeenCalledWith('todo-1', 'uid-1', dto);
    expect(result).toMatchObject({ title: '수정됨' });
  });

  test('할일을 찾지 못하면 AppError(404, NOT_FOUND)를 던진다', async () => {
    todoRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(todoService.updateTodo('uid-1', 'todo-999', { title: '수정됨' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });

    expect(todoRepo.updateByIdAndUserId).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// todoService.toggleTodo
// ----------------------------------------------------------------
describe('todoService.toggleTodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todoRepo.findByIdAndUserId.mockResolvedValue(mockTodo);
    todoRepo.toggleComplete.mockResolvedValue({ ...mockTodo, is_completed: true });
  });

  test('성공: toggleComplete를 호출하고 is_completed가 반전된 결과를 반환한다', async () => {
    const result = await todoService.toggleTodo('uid-1', 'todo-1');

    expect(todoRepo.findByIdAndUserId).toHaveBeenCalledWith('todo-1', 'uid-1');
    expect(todoRepo.toggleComplete).toHaveBeenCalledWith('todo-1', 'uid-1');
    expect(result).toMatchObject({ is_completed: true });
  });

  test('할일을 찾지 못하면 AppError(404, NOT_FOUND)를 던진다', async () => {
    todoRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(todoService.toggleTodo('uid-1', 'todo-999')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });

    expect(todoRepo.toggleComplete).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// todoService.deleteTodo
// ----------------------------------------------------------------
describe('todoService.deleteTodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todoRepo.findByIdAndUserId.mockResolvedValue(mockTodo);
    todoRepo.deleteByIdAndUserId.mockResolvedValue();
  });

  test('성공: findByIdAndUserId로 할일을 찾고 deleteByIdAndUserId를 호출한다', async () => {
    await todoService.deleteTodo('uid-1', 'todo-1');

    expect(todoRepo.findByIdAndUserId).toHaveBeenCalledWith('todo-1', 'uid-1');
    expect(todoRepo.deleteByIdAndUserId).toHaveBeenCalledWith('todo-1', 'uid-1');
  });

  test('할일을 찾지 못하면 AppError(404, NOT_FOUND)를 던진다', async () => {
    todoRepo.findByIdAndUserId.mockResolvedValue(null);

    await expect(todoService.deleteTodo('uid-1', 'todo-999')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });

    expect(todoRepo.deleteByIdAndUserId).not.toHaveBeenCalled();
  });
});
