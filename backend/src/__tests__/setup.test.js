'use strict';

/**
 * BE-01 초기화 검증 테스트
 *
 * 목적: BE-01 완료 조건을 자동화 테스트로 검증한다.
 *   1. 프로젝트 디렉토리 구조 존재 여부
 *   2. .env.example 필수 키 선언 여부
 *   3. GET /health 엔드포인트 응답 정상 여부
 */

const fs      = require('fs');
const path    = require('path');
const request = require('supertest');

// ----------------------------------------------------------------
// 경로 상수
// ----------------------------------------------------------------
const BACKEND_ROOT = path.resolve(__dirname, '../..');   // backend/
const SRC_ROOT     = path.resolve(__dirname, '..');      // backend/src/

// ----------------------------------------------------------------
// 1. 프로젝트 구조 검증
// ----------------------------------------------------------------
describe('프로젝트 구조', () => {
  const REQUIRED_DIRS = [
    'config',
    'routes',
    'controllers',
    'services',
    'repositories',
    'middlewares',
    'utils',
  ];

  test.each(REQUIRED_DIRS)(
    'src/%s 디렉토리가 존재한다',
    (dirName) => {
      const dirPath = path.join(SRC_ROOT, dirName);
      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    }
  );

  test('.env.example 파일이 존재한다', () => {
    const filePath = path.join(BACKEND_ROOT, '.env.example');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).isFile()).toBe(true);
  });

  describe('package.json 스크립트 검증', () => {
    let scripts;

    beforeAll(() => {
      const pkgPath = path.join(BACKEND_ROOT, 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      scripts = pkg.scripts || {};
    });

    test('dev 스크립트가 정의되어 있다', () => {
      expect(scripts).toHaveProperty('dev');
      expect(typeof scripts.dev).toBe('string');
      expect(scripts.dev.trim().length).toBeGreaterThan(0);
    });

    test('start 스크립트가 정의되어 있다', () => {
      expect(scripts).toHaveProperty('start');
      expect(typeof scripts.start).toBe('string');
      expect(scripts.start.trim().length).toBeGreaterThan(0);
    });

    test('test 스크립트가 정의되어 있다', () => {
      expect(scripts).toHaveProperty('test');
      expect(typeof scripts.test).toBe('string');
      expect(scripts.test.trim().length).toBeGreaterThan(0);
    });
  });

  describe('nodemon.json 설정 검증', () => {
    let nodemonConfig;

    beforeAll(() => {
      const nodemonPath = path.join(BACKEND_ROOT, 'nodemon.json');
      expect(fs.existsSync(nodemonPath)).toBe(true);
      nodemonConfig = JSON.parse(fs.readFileSync(nodemonPath, 'utf8'));
    });

    test('exec 필드가 "node src/server.js" 로 설정되어 있다', () => {
      expect(nodemonConfig).toHaveProperty('exec');
      expect(nodemonConfig.exec).toBe('node src/server.js');
    });
  });
});

// ----------------------------------------------------------------
// 2. .env.example 키 검증
// ----------------------------------------------------------------
describe('.env.example 키 검증', () => {
  let envKeys;

  beforeAll(() => {
    const envExamplePath = path.join(BACKEND_ROOT, '.env.example');

    if (!fs.existsSync(envExamplePath)) {
      envKeys = [];
      return;
    }

    const content = fs.readFileSync(envExamplePath, 'utf8');

    // 주석(#)과 빈 줄을 제외하고 KEY=VALUE 형식에서 KEY만 추출한다.
    envKeys = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split('=')[0].trim())
      .filter((key) => key.length > 0);
  });

  const DATABASE_KEYS = [
    'PORT',
    'DATABASE_URL',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const JWT_KEYS = [
    'JWT_ACCESS_SECRET',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
  ];

  const ENV_KEYS = ['NODE_ENV'];

  const ALL_REQUIRED_KEYS = [...DATABASE_KEYS, ...JWT_KEYS, ...ENV_KEYS];

  test.each(ALL_REQUIRED_KEYS)(
    '%s 키가 선언되어 있다',
    (key) => {
      expect(envKeys).toContain(key);
    }
  );
});

// ----------------------------------------------------------------
// 3. 서버 /health 엔드포인트 검증
// ----------------------------------------------------------------
describe('서버 /health 엔드포인트', () => {
  let app;
  let loadError;

  beforeAll(() => {
    // app.js 로드에 필요한 최소 환경변수 설정
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

    try {
      // BE-09부터 앱 로직은 app.js에서 export되므로 server.js 대신 app.js를 사용한다.
      app = require('../app');
    } catch (err) {
      loadError = err;
    }
  });

  test('app.js를 require 할 수 있다', () => {
    if (loadError) {
      throw new Error(
        `app.js require 실패 — 파일이 존재하고 문법 오류가 없는지 확인하세요.\n원인: ${loadError.message}`
      );
    }
    expect(app).toBeDefined();
  });

  test('GET /health 요청에 200을 응답한다', async () => {
    if (loadError || !app) {
      throw new Error(
        `app.js를 로드할 수 없어 /health 테스트를 건너뜁니다.\n원인: ${loadError ? loadError.message : 'app이 undefined'}`
      );
    }

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  test('GET /health 응답 body에 status 필드가 존재한다', async () => {
    if (loadError || !app) {
      throw new Error(
        `app.js를 로드할 수 없어 /health 응답 body 테스트를 건너뜁니다.\n원인: ${loadError ? loadError.message : 'app이 undefined'}`
      );
    }

    const response = await request(app).get('/health');
    expect(response.body).toHaveProperty('status');
  });
});
