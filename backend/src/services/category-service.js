'use strict';

const { getClient } = require('../config/db');
const categoryRepo = require('../repositories/category-repository');
const AppError = require('../utils/app-error');

async function getCategories(userId) {
  return categoryRepo.findAllByUserId(userId);
}

async function createCategory(userId, dto) {
  const category = await categoryRepo.create(userId, dto);
  console.log(`[Category] 카테고리 생성 - categoryId: ${category.id}, userId: ${userId}`);
  return category;
}

async function updateCategory(userId, id, dto) {
  const category = await categoryRepo.findByIdAndUserId(id, userId);
  if (!category) {
    console.warn(`[Category] 수정 실패 - 카테고리 없음, categoryId: ${id}, userId: ${userId}`);
    throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.');
  }
  if (category.is_default) {
    console.warn(`[Category] 수정 실패 - 기본 카테고리 수정 시도, categoryId: ${id}, userId: ${userId}`);
    throw new AppError(403, 'CANNOT_MODIFY_DEFAULT', '기본 카테고리는 수정할 수 없습니다.');
  }

  const updated = await categoryRepo.updateByIdAndUserId(id, userId, dto);
  console.log(`[Category] 카테고리 수정 - categoryId: ${id}, userId: ${userId}`);
  return updated;
}

async function deleteCategory(userId, id) {
  const category = await categoryRepo.findByIdAndUserId(id, userId);
  if (!category) {
    console.warn(`[Category] 삭제 실패 - 카테고리 없음, categoryId: ${id}, userId: ${userId}`);
    throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.');
  }
  if (category.is_default) {
    console.warn(`[Category] 삭제 실패 - 기본 카테고리 삭제 시도, categoryId: ${id}, userId: ${userId}`);
    throw new AppError(403, 'CANNOT_MODIFY_DEFAULT', '기본 카테고리는 삭제할 수 없습니다.');
  }

  const defaultCategory = await categoryRepo.findFirstDefault();

  const client = await getClient();
  try {
    await client.query('BEGIN');
    if (defaultCategory) {
      await categoryRepo.reassignTodos(id, defaultCategory.id, client);
      console.log(`[Category] 할일 재배정 - from: ${id} -> to: ${defaultCategory.id}`);
    }
    await client.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    await client.query('COMMIT');
    console.log(`[Category] 카테고리 삭제 완료 - categoryId: ${id}, userId: ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Category] 카테고리 삭제 롤백 - categoryId: ${id}, 오류: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
