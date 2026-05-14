'use strict';

const { query } = require('../config/db');

// 기본 카테고리 + 사용자 카테고리 모두 반환
async function findAllByUserId(userId) {
  const result = await query(
    `SELECT * FROM categories
     WHERE is_default = true OR user_id = $1
     ORDER BY is_default DESC, created_at ASC`,
    [userId]
  );
  return result.rows;
}

// id 기준으로 기본 카테고리이거나 해당 사용자 카테고리인 경우 반환
// (삭제/수정 전 is_default 여부 확인을 위해 기본 카테고리도 조회 가능해야 함)
async function findByIdAndUserId(id, userId) {
  const result = await query(
    `SELECT * FROM categories
     WHERE id = $1 AND (user_id IS NULL OR user_id = $2)`,
    [id, userId]
  );
  return result.rows[0] || null;
}

async function create(userId, dto) {
  const result = await query(
    `INSERT INTO categories (name, is_default, user_id) VALUES ($1, false, $2) RETURNING *`,
    [dto.name, userId]
  );
  return result.rows[0];
}

async function updateByIdAndUserId(id, userId, dto) {
  const result = await query(
    `UPDATE categories SET name = $3 WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, dto.name]
  );
  return result.rows[0] || null;
}

async function deleteByIdAndUserId(id, userId) {
  await query(
    `DELETE FROM categories WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}

// 첫 번째 기본 카테고리 조회 (카테고리 삭제 시 todos 이동 대상)
async function findFirstDefault() {
  const result = await query(
    `SELECT * FROM categories WHERE is_default = true ORDER BY created_at ASC LIMIT 1`
  );
  return result.rows[0] || null;
}

// 트랜잭션 클라이언트를 받아 todos의 category_id를 변경
async function reassignTodos(fromCategoryId, toCategoryId, pgClient) {
  await pgClient.query(
    `UPDATE todos SET category_id = $2 WHERE category_id = $1`,
    [fromCategoryId, toCategoryId]
  );
}

module.exports = {
  findAllByUserId,
  findByIdAndUserId,
  create,
  updateByIdAndUserId,
  deleteByIdAndUserId,
  findFirstDefault,
  reassignTodos,
};
