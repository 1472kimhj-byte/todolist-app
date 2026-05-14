'use strict';

const todoRepo = require('../repositories/todo-repository');
const categoryRepo = require('../repositories/category-repository');
const AppError = require('../utils/app-error');

async function getTodos(userId, filters) {
  return todoRepo.findAllByUserId(userId, filters);
}

async function createTodo(userId, dto) {
  let categoryId = dto.category_id;

  // BR-07: category_id 미입력 시 기본 카테고리 자동 배정
  if (!categoryId) {
    const defaultCategory = await categoryRepo.findFirstDefault();
    if (!defaultCategory) {
      console.error(`[Todo] 기본 카테고리 없음 - userId: ${userId}`);
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', '기본 카테고리를 찾을 수 없습니다.');
    }
    categoryId = defaultCategory.id;
    console.log(`[Todo] 기본 카테고리 자동 배정 - categoryId: ${categoryId}`);
  }

  const todo = await todoRepo.create(userId, { ...dto, category_id: categoryId });
  console.log(`[Todo] 할일 생성 - todoId: ${todo.id}, userId: ${userId}`);
  return todo;
}

async function updateTodo(userId, id, dto) {
  const todo = await todoRepo.findByIdAndUserId(id, userId);
  if (!todo) {
    console.warn(`[Todo] 수정 실패 - 할일 없음, todoId: ${id}, userId: ${userId}`);
    throw new AppError(404, 'NOT_FOUND', '할일을 찾을 수 없습니다.');
  }

  const updated = await todoRepo.updateByIdAndUserId(id, userId, dto);
  console.log(`[Todo] 할일 수정 - todoId: ${id}, userId: ${userId}`);
  return updated;
}

async function toggleTodo(userId, id) {
  const todo = await todoRepo.findByIdAndUserId(id, userId);
  if (!todo) {
    console.warn(`[Todo] 토글 실패 - 할일 없음, todoId: ${id}, userId: ${userId}`);
    throw new AppError(404, 'NOT_FOUND', '할일을 찾을 수 없습니다.');
  }

  const result = await todoRepo.toggleComplete(id, userId);
  console.log(`[Todo] 완료 토글 - todoId: ${id}, completed: ${result.is_completed}`);
  return result;
}

async function deleteTodo(userId, id) {
  const todo = await todoRepo.findByIdAndUserId(id, userId);
  if (!todo) {
    console.warn(`[Todo] 삭제 실패 - 할일 없음, todoId: ${id}, userId: ${userId}`);
    throw new AppError(404, 'NOT_FOUND', '할일을 찾을 수 없습니다.');
  }

  await todoRepo.deleteByIdAndUserId(id, userId);
  console.log(`[Todo] 할일 삭제 - todoId: ${id}, userId: ${userId}`);
}

module.exports = { getTodos, createTodo, updateTodo, toggleTodo, deleteTodo };
