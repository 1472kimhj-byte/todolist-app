const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

if (process.env.NODE_ENV === 'production') {
  console.error('[DB Reset] 프로덕션 환경에서는 실행할 수 없습니다.');
  process.exit(1);
}

const { pool } = require('../src/config/db');

async function resetDb() {
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    console.log('[DB Reset] 테이블 초기화 중...');
    await pool.query(
      'DROP TABLE IF EXISTS refresh_tokens, todos, categories, users CASCADE;'
    );
    console.log('[DB Reset] 기존 테이블 삭제 완료');

    await pool.query(schemaSql);
    console.log('[DB Reset] 스키마 재생성 완료');
    console.log('[DB Reset] 완료: 테이블 4개 및 시드 데이터 초기화됨');
  } catch (err) {
    console.error('[DB Reset] 실패:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDb();
