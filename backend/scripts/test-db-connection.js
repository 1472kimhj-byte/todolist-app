const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool, query } = require('../src/config/db');

async function testConnection() {
  try {
    const result = await query('SELECT now(), current_database(), current_user');
    const row = result.rows[0];
    console.log('[DB] 연결 성공');
    console.log(`  - 서버 시각: ${row.now}`);
    console.log(`  - 데이터베이스: ${row.current_database}`);
    console.log(`  - 유저: ${row.current_user}`);
  } catch (err) {
    console.error('[DB] 연결 실패:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
