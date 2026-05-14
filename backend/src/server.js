'use strict';

const { PORT } = require('./config/env');
const { pool } = require('./config/db');
const app = require('./app');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] 데이터베이스 연결 확인 완료');
  } catch (err) {
    console.error(`[DB] 데이터베이스 연결 실패: ${err.message}`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[Server] http://localhost:${PORT} 에서 실행 중`);
  });
}

start();
