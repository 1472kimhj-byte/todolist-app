'use strict';

/**
 * BE-02 공통 인프라 테스트
 *
 * 대상 모듈:
 *   - src/utils/app-error.js
 *   - src/utils/jwt-utils.js
 *   - src/utils/hash-utils.js
 *   - src/config/env.js
 *   - src/config/db.js
 */

// env.js 내부의 dotenv.config()가 실제 .env 파일을 읽지 않도록 mock한다.
// 이렇게 해야 isolateModules에서 process.env를 조작한 후 env.js를 require할 때
// dotenv가 .env 파일로 값을 덮어쓰는 것을 방지할 수 있다.
jest.mock('dotenv', () => ({ config: jest.fn() }));

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// ----------------------------------------------------------------
// 1. AppError
// ----------------------------------------------------------------
describe('AppError', () => {
  const AppError = require('../utils/app-error');

  test('Error 및 AppError 인스턴스다', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', '입력 오류');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof AppError).toBe(true);
  });

  test('statusCode, code, message가 올바르게 설정된다', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', '입력 오류');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('입력 오류');
  });

  test('statusCode 404로 생성할 수 있다', () => {
    const err = new AppError(404, 'NOT_FOUND', '리소스를 찾을 수 없습니다');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('리소스를 찾을 수 없습니다');
    expect(err instanceof Error).toBe(true);
  });

  test('statusCode 500으로 생성할 수 있다', () => {
    const err = new AppError(500, 'INTERNAL_ERROR', '서버 오류');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.message).toBe('서버 오류');
    expect(err instanceof Error).toBe(true);
  });

  test('name 속성이 AppError다', () => {
    const err = new AppError(400, 'BAD_REQUEST', '잘못된 요청');
    expect(err.name).toBe('AppError');
  });

  test('stack trace가 존재한다', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', '입력 오류');
    expect(err.stack).toBeDefined();
  });
});

// ----------------------------------------------------------------
// 2. JWT 유틸리티
// ----------------------------------------------------------------
describe('JWT 유틸리티', () => {
  // jwt-utils는 env.js를 상단에서 require하므로
  // 환경변수를 먼저 설정한 뒤 isolateModules로 로드한다.
  let jwtUtils;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET    = 'test-access-secret-key';
    process.env.JWT_REFRESH_SECRET   = 'test-refresh-secret-key';
    process.env.JWT_ACCESS_EXPIRES_IN  = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    jest.isolateModules(() => {
      jwtUtils = require('../utils/jwt-utils');
    });
  });

  afterAll(() => {
    jest.resetModules();
  });

  describe('signAccessToken / verifyAccessToken 라운드트립', () => {
    test('서명 후 검증 시 payload에 userId와 email이 포함된다', () => {
      const payload = { userId: 'abc', email: 'test@test.com' };
      const token   = jwtUtils.signAccessToken(payload);
      const decoded = jwtUtils.verifyAccessToken(token);
      expect(decoded.userId).toBe('abc');
      expect(decoded.email).toBe('test@test.com');
    });

    test('signAccessToken은 문자열 토큰을 반환한다', () => {
      const token = jwtUtils.signAccessToken({ userId: '1' });
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('signRefreshToken / verifyRefreshToken 라운드트립', () => {
    test('서명 후 검증 시 payload에 userId가 포함된다', () => {
      const payload = { userId: 'xyz', email: 'refresh@test.com' };
      const token   = jwtUtils.signRefreshToken(payload);
      const decoded = jwtUtils.verifyRefreshToken(token);
      expect(decoded.userId).toBe('xyz');
      expect(decoded.email).toBe('refresh@test.com');
    });

    test('signRefreshToken은 문자열 토큰을 반환한다', () => {
      const token = jwtUtils.signRefreshToken({ userId: '2' });
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('만료/변조 토큰 검증', () => {
    test('만료된 Access Token 검증 시 오류를 throw한다', () => {
      const expiredToken = jwt.sign(
        { userId: 'abc' },
        'test-access-secret-key',
        { expiresIn: '0s' }
      );
      expect(() => jwtUtils.verifyAccessToken(expiredToken)).toThrow();
    });

    test('잘못된 서명의 Access Token 검증 시 오류를 throw한다', () => {
      const wrongToken = jwt.sign(
        { userId: 'abc' },
        'completely-wrong-secret'
      );
      expect(() => jwtUtils.verifyAccessToken(wrongToken)).toThrow();
    });

    test('잘못된 서명의 Refresh Token 검증 시 오류를 throw한다', () => {
      const wrongToken = jwt.sign(
        { userId: 'abc' },
        'completely-wrong-secret'
      );
      expect(() => jwtUtils.verifyRefreshToken(wrongToken)).toThrow();
    });

    test('임의의 문자열을 Access Token으로 검증 시 오류를 throw한다', () => {
      expect(() => jwtUtils.verifyAccessToken('not.a.valid.token')).toThrow();
    });
  });
});

// ----------------------------------------------------------------
// 3. 비밀번호 해시 유틸리티
// ----------------------------------------------------------------
describe('비밀번호 해시 유틸리티', () => {
  const { hashPassword, comparePassword } = require('../utils/hash-utils');

  test('hashPassword 결과가 truthy다', async () => {
    const hash = await hashPassword('mypassword123');
    expect(hash).toBeTruthy();
  });

  test('hashPassword 결과가 원본 비밀번호와 다르다', async () => {
    const hash = await hashPassword('mypassword123');
    expect(hash).not.toBe('mypassword123');
  });

  test('같은 평문으로 두 번 해시하면 서로 다른 값이 나온다 (salt)', async () => {
    const hash1 = await hashPassword('mypassword123');
    const hash2 = await hashPassword('mypassword123');
    expect(hash1).not.toBe(hash2);
  });

  test('comparePassword: 올바른 비밀번호는 true를 반환한다', async () => {
    const hash   = await hashPassword('mypassword123');
    const result = await comparePassword('mypassword123', hash);
    expect(result).toBe(true);
  });

  test('comparePassword: 잘못된 비밀번호는 false를 반환한다', async () => {
    const hash   = await hashPassword('mypassword123');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  test('bcrypt salt rounds가 10 이상이다', async () => {
    const hash   = await hashPassword('mypassword123');
    const rounds = bcrypt.getRounds(hash);
    expect(rounds).toBeGreaterThanOrEqual(10);
  });
});

// ----------------------------------------------------------------
// 4. env.js 환경변수 검증
// ----------------------------------------------------------------
describe('env.js 환경변수 검증', () => {
  let originalEnv;
  let mockExit;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    mockExit.mockRestore();
    jest.resetModules();
  });

  test('JWT_ACCESS_SECRET 누락 시 process.exit(1)이 호출된다', () => {
    delete process.env.JWT_ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = 'test-secret';
    jest.isolateModules(() => {
      require('../config/env');
    });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('JWT_REFRESH_SECRET 누락 시 process.exit(1)이 호출된다', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access';
    delete process.env.JWT_REFRESH_SECRET;
    jest.isolateModules(() => {
      require('../config/env');
    });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('두 시크릿 모두 누락 시 process.exit(1)이 호출된다', () => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    jest.isolateModules(() => {
      require('../config/env');
    });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('필수 환경변수가 모두 있으면 PORT를 정수로 export한다', () => {
    process.env.JWT_ACCESS_SECRET  = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    process.env.PORT               = '4000';
    let env;
    jest.isolateModules(() => {
      env = require('../config/env');
    });
    expect(mockExit).not.toHaveBeenCalled();
    expect(env.PORT).toBe(4000);
  });

  test('PORT가 없으면 기본값 3000을 export한다', () => {
    process.env.JWT_ACCESS_SECRET  = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    delete process.env.PORT;
    let env;
    jest.isolateModules(() => {
      env = require('../config/env');
    });
    expect(mockExit).not.toHaveBeenCalled();
    expect(env.PORT).toBe(3000);
  });

  test('JWT_ACCESS_EXPIRES_IN 기본값이 1h다', () => {
    process.env.JWT_ACCESS_SECRET  = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    let env;
    jest.isolateModules(() => {
      env = require('../config/env');
    });
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('1h');
  });

  test('JWT_REFRESH_EXPIRES_IN 기본값이 7d다', () => {
    process.env.JWT_ACCESS_SECRET  = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    delete process.env.JWT_REFRESH_EXPIRES_IN;
    let env;
    jest.isolateModules(() => {
      env = require('../config/env');
    });
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
  });

  test('NODE_ENV 기본값이 development다', () => {
    process.env.JWT_ACCESS_SECRET  = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    delete process.env.NODE_ENV;
    let env;
    jest.isolateModules(() => {
      env = require('../config/env');
    });
    expect(env.NODE_ENV).toBe('development');
  });
});

// ----------------------------------------------------------------
// 5. DB 연결 설정
// ----------------------------------------------------------------
describe('DB 연결 설정', () => {
  let mockExit;

  beforeEach(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.resetModules();
  });

  afterEach(() => {
    mockExit.mockRestore();
    jest.resetModules();
  });

  test('DATABASE_URL이 있으면 pool, query, getClient를 export한다', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    const db = require('../config/db');
    expect(db.pool).toBeDefined();
    expect(typeof db.query).toBe('function');
    expect(typeof db.getClient).toBe('function');
  });

  test('개별 DB 환경변수로도 pool, query, getClient를 export한다', () => {
    delete process.env.DATABASE_URL;
    process.env.DB_HOST     = 'localhost';
    process.env.DB_PORT     = '5432';
    process.env.DB_NAME     = 'testdb';
    process.env.DB_USER     = 'testuser';
    process.env.DB_PASSWORD = 'testpass';

    jest.resetModules();
    const db = require('../config/db');
    expect(db.pool).toBeDefined();
    expect(typeof db.query).toBe('function');
    expect(typeof db.getClient).toBe('function');
  });

  test('DB 접속 정보가 없으면 process.exit(1)이 호출된다', () => {
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;

    jest.resetModules();
    require('../config/db');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('query는 async 함수다', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    jest.resetModules();
    const db = require('../config/db');
    // async 함수는 constructor 이름이 AsyncFunction이다
    expect(db.query.constructor.name).toBe('AsyncFunction');
  });

  test('getClient는 async 함수다', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    jest.resetModules();
    const db = require('../config/db');
    expect(db.getClient.constructor.name).toBe('AsyncFunction');
  });
});
