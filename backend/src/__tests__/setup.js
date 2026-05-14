'use strict';

const { pool } = require('../config/db');

async function truncateAuthTables() {
  await pool.query('TRUNCATE TABLE refresh_tokens, users CASCADE');
}

async function truncateAllTables() {
  // todos, categories, refresh_tokens, users 순서대로 초기화 (또는 CASCADE)
  await pool.query('TRUNCATE TABLE todos, categories, refresh_tokens, users CASCADE');
  
  // 기본 카테고리 재삽입 (schema.sql의 시드 데이터와 동일)
  await pool.query(`
    INSERT INTO categories (name, is_default, user_id) VALUES
      ('업무', true, NULL),
      ('개인', true, NULL),
      ('쇼핑', true, NULL)
    ON CONFLICT DO NOTHING;
  `);
}

async function closePool() {
  await pool.end();
}

module.exports = { truncateAuthTables, truncateAllTables, closePool };
