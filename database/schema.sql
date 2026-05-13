-- ============================================================
-- TodoListApp — Database Schema DDL
-- 참조: docs/6-erd.md v1.0, docs/2-prd.md v1.3
-- 대상: PostgreSQL 17
-- ============================================================
--
-- 실행 순서
--   1. 테이블 생성 (users → categories → todos → refresh_tokens)
--   2. 인덱스 생성
--   3. 기본 카테고리 시드 데이터 삽입
--
-- 주의사항
--   todos.category_id FK는 ON DELETE RESTRICT 로 설정한다.
--   카테고리 삭제 시 소속 할일을 기본 카테고리로 이동하는 로직은
--   services/category-service.ts (UC-06) 에서 트랜잭션으로 처리한다.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. 테이블 생성
-- ============================================================

-- ------------------------------------------------------------
-- users
-- BR-03: email UNIQUE 제약으로 시스템 전체 유일성 보장
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT users_email_key UNIQUE (email)  -- BR-03
);

-- ------------------------------------------------------------
-- categories
-- BR-04: is_default = true, user_id IS NULL  → 기본 카테고리 (수정·삭제 불가)
-- BR-05: is_default = false, user_id IS NOT NULL → 사용자 정의 카테고리
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)  NOT NULL,
    is_default  BOOLEAN       NOT NULL DEFAULT false,
    user_id     UUID,                             -- NULL = 기본 카테고리
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- 기본 카테고리는 user_id가 NULL, 사용자 정의 카테고리는 user_id가 필수
    CONSTRAINT chk_categories_ownership
        CHECK (
            (is_default = true  AND user_id IS NULL) OR
            (is_default = false AND user_id IS NOT NULL)
        )
);

-- ------------------------------------------------------------
-- todos
-- BR-06: category_id NOT NULL — 항상 하나의 카테고리에 속해야 함
-- BR-07: title NOT NULL — 제목 필수
-- BR-09: is_completed — 완료 시 삭제 대신 상태 변경으로 관리
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL,
    category_id  UUID          NOT NULL,          -- BR-06
    title        VARCHAR(500)  NOT NULL,           -- BR-07
    description  TEXT,                            -- 선택값
    due_date     DATE,                            -- 선택값, 과거 날짜 허용 (BR-08)
    is_completed BOOLEAN       NOT NULL DEFAULT false,  -- BR-09
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT fk_todos_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- ON DELETE RESTRICT: 카테고리 삭제 전 services/category-service.ts 에서
    -- 소속 todos를 기본 카테고리로 이동 후 삭제 (UC-06, BR-06)
    CONSTRAINT fk_todos_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- refresh_tokens
-- Zustand 메모리 저장 방식이므로 서버 사이드 무효화용 테이블
-- 로그아웃(UC-02a) · 비밀번호 변경(UC-03) 시 revoked = true 처리
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL,
    token_hash  VARCHAR(255)  NOT NULL,
    expires_at  TIMESTAMPTZ   NOT NULL,
    revoked     BOOLEAN       NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- 2. 인덱스 생성
-- ============================================================

-- users: email UNIQUE 인덱스는 CONSTRAINT로 이미 생성됨

-- todos: 사용자별 · 카테고리별 조회 (BR-02 데이터 격리, UC-08 필터링)
CREATE INDEX IF NOT EXISTS idx_todos_user_id      ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category_id  ON todos(category_id);

-- todos: 완료 여부 필터 복합 인덱스 (UC-08 BR-10)
CREATE INDEX IF NOT EXISTS idx_todos_user_completed
    ON todos(user_id, is_completed);

-- todos: 기간 필터 복합 인덱스 (UC-08 BR-11)
CREATE INDEX IF NOT EXISTS idx_todos_user_due_date
    ON todos(user_id, due_date)
    WHERE due_date IS NOT NULL;

-- categories: 사용자별 카테고리 조회
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- refresh_tokens: 사용자별 일괄 무효화 · 토큰 해시 검증
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
    ON refresh_tokens(token_hash);

-- ============================================================
-- 3. 기본 카테고리 시드 (BR-04)
-- 모든 사용자에게 공통 제공되는 시스템 카테고리
-- is_default = true, user_id = NULL
-- ============================================================

INSERT INTO categories (name, is_default, user_id) VALUES
    ('업무', true, NULL),
    ('개인', true, NULL),
    ('쇼핑', true, NULL)
ON CONFLICT DO NOTHING;

COMMIT;
