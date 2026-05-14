'use strict';

const { query } = require('../config/db');

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function create({ email, passwordHash, name }) {
  const result = await query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
    [email, passwordHash, name]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateById(id, fields) {
  // fields: { name?, password_hash? }
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const result = await query(
    `UPDATE users SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
}

async function deleteById(id) {
  await query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { findByEmail, create, findById, updateById, deleteById };
