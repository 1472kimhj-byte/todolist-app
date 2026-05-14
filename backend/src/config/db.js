'use strict';

const { Pool } = require('pg');

const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
} = process.env;

let connectionString;
if (DATABASE_URL) {
  connectionString = DATABASE_URL;
} else if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
  connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT || 5432}/${DB_NAME}`;
} else {
  console.error('[DB] 오류: DATABASE_URL 또는 DB_HOST/DB_NAME/DB_USER/DB_PASSWORD 환경변수가 필요합니다.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] 예기치 않은 풀 오류:', err.message);
});

async function query(sql, params) {
  return pool.query(sql, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
