# 실행 계획 — TodoListApp

**버전:** 1.0
**작성일:** 2026-05-13
**참조 문서:** `2-prd.md` v1.3, `4-project-principles.md` v1.0, `6-erd.md` v1.0

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-13 | kimhj | 최초 작성 |

---

## 전체 태스크 목록

| ID | 영역 | 태스크명 | 의존성 |
|----|------|----------|--------|
| DB-01 | DB | PostgreSQL 17 설치 및 DB/유저 생성 | 없음 |
| DB-02 | DB | schema.sql 실행 및 테이블 생성 검증 | DB-01 |
| DB-03 | DB | 시드 데이터 검증 (기본 카테고리 3개) | DB-02 |
| DB-04 | DB | pg Pool 설정 (config/db.ts) | DB-01 |
| DB-05 | DB | 개발 환경 DB 리셋 스크립트 | DB-02, DB-04 |
| BE-01 | BE | 프로젝트 초기화 | 없음 |
| BE-02 | BE | 공통 인프라 구성 | BE-01 |
| BE-03 | BE | 공통 미들웨어 구현 | BE-02 |
| BE-04 | BE | 도메인 타입 정의 | BE-01 |
| BE-05 | BE | 인증 도메인 구현 (UC-01~UC-02b) | BE-02, BE-03, BE-04, DB-02 |
| BE-06 | BE | 사용자 도메인 구현 (UC-03, UC-12) | BE-03, BE-04, BE-05 |
| BE-07 | BE | 카테고리 도메인 구현 (UC-04~UC-06) | BE-03, BE-04, BE-05, DB-02 |
| BE-08 | BE | 할일 도메인 구현 (UC-07~UC-11) | BE-03, BE-04, BE-05, BE-07, DB-02 |
| BE-09 | BE | 앱 통합 및 서버 진입점 구성 | BE-03, BE-05, BE-06, BE-07, BE-08 |
| BE-10 | BE | 인증 API 통합 테스트 | BE-09 |
| BE-11 | BE | 카테고리·할일 API 통합 테스트 | BE-10 |
| FE-01 | FE | 프로젝트 초기화 | 없음 |
| FE-02 | FE | 공통 인프라 구성 | FE-01, FE-03 |
| FE-03 | FE | 인증 스토어 및 타입 정의 | FE-01 |
| FE-04 | FE | 인증 API 클라이언트 및 커스텀 훅 | FE-02, FE-03 |
| FE-05 | FE | 인증 컴포넌트 및 페이지 | FE-02, FE-04 |
| FE-06 | FE | 라우팅 및 Protected Route | FE-03, FE-05 |
| FE-07 | FE | 카테고리 API + 훅 + 컴포넌트 | FE-02, FE-06 |
| FE-08 | FE | 할일 API + 훅 + 컴포넌트 | FE-02, FE-06, FE-07 |
| FE-09 | FE | 메인 페이지 통합 (TodoListPage) | FE-07, FE-08 |
| FE-10 | FE | 프로필 편집 및 계정 설정 | FE-05, FE-06 |
| FE-11 | FE | 반응형 UI 적용 | FE-09, FE-10 |
| FE-12 | FE | 프론트엔드 테스트 작성 | FE-04, FE-08 |

---

## 일차별 실행 계획 (PRD §11 기준)

| 일차 | 태스크 | 목표 |
|------|--------|------|
| Day 1 | DB-01~DB-05, BE-01~BE-05, FE-01~FE-06 | DB 환경 구성, 인증 API, 인증 화면 |
| Day 2 | BE-06~BE-09, FE-07~FE-10 | 카테고리·할일 API, 카테고리·할일 화면 |
| Day 3 | BE-10~BE-11, FE-11~FE-12 | 테스트, 반응형 UI 점검, 버그 수정 |

---

## 데이터베이스 태스크

---

### DB-01: 로컬 PostgreSQL 17 설치 및 DB/유저 생성

**태스크명**: PostgreSQL 17 설치 및 프로젝트 전용 데이터베이스·유저 초기화

**설명**:
PostgreSQL 17을 로컬에 설치하고, 프로젝트 전용 데이터베이스와 유저를 생성한다.

1. postgresql.org 또는 패키지 매니저로 PostgreSQL 17 설치
2. `psql -U postgres` 로 superuser 접속 후 아래 명령 실행:
   ```sql
   CREATE USER todoapp_user WITH PASSWORD 'your_password';
   CREATE DATABASE todoapp_db OWNER todoapp_user;
   GRANT ALL PRIVILEGES ON DATABASE todoapp_db TO todoapp_user;
   ```
3. 백엔드 `.env` 파일에 `DATABASE_URL=postgresql://todoapp_user:your_password@localhost:5432/todoapp_db` 작성
4. `.env`를 `.gitignore`에 등록

**의존성**: 없음

**완료 조건**:
- [ ] `psql --version` 실행 시 `psql (PostgreSQL) 17.x` 출력 확인
- [ ] `psql -U todoapp_user -d todoapp_db` 접속 성공
- [ ] `.env` 파일에 `DATABASE_URL` 항목 작성 완료
- [ ] `.gitignore`에 `.env` 등록 확인

---

### DB-02: schema.sql 실행 및 테이블 생성 검증

**태스크명**: `database/schema.sql` 실행 후 4개 테이블 및 8개 인덱스 생성 검증

**설명**:
이미 작성된 `database/schema.sql`을 대상 데이터베이스에 실행하고, 테이블 구조와 인덱스가 의도대로 생성되었는지 확인한다.

1. 스키마 실행:
   ```bash
   psql -U todoapp_user -d todoapp_db -f database/schema.sql
   ```
2. 테이블 생성 확인: `\dt` 명령으로 `users`, `categories`, `todos`, `refresh_tokens` 4개 테이블 존재 여부 확인
3. 인덱스 확인: `\di` 명령으로 8개 인덱스 목록 출력 확인
4. 외래키 제약 확인: `\d todos` 로 `category_id`의 `ON DELETE RESTRICT` 제약 적용 여부 확인

**의존성**: DB-01

**완료 조건**:
- [ ] `psql ... -f database/schema.sql` 실행 시 오류 없이 완료 (`COMMIT` 출력 확인)
- [ ] `\dt` 결과에 `users`, `categories`, `todos`, `refresh_tokens` 4개 테이블 모두 존재
- [ ] `\di` 결과에 인덱스 8개 (`idx_todos_user_id`, `idx_todos_category_id`, `idx_todos_user_completed`, `idx_todos_user_due_date`, `idx_categories_user_id`, `idx_refresh_tokens_user_id`, `idx_refresh_tokens_token_hash`, `users_email_key`) 확인
- [ ] `\d todos` 에서 `category_id`의 FK 제약이 `ON DELETE RESTRICT`로 표시
- [ ] schema.sql 재실행 시 `CREATE TABLE IF NOT EXISTS`로 오류 없이 멱등 실행 확인

---

### DB-03: 시드 데이터 검증 (기본 카테고리 3개)

**태스크명**: 기본 카테고리 시드 데이터(업무/개인/쇼핑) 삽입 및 정합성 검증

**설명**:
`database/schema.sql` 내 시드 구문으로 삽입된 기본 카테고리 3개의 데이터 정합성을 확인한다.

1. 시드 데이터 조회:
   ```sql
   SELECT id, name, is_default, user_id FROM categories WHERE is_default = true;
   ```
2. `is_default = true` 인 모든 행의 `user_id`가 `NULL`인지, `name` 값이 `업무`, `개인`, `쇼핑`으로 정확히 존재하는지 확인
3. schema.sql 재실행 후 `INSERT ... ON CONFLICT DO NOTHING`으로 중복 삽입 방지 동작 확인

**의존성**: DB-02

**완료 조건**:
- [ ] `SELECT ... WHERE is_default = true` 결과가 정확히 3행
- [ ] 3개 행 모두 `user_id IS NULL` 확인
- [ ] `name` 컬럼에 `업무`, `개인`, `쇼핑` 값 각각 존재
- [ ] schema.sql 재실행 후 `SELECT COUNT(*) FROM categories WHERE is_default = true` 결과가 여전히 3

---

### DB-04: 백엔드 연결용 pg Pool 설정 (config/db.ts 작성)

**태스크명**: `pg` 라이브러리 Pool을 사용한 `config/db.ts` 작성 및 연결 테스트

**설명**:
ORM 없이 `pg` 라이브러리의 `Pool`을 사용하여 데이터베이스 연결 모듈을 작성한다.

1. 패키지 설치: `npm install pg` 및 `npm install --save-dev @types/pg`
2. `config/db.ts` 작성 내용:
   - `DATABASE_URL` 환경변수를 읽어 `Pool` 인스턴스 생성
   - `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000` 설정
   - `pool.on('error', ...)` 핸들러 등록
   - `query` 헬퍼 함수(`pool.query` 래퍼) export
3. 연결 확인 스크립트 `scripts/test-db-connection.ts` 작성 후 `npx ts-node scripts/test-db-connection.ts` 실행

**의존성**: DB-01

**완료 조건**:
- [ ] `npm install pg @types/pg` 완료 및 `package.json` 의존성 등록 확인
- [ ] `config/db.ts` 파일 생성 및 `Pool` 설정 포함
- [ ] `npx ts-node scripts/test-db-connection.ts` 실행 시 현재 DB 시각 출력 (오류 없음)
- [ ] `DATABASE_URL` 미설정 시 명시적 오류 메시지 출력 처리 확인

---

### DB-05: 개발 환경 DB 리셋 스크립트 작성

**태스크명**: 개발 환경 데이터베이스 초기화(reset) 스크립트 작성 및 npm 스크립트 등록

**설명**:
개발 중 스키마 변경 시 DB를 빠르게 초기화할 수 있는 리셋 스크립트를 작성하고 `package.json`에 등록한다.

1. `scripts/reset-db.ts` 작성 내용:
   - `NODE_ENV !== 'production'` 가드 (프로덕션 실행 차단)
   - 기존 테이블 DROP: `DROP TABLE IF EXISTS refresh_tokens, todos, categories, users CASCADE;`
   - `database/schema.sql` 파일을 읽어 `pool.query()`로 실행
2. `package.json` scripts 등록:
   - `"db:reset": "ts-node scripts/reset-db.ts"`
   - `"db:schema": "psql $DATABASE_URL -f database/schema.sql"`

**의존성**: DB-02, DB-04

**완료 조건**:
- [ ] `scripts/reset-db.ts` 파일 생성 및 `NODE_ENV` 프로덕션 가드 포함
- [ ] `npm run db:reset` 실행 시 오류 없이 완료되고 성공 메시지 출력
- [ ] 리셋 후 `\dt` 로 4개 테이블 재생성 확인
- [ ] 리셋 후 기본 카테고리 3개 시드 재삽입 확인
- [ ] `NODE_ENV=production npm run db:reset` 실행 시 차단 메시지 출력 후 종료 확인

---

## 백엔드 태스크

---

### BE-01: 프로젝트 초기화

**태스크명**: Node.js + TypeScript 프로젝트 기본 구조 및 설정 파일 구성

**설명**:
- `package.json` 생성 및 의존성 설치: `express`, `pg`, `jsonwebtoken`, `bcrypt`, `dotenv`, `cors`, `helmet`
- devDependencies: `typescript`, `ts-node`, `nodemon`, `@types/*`, `jest`, `ts-jest`, `supertest`, `@types/supertest`
- `tsconfig.json` 설정: `target: ES2020`, `module: commonjs`, `outDir: dist`, `rootDir: src`, `strict: true`
- `nodemon.json` 설정: `src/server.ts` 진입점, `.ts` 파일 감시
- `.env.example` 작성: `PORT`, `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN=1h`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN=7d`, `NODE_ENV`
- `package.json` scripts: `dev`, `build`, `start`, `test`
- `src/` 하위 디렉토리 골격 생성: `config/`, `routes/`, `controllers/`, `services/`, `repositories/`, `middlewares/`, `types/`, `utils/`

**의존성**: 없음

**완료 조건**:
- [ ] `npm install` 실행 시 오류 없이 완료되고 `node_modules`가 생성된다
- [ ] `npx tsc --noEmit` 실행 시 오류가 없다
- [ ] `.env.example`에 모든 환경변수 키가 명시되어 있다
- [ ] `npm run dev` 스크립트가 `nodemon`으로 `src/server.ts`를 실행하도록 설정되어 있다
- [ ] `src/` 하위 8개 디렉토리가 존재한다

---

### BE-02: 공통 인프라 구성

**태스크명**: 환경변수 로더, DB 연결, 유틸리티 함수 구현

**설명**:
- `src/config/env.ts`: `dotenv`로 환경변수 로드, 필수 변수 누락 시 startup에서 즉시 throw, 타입 안전하게 export
- `src/config/db.ts`: `pg.Pool` 인스턴스 생성 및 export, `DATABASE_URL` 우선 사용 후 개별 변수 fallback, `pool.query` 래퍼 export
- `src/utils/app-error.ts`: `AppError extends Error` 클래스 — `statusCode: number`, `code: string`, `message: string` 필드 포함
- `src/utils/jwt-utils.ts`: `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)` 함수 구현 — `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` 및 만료 시간 환경변수 사용
- `src/utils/hash-utils.ts`: `hashPassword(plain: string): Promise<string>` (salt rounds ≥ 10), `comparePassword(plain, hashed): Promise<boolean>` 구현

**의존성**: BE-01

**완료 조건**:
- [ ] `env.ts`에서 필수 환경변수 누락 시 프로세스 시작 시 명확한 오류 메시지와 함께 종료된다
- [ ] `db.ts`의 `Pool`이 `DATABASE_URL` 또는 개별 DB 변수로 연결 설정된다
- [ ] `AppError` 인스턴스가 `instanceof Error`를 만족하며 `statusCode`, `code`, `message`를 가진다
- [ ] `signAccessToken` / `verifyAccessToken` 쌍이 정상 서명·검증되고, 만료 토큰 검증 시 오류를 throw한다
- [ ] `hashPassword` 결과가 `comparePassword`로 검증 가능하고, bcrypt salt rounds가 10 이상이다
- [ ] `npx tsc --noEmit` 통과

---

### BE-03: 공통 미들웨어 구현

**태스크명**: 인증, 오류 처리, 요청 바디 검증 미들웨어 작성

**설명**:
- `src/middlewares/authenticate.ts`: `Authorization: Bearer <token>` 헤더 파싱 → `verifyAccessToken` 호출 → 성공 시 `req.user`에 페이로드(`userId`, `email`) 설정, 실패 시 `AppError(401, 'UNAUTHORIZED')` throw
- `src/middlewares/error-handler.ts`: Express 4-argument 에러 핸들러, `AppError` 인스턴스면 `{ error: { code, message } }` 형태로 해당 statusCode 응답, 그 외 500 `INTERNAL_SERVER_ERROR` 응답
- `src/middlewares/validate-body.ts`: 필수 필드 누락 시 `AppError(400, 'VALIDATION_ERROR')` throw

**의존성**: BE-02

**완료 조건**:
- [ ] 유효한 Access Token이 포함된 요청에서 `req.user.userId`와 `req.user.email`이 정확히 설정된다
- [ ] 토큰 누락 또는 만료 시 `401` 상태코드와 `{ error: { code: "UNAUTHORIZED", ... } }` 형식으로 응답한다
- [ ] `error-handler`가 `AppError`와 일반 `Error`를 구분하여 각각 적절한 statusCode로 응답한다
- [ ] 오류 응답 body가 항상 `{ "error": { "code": "...", "message": "..." } }` 형식을 준수한다
- [ ] `validate-body` 미들웨어가 필수 필드 누락 시 `400 VALIDATION_ERROR`를 반환한다
- [ ] `npx tsc --noEmit` 통과

---

### BE-04: 도메인 타입 정의

**태스크명**: 도메인 엔티티, 요청/응답, Express 확장 타입 작성

**설명**:
- `src/types/domain-types.ts`: `User`, `RefreshToken`, `Category`, `Todo` 인터페이스 — DB 컬럼명 기준 snake_case 필드 포함
- `src/types/request-types.ts`: 각 API 요청 body 타입 정의
  - `RegisterRequest`, `LoginRequest`, `RefreshRequest`
  - `UpdateUserRequest`, `CreateCategoryRequest`, `UpdateCategoryRequest`
  - `CreateTodoRequest`, `UpdateTodoRequest`
- `src/types/express.d.ts`: `Express.Request` 인터페이스 augmentation — `user?: { userId: string; email: string }` 추가

**의존성**: BE-01

**완료 조건**:
- [ ] `domain-types.ts`의 모든 인터페이스가 DB 스키마의 컬럼과 1:1 대응된다
- [ ] `request-types.ts`의 모든 요청 타입이 각 API 엔드포인트 명세와 일치한다
- [ ] `express.d.ts` augmentation으로 `req.user`가 타입 오류 없이 컨트롤러에서 사용 가능하다
- [ ] `npx tsc --noEmit` 통과

---

### BE-05: 인증 도메인 구현 (UC-01, UC-02, UC-02a, UC-02b)

**태스크명**: 회원가입·로그인·로그아웃·토큰 재발급 전체 레이어 구현

**설명**:
- `src/repositories/user-repository.ts`: `findByEmail`, `create`, `findById`, `updateById`, `deleteById`
- `src/repositories/refresh-token-repository.ts`: `save`, `findByToken`, `revokeByToken`, `revokeByUserId`
- `src/services/auth-service.ts`:
  - `register(dto)`: 이메일 중복 체크(BR-03) → `hashPassword` → user 생성 → 토큰 쌍 발급 → refresh 저장
  - `login(dto)`: 이메일 조회 → `comparePassword` → 토큰 발급 → refresh 저장
  - `logout(refreshToken)`: refresh 토큰 DB에서 무효화
  - `refreshTokens(refreshToken)`: DB 조회 → `verifyRefreshToken` → 새 토큰 쌍 발급 → 기존 토큰 교체(rotation)
- `src/controllers/auth-controller.ts`: 서비스 호출, 응답 형식 통일 (`201` for register, `200` for others)
- `src/routes/auth-routes.ts`: `POST /register`, `POST /login`, `POST /logout`, `POST /refresh` 등록

**의존성**: BE-02, BE-03, BE-04, DB-02

**완료 조건**:
- [ ] `POST /api/auth/register`: 신규 이메일로 `201`과 `accessToken`, `refreshToken`, `user` 반환
- [ ] 중복 이메일 가입 시 `409` 및 `EMAIL_ALREADY_EXISTS` 코드 반환
- [ ] `POST /api/auth/login`: 올바른 자격증명으로 `200`과 토큰 쌍 반환, 잘못된 비밀번호는 `401`
- [ ] `POST /api/auth/logout`: refresh 토큰이 DB에서 무효화됨
- [ ] `POST /api/auth/refresh`: 유효한 refresh 토큰으로 새 토큰 쌍 발급, 기존 토큰 무효화
- [ ] 만료/미존재 refresh 토큰으로 재발급 요청 시 `401` 반환

---

### BE-06: 사용자 도메인 구현 (UC-03, UC-12)

**태스크명**: 개인정보 수정 및 회원 탈퇴 레이어 구현

**설명**:
- `src/services/user-service.ts`:
  - `updateMe(userId, dto)`: `dto.password` 있으면 현재 비밀번호 확인 → `hashPassword` 후 저장, `dto.name` 있으면 업데이트, 변경된 user 반환 (password_hash 필드 제외)
  - `deleteMe(userId)`: 트랜잭션으로 refresh 토큰 전체 무효화 → user 삭제 (CASCADE로 todos/categories 함께 삭제)
- `src/controllers/user-controller.ts`: `getMe(200)`, `updateMe(200)`, `deleteMe(204)`
- `src/routes/user-routes.ts`: `GET /me`, `PATCH /me`, `DELETE /me` — 전 라우트 `authenticate` 적용

**의존성**: BE-03, BE-04, BE-05

**완료 조건**:
- [ ] `PATCH /api/users/me`: `name` 변경 시 DB에 반영되고 응답에 `password_hash` 필드 미포함
- [ ] `PATCH /api/users/me`: `password` 변경 시 bcrypt 해시 저장, 이후 로그인이 새 비밀번호로 성공
- [ ] `DELETE /api/users/me`: 탈퇴 시 `users` 테이블과 `refresh_tokens` 테이블에서 해당 사용자 데이터 모두 삭제
- [ ] 인증 토큰 없이 접근 시 `401` 반환
- [ ] `req.user.userId` 기준으로만 동작하여 데이터 격리(BR-02) 보장
- [ ] `npx tsc --noEmit` 통과

---

### BE-07: 카테고리 도메인 구현 (UC-04, UC-05, UC-06)

**태스크명**: 카테고리 조회·생성·수정·삭제 레이어 구현

**설명**:
- `src/repositories/category-repository.ts`: `findAllByUserId`, `findByIdAndUserId`, `create`, `updateByIdAndUserId`, `deleteByIdAndUserId`, `findFirstDefault`, `reassignTodos(fromId, toId, pgClient?)`
- `src/services/category-service.ts`:
  - `getCategories(userId)`: 기본 카테고리 포함 목록 반환
  - `createCategory(userId, dto)`: 생성
  - `updateCategory(userId, id, dto)`: `is_default` 체크(BR-04) → 업데이트
  - `deleteCategory(userId, id)`: `is_default` 체크(BR-05) → 트랜잭션으로 `reassignTodos` → 삭제 (BR-06)
- `src/controllers/category-controller.ts`: `getCategories(200)`, `createCategory(201)`, `updateCategory(200)`, `deleteCategory(204)`
- `src/routes/category-routes.ts`: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` — 전 라우트 `authenticate` 적용

**의존성**: BE-03, BE-04, BE-05, DB-02

**완료 조건**:
- [ ] `GET /api/categories`: 로그인한 유저의 카테고리만 반환, 타인 카테고리 미포함 (BR-02)
- [ ] `POST /api/categories`: 생성 후 `201`과 생성된 객체 반환
- [ ] 기본 카테고리(`is_default: true`)에 `PATCH`/`DELETE` 요청 시 `403 CANNOT_MODIFY_DEFAULT` (BR-04/05)
- [ ] 카테고리 삭제 시 소속 todos가 첫 번째 기본 카테고리로 이동, 트랜잭션으로 처리 (BR-06)
- [ ] 존재하지 않거나 타인 소유 카테고리 접근 시 `404` 반환
- [ ] `npx tsc --noEmit` 통과

---

### BE-08: 할일 도메인 구현 (UC-07~UC-11)

**태스크명**: 할일 등록·조회·수정·완료토글·삭제 레이어 구현

**설명**:
- `src/repositories/todo-repository.ts`: `findAllByUserId(userId, filters)`, `findByIdAndUserId`, `create`, `updateByIdAndUserId`, `toggleComplete`, `deleteByIdAndUserId` — 모든 쿼리에 `user_id` 조건 필수(BR-02)
- `src/services/todo-service.ts`:
  - `getTodos(userId, filters)`: 카테고리/기간/완료 여부 복합 필터 지원 (BR-10, BR-11)
  - `createTodo(userId, dto)`: `category_id` 미입력 시 기본 카테고리 자동 배정
  - `updateTodo(userId, id, dto)`: 소유권 확인 → 업데이트
  - `toggleTodo(userId, id)`: 완료 상태 반전, 삭제 없음 (BR-09)
  - `deleteTodo(userId, id)`: 소유권 확인 → 삭제
- `src/controllers/todo-controller.ts`: `getTodos(200)`, `createTodo(201)`, `updateTodo(200)`, `toggleTodo(200)`, `deleteTodo(204)`
- `src/routes/todo-routes.ts`: `GET /`, `POST /`, `PATCH /:id`, `PATCH /:id/toggle`, `DELETE /:id` — 전 라우트 `authenticate` 적용

**의존성**: BE-03, BE-04, BE-05, BE-07, DB-02

**완료 조건**:
- [ ] `GET /api/todos`: `category_id`, `is_completed`, `due_date` 범위 필터 동작, 타인 할일 미반환 (BR-02, BR-10, BR-11)
- [ ] `POST /api/todos`: `category_id` 미입력 시 기본 카테고리에 자동 배정
- [ ] `PATCH /api/todos/:id/toggle`: `is_completed`가 반전되고 레코드 삭제 없음 (BR-09)
- [ ] `PATCH /api/todos/:id`: 지정 필드만 변경, 나머지 유지
- [ ] 존재하지 않거나 타인 소유 할일 접근 시 `404` 반환
- [ ] `npx tsc --noEmit` 통과

---

### BE-09: 앱 통합 및 서버 진입점 구성

**태스크명**: app.ts, server.ts, 라우터 인덱스 구성 및 전체 미들웨어 체인 연결

**설명**:
- `src/routes/index.ts`: 각 도메인 라우터를 `/api` prefix로 통합 마운트
- `src/app.ts`: Express 앱 생성, `helmet()`, `cors()`, `express.json()` 적용, 라우터 마운트, `error-handler` 마지막 등록, `GET /health` 헬스체크 엔드포인트 추가
- `src/server.ts`: `env.ts` 로드 → DB 연결 확인 → `app.listen(PORT)`

**의존성**: BE-03, BE-05, BE-06, BE-07, BE-08

**완료 조건**:
- [ ] `npm run dev` 실행 시 지정 포트에서 정상 기동되고 로그에 포트 번호 출력
- [ ] `GET /health` 요청에 `200` 응답
- [ ] 모든 `/api/*` 라우트가 의도한 컨트롤러로 라우팅됨
- [ ] 등록되지 않은 경로 요청 시 `404` 반환
- [ ] 오류 핸들러가 모든 라우트의 uncaught 오류를 표준 형식으로 응답
- [ ] `npx tsc --noEmit` 통과

---

### BE-10: 인증 API 통합 테스트

**태스크명**: Jest + Supertest 설정 및 인증 도메인 통합 테스트 작성

**설명**:
- `jest.config.ts`: `ts-jest` preset, `testEnvironment: node`, `testMatch: **/*.test.ts`
- `src/__tests__/setup.ts`: 테스트 실행 전 `users`, `refresh_tokens` 테이블 TRUNCATE
- `src/__tests__/auth.test.ts`:
  - `POST /api/auth/register`: 정상 등록(201), 중복 이메일(409), 필수 필드 누락(400)
  - `POST /api/auth/login`: 정상 로그인(200), 잘못된 비밀번호(401)
  - `POST /api/auth/logout`: 정상 로그아웃(200) 후 토큰 무효화 확인
  - `POST /api/auth/refresh`: 정상 재발급(200), 토큰 rotation 확인, 만료 토큰(401)

**의존성**: BE-09

**완료 조건**:
- [ ] `npm test` 실행 시 Jest가 `ts-jest`로 TypeScript 파일을 컴파일하여 테스트 실행
- [ ] 각 테스트 실행 전 관련 테이블이 초기화되어 테스트 간 독립성 보장
- [ ] 회원가입·로그인·로그아웃·토큰 재발급 정상 시나리오 테스트 모두 통과
- [ ] 중복 이메일, 잘못된 비밀번호, 유효하지 않은 토큰 오류 시나리오 테스트 모두 통과
- [ ] 토큰 rotation 후 이전 refresh 토큰으로 재발급 요청 시 `401` 반환 검증

---

### BE-11: 카테고리·할일 API 통합 테스트

**태스크명**: 카테고리 및 할일 도메인 통합 테스트 작성

**설명**:
- `src/__tests__/category.test.ts`:
  - `GET /api/categories`: 기본 카테고리 포함 목록, 타인 카테고리 미노출
  - `POST/PATCH/DELETE /api/categories`: 정상 동작, 기본 카테고리 수정·삭제 시도(403), 타인 카테고리(404)
  - 카테고리 삭제 후 소속 todos → 기본 카테고리 이동 검증 (BR-06)
- `src/__tests__/todo.test.ts`:
  - `GET/POST/PATCH/DELETE /api/todos`: 정상 동작, 타인 할일 접근(404)
  - 필터 파라미터 동작 검증 (BR-10, BR-11)
  - `PATCH /api/todos/:id/toggle`: `is_completed` 반전, 레코드 삭제 없음 (BR-09)

**의존성**: BE-10

**완료 조건**:
- [ ] 카테고리 테스트 전체 통과, BR-04, BR-05, BR-06 비즈니스 규칙 검증 포함
- [ ] 할일 테스트 전체 통과, BR-02(데이터 격리), BR-09(완료 토글) 검증 포함
- [ ] 미인증 요청 시 `401` 반환을 모든 보호 엔드포인트에서 확인
- [ ] 카테고리 삭제 후 소속 할일의 `category_id`가 기본 카테고리 ID로 변경됨을 DB 조회로 검증
- [ ] `npm test` 실행 시 BE-10, BE-11 전체 테스트 스위트 오류 없이 통과

---

## 프론트엔드 태스크

---

### FE-01: 프로젝트 초기화

**태스크명**: Vite + React 19 + TypeScript 프로젝트 초기화 및 의존성 설치

**설명**:
`npm create vite@latest`로 React + TypeScript 템플릿 생성 후 핵심 의존성 설치.
- 의존성: `react@19`, `react-dom@19`, `react-router-dom`, `zustand`, `@tanstack/react-query`, `axios`
- devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- `tsconfig.json`: `strict: true`, `paths` 별칭(`@/*` → `src/*`) 설정
- `vite.config.ts`: path alias 및 test 설정(`environment: jsdom`) 추가
- `.env.example`: `VITE_API_BASE_URL=http://localhost:3000`
- `src/app/`, `src/features/auth|category|todo/`, `src/shared/` 디렉토리 구조 생성

**의존성**: 없음

**완료 조건**:
- [ ] `npm run dev` 실행 시 Vite 개발 서버 정상 구동
- [ ] `npm run build` 실행 시 TypeScript 컴파일 오류 없이 빌드 성공
- [ ] `npm run test` 실행 시 Vitest 정상 실행
- [ ] `@/*` path alias가 Vite와 TypeScript 양쪽에서 동작
- [ ] `.env.example` 존재, `.env.local`은 `.gitignore`에 포함
- [ ] `src/` 하위 feature-based 디렉토리 구조 생성 완료

---

### FE-02: 공통 인프라 구성

**태스크명**: HTTP 클라이언트, 공통 타입, 공통 UI 컴포넌트 구현

**설명**:
- `shared/api/http-client.ts`: axios 인스턴스 생성, `VITE_API_BASE_URL` baseURL 설정
  - 요청 인터셉터: `accessToken`을 `Authorization: Bearer` 헤더에 자동 주입
  - 응답 인터셉터: 401 수신 시 `POST /api/auth/refresh` 호출 → 새 토큰 store 갱신 → 원래 요청 재시도, 재시도도 401이면 `clearAuth()` 후 `/login` 리다이렉트
- `shared/types/common-types.ts`: `ApiResponse<T>`, `ApiError` 인터페이스 정의
- `shared/utils/date-utils.ts`: `formatDate`, `formatRelativeTime` 유틸 함수
- `shared/components/Button.tsx`: variant(`primary | secondary | danger`), size(`sm | md | lg`), `loading`, `disabled` props
- `shared/components/Input.tsx`: label, error 메시지, `helperText` props
- `shared/components/ErrorMessage.tsx`: API 에러 메시지 표시 컴포넌트

**의존성**: FE-01, FE-03

**완료 조건**:
- [ ] `httpClient` 인스턴스로 API 호출 시 `Authorization` 헤더 자동 주입
- [ ] 401 응답 시 토큰 갱신 후 원래 요청 자동 재시도
- [ ] 토큰 갱신 실패 시 `clearAuth()` 호출 후 `/login` 리다이렉트
- [ ] `Button`, `Input`, `ErrorMessage` 컴포넌트가 props에 따라 올바르게 렌더링
- [ ] `ApiResponse<T>`, `ApiError` 타입 프로젝트 전체 재사용 가능
- [ ] TypeScript strict 모드에서 타입 오류 없음

---

### FE-03: 인증 스토어 및 타입 정의

**태스크명**: Zustand 인증 스토어와 인증 관련 타입 정의

**설명**:
- `features/auth/types/auth-types.ts`: `User`, `AuthState`, `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse`, `TokenRefreshResponse` 인터페이스 정의
- `features/auth/store/auth-store.ts`: Zustand 인증 상태 관리
  - 상태: `user: User | null`, `accessToken: string | null`, `refreshToken: string | null`, `isAuthenticated: boolean`
  - 액션: `setAuth(user, accessToken, refreshToken)`, `updateTokens(accessToken, refreshToken)`, `clearAuth()`
  - localStorage/sessionStorage 사용 금지, Zustand 메모리에만 저장

**의존성**: FE-01

**완료 조건**:
- [ ] `useAuthStore`로 `accessToken`, `refreshToken`, `user`, `isAuthenticated` 상태 읽기 가능
- [ ] `setAuth()` 호출 후 `isAuthenticated`가 `true`로 변경
- [ ] `clearAuth()` 호출 후 모든 상태가 초기값(`null`, `false`)으로 리셋
- [ ] `updateTokens()` 호출 시 `user` 상태 유지, 토큰만 교체
- [ ] localStorage/sessionStorage에 토큰 데이터 저장 안 됨 확인
- [ ] TypeScript strict 모드에서 타입 오류 없음

---

### FE-04: 인증 API 클라이언트 및 커스텀 훅

**태스크명**: 인증 API 함수 및 login/register/token-refresh 커스텀 훅 구현

**설명**:
- `features/auth/api/auth-api.ts`: `login`, `register`, `logout`, `refreshToken`, `getMe`, `updateMe`, `deleteMe` API 함수
- `features/auth/hooks/use-login.ts`: `useMutation` 래핑, 성공 시 `setAuth()` 호출 후 `/todos`로 navigate
- `features/auth/hooks/use-register.ts`: `useMutation` 래핑, 성공 시 자동 로그인(응답 토큰으로 `setAuth()`)
- `features/auth/hooks/use-token-refresh.ts`: http-client 인터셉터와 연동 가능한 토큰 갱신 함수 export

**의존성**: FE-02, FE-03

**완료 조건**:
- [ ] `useLogin()` 성공 시 `isAuthenticated`가 `true`가 되고 `/todos`로 이동
- [ ] `useLogin()` 실패 시 에러 객체 반환, store 상태 미변경
- [ ] `useRegister()` 성공 시 인증 상태 설정 완료
- [ ] 모든 API 함수가 `ApiResponse<T>` 타입 준수
- [ ] `use-token-refresh.ts`가 http-client 인터셉터와 연동 가능한 인터페이스 제공
- [ ] TypeScript strict 모드에서 오류 없음

---

### FE-05: 인증 컴포넌트 및 페이지

**태스크명**: LoginForm, RegisterForm 컴포넌트 및 LoginPage, RegisterPage 구현

**설명**:
- `features/auth/components/LoginForm.tsx`: 이메일/비밀번호 입력, `useLogin` 연동, 클라이언트 유효성 검사, 에러 표시
- `features/auth/components/RegisterForm.tsx`: 이름/이메일/비밀번호/비밀번호 확인 입력, `useRegister` 연동, 비밀번호 일치 검사
- `features/auth/pages/LoginPage.tsx`: `LoginForm` 렌더링, 회원가입 링크
- `features/auth/pages/RegisterPage.tsx`: `RegisterForm` 렌더링, 로그인 링크
- 공통: `shared/components` 활용

**의존성**: FE-02, FE-04

**완료 조건**:
- [ ] `LoginForm`에서 이메일/비밀번호 입력 후 제출 시 `useLogin` 뮤테이션 호출
- [ ] 유효성 검사 실패 시 각 필드 아래에 오류 메시지 표시
- [ ] 처리 중 버튼 비활성화, 로딩 상태 표시
- [ ] API 에러 발생 시 `ErrorMessage` 컴포넌트로 메시지 표시
- [ ] `RegisterForm`에서 비밀번호 불일치 시 제출 차단
- [ ] 로그인 ↔ 회원가입 페이지 간 링크 정상 작동

---

### FE-06: 라우팅 및 Protected Route

**태스크명**: react-router-dom 라우터 설정, ProtectedRoute 컴포넌트, TanStack Query Provider 구성

**설명**:
- `app/queryClient.ts`: `QueryClient` 인스턴스 생성, `staleTime: 1000 * 60 * 5`, `retry: 1`
- `app/router.tsx`: `createBrowserRouter`로 라우트 정의
  - `/login` → `LoginPage`, `/register` → `RegisterPage`
  - `/todos` → `ProtectedRoute` 래핑된 `TodoListPage`
  - `/profile` → `ProtectedRoute` 래핑된 `ProfileEditForm` 페이지
  - `/` → `/todos` 리다이렉트, 미정의 경로 → `/login` 리다이렉트
- `ProtectedRoute`: `isAuthenticated` 확인, `false`이면 `/login`으로 redirect
- `app/App.tsx`: `QueryClientProvider`, `RouterProvider` 래핑, 개발 환경에서 `ReactQueryDevtools` 포함

**의존성**: FE-03, FE-05

**완료 조건**:
- [ ] 미인증 상태에서 `/todos` 접근 시 자동으로 `/login` 리다이렉트
- [ ] 인증 상태에서 `/login` 접근 시 `/todos` 리다이렉트
- [ ] `/` 접근 시 `/todos` 리다이렉트
- [ ] `QueryClientProvider`가 앱 전체를 감싸고 하위 컴포넌트에서 훅 사용 가능
- [ ] 개발 환경에서 ReactQueryDevtools 패널 표시
- [ ] 정의되지 않은 경로 접근 시 적절한 페이지로 리다이렉트

---

### FE-07: 카테고리 API, 훅, 컴포넌트 구현

**태스크명**: 카테고리 CRUD API 클라이언트, 커스텀 훅 3개, 카테고리 UI 컴포넌트 구현

**설명**:
- `features/category/types/category-types.ts`: `Category`, `CreateCategoryRequest`, `UpdateCategoryRequest`
- `features/category/api/category-api.ts`: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- `features/category/hooks/use-categories.ts`: `useQuery`, query key `['categories']`
- `features/category/hooks/use-create-category.ts`: `useMutation`, 성공 시 `invalidateQueries(['categories'])`
- `features/category/hooks/use-delete-category.ts`: `useMutation`, optimistic update (삭제 즉시 캐시 제거, 실패 시 롤백)
- `features/category/components/CategoryList.tsx`: 목록 렌더링, 선택 하이라이트, 생성 버튼
- `features/category/components/CategoryItem.tsx`: 카테고리명, 수정/삭제 버튼, 삭제 확인 다이얼로그
- `features/category/components/CategoryForm.tsx`: 생성/수정 모드 공용 폼

**의존성**: FE-02, FE-06

**완료 조건**:
- [ ] 카테고리 목록이 API에서 fetch되어 `CategoryList`에 렌더링됨
- [ ] 카테고리 생성 후 목록 즉시 갱신 (`invalidateQueries`)
- [ ] 카테고리 삭제 시 optimistic update로 즉시 제거, 실패 시 복원
- [ ] `CategoryItem`에서 삭제 버튼 클릭 시 확인 절차 후 삭제 실행
- [ ] `CategoryForm`이 생성/수정 모드를 props로 구분하여 동작
- [ ] 로딩/에러 상태 UI 처리

---

### FE-08: 할일 API, 훅, 컴포넌트 구현

**태스크명**: 할일 CRUD + 토글 API 클라이언트, 커스텀 훅 5개, 할일 UI 컴포넌트 구현

**설명**:
- `features/todo/types/todo-types.ts`: `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`, `TodoFilterParams`
- `features/todo/api/todo-api.ts`: `getTodos(params?)`, `createTodo`, `updateTodo`, `deleteTodo`, `toggleTodo`
- 훅: `use-todos.ts` (`useQuery`, key `['todos', filterParams]`), `use-create-todo.ts`, `use-update-todo.ts`, `use-toggle-todo.ts` (optimistic update), `use-delete-todo.ts` (optimistic update)
- `features/todo/components/TodoList.tsx`: 목록 렌더링, 빈 상태 메시지
- `features/todo/components/TodoItem.tsx`: 체크박스(토글), 제목/설명, 마감일, 수정/삭제 버튼
- `features/todo/components/TodoForm.tsx`: 제목(필수), 설명, 카테고리 선택, 마감일 — 생성/수정 모드 공용
- `features/todo/components/TodoFilter.tsx`: 상태 필터, 카테고리 필터 드롭다운

**의존성**: FE-02, FE-06, FE-07

**완료 조건**:
- [ ] 할일 목록이 `filterParams`에 따라 올바르게 fetch 및 렌더링
- [ ] `use-toggle-todo`의 optimistic update로 체크박스 클릭 시 즉각 UI 반응
- [ ] `use-delete-todo`의 optimistic update로 삭제 즉시 목록 제거, 실패 시 복원
- [ ] `TodoForm`이 생성/수정 모드 구분, 카테고리 선택 드롭다운이 카테고리 목록 표시
- [ ] `TodoFilter`에서 필터 변경 시 `filterParams` 갱신 후 목록 재fetch
- [ ] 로딩/에러/빈 상태 각각 다른 UI로 표시

---

### FE-09: 메인 페이지 통합

**태스크명**: TodoListPage — 카테고리 사이드바 + 할일 목록 + 필터 통합 레이아웃 구현

**설명**:
- `features/todo/pages/TodoListPage.tsx`: 좌측 사이드바(`CategoryList`) + 우측 메인 영역(`TodoFilter` + `TodoList`)
- 상단 네비게이션: 앱 타이틀, 프로필 링크(`/profile`), 로그아웃 버튼
- 로컬 상태: `selectedCategoryId`, `filterParams` — 카테고리 선택 시 `filterParams.categoryId` 연동
- 로그아웃: `POST /api/auth/logout` 호출 후 `clearAuth()`, `/login` navigate
- 할일 추가 버튼 → `TodoForm` 표시, 생성 완료 후 폼 닫기

**의존성**: FE-07, FE-08

**완료 조건**:
- [ ] 페이지 진입 시 카테고리 목록과 할일 목록 동시 fetch
- [ ] 카테고리 선택 시 해당 카테고리의 할일만 필터링
- [ ] `TodoFilter`와 카테고리 사이드바 선택이 복합 적용
- [ ] 로그아웃 버튼 클릭 시 API 호출 후 store 초기화 및 `/login` 이동
- [ ] 할일 추가 폼 열기/닫기 상호작용 정상 동작
- [ ] 네비게이션 바의 프로필 링크가 `/profile`로 이동

---

### FE-10: 프로필 편집 및 계정 설정

**태스크명**: ProfileEditForm — 이름 수정, 비밀번호 변경, 회원탈퇴 구현

**설명**:
- `features/auth/components/ProfileEditForm.tsx`: 3개 섹션으로 구성
  - 섹션 1 (프로필 수정): 현재 이름 초기값, `PATCH /api/users/me` 호출, 성공 시 auth-store `user` 업데이트
  - 섹션 2 (비밀번호 변경): 현재/새/확인 비밀번호, 클라이언트 일치 검사, `PATCH /api/users/me`
  - 섹션 3 (회원탈퇴): 확인 절차 후 `DELETE /api/users/me`, `clearAuth()` 후 `/login` navigate
- `shared/components/Button` (variant: `danger` for 탈퇴) 활용

**의존성**: FE-05, FE-06

**완료 조건**:
- [ ] 페이지 진입 시 현재 사용자 이름이 입력 필드 초기값으로 표시
- [ ] 이름 수정 성공 시 auth-store의 `user.name` 업데이트
- [ ] 비밀번호 확인 불일치 시 제출 차단 및 오류 메시지 표시
- [ ] 회원탈퇴 클릭 시 확인 절차, 확인 후 API 호출 및 로그아웃 실행
- [ ] 각 섹션별 API 에러가 해당 섹션에만 표시
- [ ] 처리 중 각 섹션의 제출 버튼 비활성화

---

### FE-11: 반응형 UI 적용

**태스크명**: 모바일(320px~) / 태블릿 / 데스크톱 3단계 브레이크포인트 반응형 레이아웃 구현

**설명**:
브레이크포인트: 모바일 320px~767px, 태블릿 768px~1023px, 데스크톱 1024px 이상

- `TodoListPage`: 모바일 — 사이드바 숨김, 하단 탭 또는 햄버거 메뉴로 카테고리 접근 / 태블릿 — 사이드바 200px / 데스크톱 — 사이드바 240px, 최대 너비 1280px 중앙 정렬
- `TodoItem`: 모바일 — 수정/삭제 버튼 항상 표시 / 데스크톱 — hover 시 표시
- `LoginPage`/`RegisterPage`: 모바일 — 전체 너비 / 태블릿 이상 — 카드 형태(최대 400px, 중앙 정렬)

**의존성**: FE-09, FE-10

**완료 조건**:
- [ ] 320px 뷰포트에서 주요 기능(로그인, 할일 조회/생성)이 가로 스크롤 없이 사용 가능
- [ ] 모바일에서 카테고리 목록 접근 UI(탭/메뉴) 존재 및 동작
- [ ] 태블릿(768px)에서 사이드바와 메인 영역이 나란히 배치
- [ ] 데스크톱(1024px 이상)에서 최대 너비로 중앙 정렬
- [ ] 로그인/회원가입 페이지가 태블릿 이상에서 카드 형태로 표시
- [ ] 브라우저 개발자 도구 반응형 모드에서 세 가지 브레이크포인트 전환이 자연스러움

---

### FE-12: 프론트엔드 테스트 작성

**태스크명**: Vitest 설정, auth-store · http-client · 커스텀 훅 단위 테스트 작성

**설명**:
- `vitest.config.ts`: `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`
- `src/test/setup.ts`: `@testing-library/jest-dom` import
- `features/auth/store/auth-store.test.ts`: 초기 상태, `setAuth`, `clearAuth`, `updateTokens` 4개 시나리오 검증
- `shared/api/http-client.test.ts`: axios-mock-adapter 또는 msw 활용 — 401 인터셉트 → 토큰 갱신 → 재시도 흐름 검증, 갱신 실패 시 `clearAuth()` 호출 확인
- `features/auth/hooks/use-login.test.ts`: `renderHook` + `QueryClientProvider` 래핑 — 성공/실패 시나리오
- `features/todo/hooks/use-toggle-todo.test.ts`: optimistic update 및 롤백 검증

**의존성**: FE-04, FE-08

**완료 조건**:
- [ ] `npm run test` 실행 시 모든 테스트 통과
- [ ] `auth-store.test.ts`에서 4가지 시나리오 모두 검증
- [ ] `http-client.test.ts`에서 401 인터셉트 → 토큰 갱신 → 재시도 흐름 테스트
- [ ] `use-login.test.ts`에서 성공/실패 시나리오 모두 검증
- [ ] `use-toggle-todo.test.ts`에서 optimistic update 및 롤백 검증
- [ ] auth-store와 http-client 인터셉터 로직의 주요 분기 모두 커버

---

*본 실행 계획은 `2-prd.md` v1.3과 `4-project-principles.md` v1.0을 기반으로 작성되었으며, 개발 진행에 따라 업데이트된다.*
