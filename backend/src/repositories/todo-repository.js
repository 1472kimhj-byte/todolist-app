'use strict';

const { query } = require('../config/db');

async function findAllByUserId(userId, filters = {}) {
  const params = [userId];
  const conditions = ['user_id = $1'];
  let idx = 2;

  if (filters.category_id !== undefined) {
    conditions.push(`category_id = $${idx++}`);
    params.push(filters.category_id);
  }

  if (filters.is_completed !== undefined) {
    conditions.push(`is_completed = $${idx++}`);
    // query string에서 오면 string이므로 boolean 변환
    params.push(filters.is_completed === 'true' || filters.is_completed === true);
  }

  // BR-11: 기간 필터 적용 시 due_date IS NOT NULL인 할일만 포함
  if (filters.due_date_from !== undefined || filters.due_date_to !== undefined) {
    conditions.push('due_date IS NOT NULL');
  }

  if (filters.due_date_from !== undefined) {
    conditions.push(`due_date >= $${idx++}`);
    params.push(filters.due_date_from);
  }

  if (filters.due_date_to !== undefined) {
    conditions.push(`due_date <= $${idx++}`);
    params.push(filters.due_date_to);
  }

  const sql = `SELECT * FROM todos WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

async function findByIdAndUserId(id, userId) {
  const result = await query(
    'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] || null;
}

async function create(userId, dto) {
  const result = await query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, dto.category_id, dto.title, dto.description || null, dto.due_date || null]
  );
  return result.rows[0];
}

async function updateByIdAndUserId(id, userId, dto) {
  const fields = {};
  if (dto.title !== undefined)       fields.title = dto.title;
  if (dto.description !== undefined) fields.description = dto.description;
  if (dto.due_date !== undefined)    fields.due_date = dto.due_date;
  if (dto.category_id !== undefined) fields.category_id = dto.category_id;

  if (Object.keys(fields).length === 0) {
    return findByIdAndUserId(id, userId);
  }

  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

  const result = await query(
    `UPDATE todos SET ${setClause}, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...values]
  );
  return result.rows[0] || null;
}

async function toggleComplete(id, userId) {
  const result = await query(
    `UPDATE todos SET is_completed = NOT is_completed, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return result.rows[0] || null;
}

async function deleteByIdAndUserId(id, userId) {
  await query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, userId]);
}

module.exports = {
  findAllByUserId,
  findByIdAndUserId,
  create,
  updateByIdAndUserId,
  toggleComplete,
  deleteByIdAndUserId,
};
