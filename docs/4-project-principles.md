# 구조 설계 원칙 — TodoListApp

**버전:** 1.0
**작성일:** 2026-05-13
**참조 문서:** `2-prd.md` v1.1

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-13 | kimhj | 최초 작성 |

---

## 1. 공통 최상위 원칙

본 절은 프론트엔드와 백엔드 모두에 공통으로 적용되는 설계 철학을 정의한다.

### 1.1 단일 책임 원칙 (Single Responsibility)

- 하나의 모듈, 함수, 클래스는 하나의 책임만 가진다.
- 인증 로직, 데이터 접근 로직, 비즈니스 규칙 로직을 같은 파일에 혼합하지 않는다.
- 함수 하나는 하나의 작업을 수행한다. 두 가지 이상의 작업을 수행하는 함수는 분리한다.

### 1.2 관심사 분리 (Separation of Concerns)

- UI 렌더링, 서버 상태 관리, 전역 클라이언트 상태, API 통신은 각각 독립적인 레이어에서 처리한다.
- 백엔드에서 HTTP 요청 파싱, 비즈니스 규칙 검증, 데이터베이스 접근은 별도 레이어에서 처리한다.
- 도메인 정의서의 Identity & Access 컨텍스트와 Todo Management 컨텍스트 경계를 코드 구조에서도 유지한다.

### 1.3 명시적 의존성 (Explicit Dependencies)

- 함수와 모듈이 필요로 하는 의존성은 매개변수 또는 명시적 import로 전달한다.
- 전역 변수나 암묵적 공유 상태를 통한 의존성 주입을 사용하지 않는다.
- 레이어 간 의존성 방향은 단방향으로 유지하며, 역방향 의존을 허용하지 않는다.

### 1.4 불변 비즈니스 규칙 준수

- 도메인 정의서(`1-domain-definition.md`) §4의 BR-01 ~ BR-11은 반드시 서버 사이드에서 강제한다.
- 클라이언트 사이드 검증은 UX 보조 수단으로 사용하며, 서버 검증을 대체하지 않는다.
- BR-02(본인 데이터만 접근)는 모든 조회·수정·삭제 쿼리에 `user_id` 조건을 포함하여 보장한다.

### 1.5 데이터 격리 원칙

- 모든 사용자 데이터는 `user_id`로 격리한다. 타인의 데이터는 API 응답에 포함되지 않는다.
- 인증 컨텍스트가 할일 관리 컨텍스트에 `user_id`만을 제공하며, User 엔티티의 내부 상세 정보를 직접 전달하지 않는다. [도메인 정의서 §6]

---

## 2. 의존성/레이어 원칙

### 2.1 프론트엔드 레이어 구조

프론트엔드는 세 개의 레이어로 구성하며, 상위 레이어는 하위 레이어를 사용하고 역방향 의존은 허용하지 않는다.

```
UI 레이어 (React 컴포넌트)
    ↓
상태/쿼리 레이어 (Zustand Store, TanStack Query)
    ↓
API 클라이언트 레이어 (fetch 함수 모음)
```

- **UI 레이어**: React 컴포넌트가 화면을 렌더링한다. 서버와 직접 통신하지 않는다. 상태/쿼리 레이어의 훅(hook)만을 호출한다.
- **상태/쿼리 레이어**: Zustand는 인증 상태(Access Token, 사용자 정보)와 같은 전역 클라이언트 상태를 관리한다. TanStack Query는 서버 상태(할일 목록, 카테고리 목록)의 캐싱, 갱신, Optimistic Update를 담당한다.
- **API 클라이언트 레이어**: 서버 엔드포인트 호출을 담당하는 순수 함수 모음이다. UI 관련 코드나 상태 관리 코드를 포함하지 않는다.

레이어 간 규칙:
- UI 컴포넌트는 API 클라이언트 함수를 직접 호출하지 않는다.
- TanStack Query의 `queryFn`과 `mutationFn`에서만 API 클라이언트 함수를 호출한다.
- Zustand Store는 API 클라이언트를 직접 호출하지 않는다. 인증 토큰 저장 및 초기화만 담당한다.

### 2.2 백엔드 레이어 구조

백엔드는 다섯 개의 레이어로 구성하며, 각 레이어는 인접한 레이어만 호출한다.

```
Router 레이어 (Express Router)
    ↓
Controller 레이어
    ↓
Service 레이어
    ↓
Repository 레이어
    ↓
Database (PostgreSQL 17 / pg)
```

- **Router 레이어**: HTTP 메서드와 경로를 정의한다. 인증 미들웨어를 연결하고 요청을 Controller로 전달한다. 비즈니스 로직을 포함하지 않는다.
- **Controller 레이어**: 요청 바디와 파라미터를 파싱하고 유효성 검증을 수행한다. Service를 호출하고 HTTP 응답 형식으로 변환하여 반환한다. 데이터베이스 쿼리를 직접 실행하지 않는다.
- **Service 레이어**: 비즈니스 규칙(BR-01 ~ BR-11)을 구현한다. Repository를 호출하여 데이터를 읽고 쓴다. HTTP 컨텍스트(req, res)를 알지 못한다.
- **Repository 레이어**: `pg` 라이브러리를 사용하여 SQL 쿼리를 실행하는 유일한 레이어이다. 비즈니스 규칙을 포함하지 않으며 데이터 접근만 담당한다.
- **Database**: PostgreSQL 17이다. Repository 외 다른 레이어에서 직접 접근하지 않는다.

레이어 간 규칙:
- Controller는 Repository를 직접 호출하지 않는다.
- Service는 다른 Service를 호출할 수 있으나, Controller나 Router를 호출하지 않는다.
- Repository는 다른 Repository를 호출하지 않는다. 트랜잭션이 필요한 경우 Service에서 pg 클라이언트를 전달하는 방식을 사용한다.

---

## 3. 코드/네이밍 원칙

### 3.1 파일명 컨벤션

- 모든 파일명은 `kebab-case`를 사용한다.
  - 예: `auth-controller.ts`, `todo-repository.ts`, `use-todo-list.ts`
- React 컴포넌트 파일명은 `PascalCase`를 사용한다.
  - 예: `TodoItem.tsx`, `CategoryFilter.tsx`
- 테스트 파일은 대상 파일명에 `.test.ts` 또는 `.test.tsx` 접미사를 붙인다.
  - 예: `auth-service.test.ts`, `TodoItem.test.tsx`

### 3.2 변수명 및 함수명 컨벤션

- 변수명과 함수명은 `camelCase`를 사용한다.
  - 예: `userId`, `categoryId`, `getTodoById`, `toggleCompletion`
- 상수(변경되지 않는 값)는 `SCREAMING_SNAKE_CASE`를 사용한다.
  - 예: `ACCESS_TOKEN_EXPIRES_IN`, `DEFAULT_CATEGORY_ID`
- Boolean 변수와 반환값이 Boolean인 함수는 `is`, `has`, `can` 접두사를 사용한다.
  - 예: `isCompleted`, `isDefault`, `hasPermission`, `canDelete`
- 데이터베이스 컬럼명과 엔티티 속성은 도메인 정의서(`1-domain-definition.md`) §3.1의 정의를 따른다.
  - DB 컬럼: `snake_case` (예: `user_id`, `is_completed`, `due_date`)
  - TypeScript 객체 속성: `camelCase` (예: `userId`, `isCompleted`, `dueDate`)

### 3.3 TypeScript 타입 정의 원칙

- 타입과 인터페이스는 `PascalCase`를 사용한다.
  - 예: `Todo`, `Category`, `CreateTodoRequest`, `ApiErrorResponse`
- API 요청/응답 타입은 `Request` / `Response` 접미사로 구분한다.
  - 예: `CreateTodoRequest`, `UpdateCategoryRequest`, `GetTodosResponse`
- `any` 타입을 사용하지 않는다. 타입을 알 수 없는 경우 `unknown`을 사용하고 타입 가드를 적용한다.
- 도메인 엔티티 타입은 별도 파일에 정의하고 전체 프로젝트에서 공유한다.
- 선택적 속성은 `?` 연산자로 표현하며, `null`과 `undefined`를 혼용하지 않는다. 선택적 값의 부재는 `undefined`로 통일한다.

### 3.4 함수 vs 클래스 사용 기준

- 백엔드 Service와 Repository는 함수 기반으로 작성한다. 클래스 기반 Service/Repository를 사용하지 않는다.
- 프론트엔드 React 컴포넌트는 함수형 컴포넌트(Function Component)로 작성한다. 클래스형 컴포넌트를 사용하지 않는다.
- Express 미들웨어와 핸들러는 함수로 작성한다.
- 상태를 내부에 보유해야 하는 특수한 경우(예: DB 연결 풀 관리)에만 클래스 사용을 허용한다.

### 3.5 비동기 처리 패턴

- 모든 비동기 처리는 `async/await`를 사용한다. `.then().catch()` 체이닝 방식을 사용하지 않는다.
- 비동기 함수에서 발생하는 오류는 `try/catch` 블록으로 처리하거나, Express 오류 처리 미들웨어로 전파한다.
- 백엔드 Controller에서 `async` 함수의 오류를 `next(error)`로 Express 오류 핸들러에 전달한다.
- 프론트엔드에서 TanStack Query의 `queryFn`과 `mutationFn` 내부에서 발생한 오류는 TanStack Query의 오류 처리 메커니즘에 위임한다.

---

## 4. 테스트/품질 원칙

### 4.1 테스트 전략

- 단위 테스트, 통합 테스트, E2E 테스트 세 단계로 구성한다.
- **단위 테스트**: 개별 함수와 모듈의 비즈니스 로직을 검증한다. 외부 의존성(DB, 네트워크)은 모킹(mocking)한다.
- **통합 테스트**: API 엔드포인트 단위로 실제 DB와 연결하여 요청-응답 흐름 전체를 검증한다. 인증 흐름, 비즈니스 규칙 시행 여부를 포함한다.
- **E2E 테스트**: 사용자 시나리오(`3-user-scenario.md`)의 핵심 흐름을 브라우저 수준에서 검증한다. MVP 범위에서는 인증(UC-01, UC-02)과 핵심 CRUD(UC-07, UC-08, UC-11)를 최소 커버한다.

### 4.2 프론트엔드 테스트

- **테스트 도구**: Vitest(테스트 러너) + React Testing Library(컴포넌트 테스트)
- **단위 테스트 대상**: Zustand Store의 액션 및 상태 변이, API 클라이언트 함수, 커스텀 훅(hook)의 로직
- **컴포넌트 테스트 대상**: 사용자 인터랙션(버튼 클릭, 폼 제출)에 따른 렌더링 변화, 오류 상태 및 빈 상태 UI
- 구현 세부 사항이 아닌 사용자 행동 관점으로 테스트를 작성한다. DOM 구조보다 텍스트, 역할(role), 레이블을 기준으로 요소를 선택한다.

### 4.3 백엔드 테스트

- **테스트 도구**: Jest(테스트 러너) + Supertest(HTTP 통합 테스트)
- **단위 테스트 대상**: Service 레이어의 비즈니스 규칙 함수, Repository 레이어의 SQL 쿼리 빌딩 로직
- **통합 테스트 대상**: 각 API 엔드포인트의 정상 흐름과 예외 흐름, 인증 미들웨어 동작, BR-01/02 데이터 격리 검증
- 인증이 필요한 엔드포인트는 유효한 토큰과 만료된 토큰 모두를 테스트한다.
- 데이터 격리 규칙(BR-02)은 사용자 A의 토큰으로 사용자 B의 데이터에 접근 시 403 응답이 반환됨을 검증한다.

### 4.4 커버리지 기준

- 백엔드 Service 레이어 단위 테스트 커버리지: 80% 이상을 유지한다.
- 백엔드 API 통합 테스트: `99-uc.md`의 UC-01 ~ UC-12에 정의된 기본 흐름과 주요 예외 흐름을 모두 커버한다.
- 프론트엔드 커버리지: 커스텀 훅과 Zustand Store 80% 이상, 컴포넌트는 인터랙션이 있는 핵심 컴포넌트 위주로 작성한다.
- 커버리지 수치보다 비즈니스 규칙(BR)별 시나리오 커버를 우선한다.

---

## 5. 설정/보안/운영 원칙

### 5.1 환경변수 관리

- 모든 환경 의존적 설정값은 `.env` 파일로 관리하며, 코드 내 하드코딩을 허용하지 않는다.
- `.env` 파일은 버전 관리(git)에 포함하지 않는다. `.env.example` 파일에 키 목록만 커밋한다.
- 환경변수 파일 구조는 아래와 같이 구성한다.

**백엔드 `.env` 키 목록:**

```
# 서버
PORT=

# 데이터베이스
DATABASE_URL=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

# JWT
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

# 환경 구분
NODE_ENV=
```

**프론트엔드 `.env` 키 목록 (Vite 기준):**

```
VITE_API_BASE_URL=
```

- 애플리케이션 시작 시점에 필수 환경변수 존재 여부를 검증하고, 누락된 경우 즉시 프로세스를 종료한다.

### 5.2 보안 원칙

**SQL Injection 방지:**
- `pg` 라이브러리의 파라미터 바인딩(`$1, $2, ...`) 방식만을 사용하여 쿼리를 실행한다.
- 사용자 입력값을 SQL 문자열에 직접 삽입하지 않는다. [PRD §9]

**토큰 저장:**
- Access Token과 Refresh Token 모두 Zustand 메모리 상태에만 보관한다. `localStorage`나 `sessionStorage`에 저장하지 않는다. [PRD §3]
- 메모리 저장 방식이므로 페이지 새로고침 시 토큰이 소멸하고 재로그인이 필요하다. 이는 의도된 동작이다.

**JWT 관리:**
- Access Token 만료 시간은 1시간으로 설정한다.
- Refresh Token 만료 시간은 7일로 설정하며, `refresh_tokens` 테이블에서 서버 사이드 무효화를 지원한다.
- 로그아웃(UC-02a) 및 비밀번호 변경(UC-03) 시 해당 사용자의 모든 Refresh Token을 서버 DB에서 즉시 무효화한다. [PRD §9]
- Access Token 검증은 서명(signature) 및 만료 시간(exp)을 반드시 확인한다.

**bcrypt 정책:**
- 비밀번호는 bcrypt로 해시하여 저장한다. salt rounds는 10 이상으로 설정한다. [PRD §9]
- 비밀번호 비교는 `bcrypt.compare()`를 사용한다. 해시값을 직접 비교하지 않는다.

**입력 검증:**
- 모든 API 요청의 바디, 파라미터, 쿼리스트링에 대해 서버 사이드 유효성 검증을 수행한다.
- 유효성 검증 실패 시 400 Bad Request를 반환한다.

### 5.3 API 오류 응답 형식

모든 API 오류 응답은 아래 형식으로 통일한다. [PRD §6]

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 오류 메시지"
  }
}
```

- `code`: 오류 종류를 식별하는 문자열 상수. `SCREAMING_SNAKE_CASE`를 사용한다.
  - 예: `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TODO_NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`
- `message`: 클라이언트가 표시할 수 있는 한국어 오류 설명.
- HTTP 상태 코드와 `error.code`는 반드시 일치하는 의미를 가진다.

| HTTP 상태 코드 | 사용 상황 |
|----------------|-----------|
| 400 Bad Request | 요청 형식 오류, 유효성 검증 실패 |
| 401 Unauthorized | 인증 토큰 없음, 토큰 만료, 토큰 무효 |
| 403 Forbidden | 인증은 되었으나 해당 리소스 접근 권한 없음 (BR-02) |
| 404 Not Found | 리소스 미존재 |
| 409 Conflict | 중복 리소스 (예: 이메일 중복) |
| 500 Internal Server Error | 서버 내부 오류 |

### 5.4 로깅 원칙

- 로그는 구조화된 JSON 형식으로 출력한다.
- 각 로그 항목에는 최소한 아래 필드를 포함한다: `timestamp`, `level`, `message`, `requestId`
- 인증된 요청의 경우 `userId`를 로그에 포함한다.
- 비밀번호, Access Token, Refresh Token 원문 등 민감한 정보는 로그에 포함하지 않는다.
- 로그 레벨 기준:
  - `error`: 처리되지 않은 예외, 서버 오류 (5xx)
  - `warn`: 예측 가능한 클라이언트 오류 (4xx), 비즈니스 규칙 위반 시도
  - `info`: 요청 수신/완료, 인증 이벤트 (로그인, 로그아웃, 토큰 재발급)
  - `debug`: 개발 환경 전용 상세 정보 (SQL 쿼리 등)

---

## 6. 프론트엔드 디렉토리 구조

### 6.1 구조 선택 근거

**Feature 기반 구조**를 채택한다.

TodoListApp은 도메인 정의서(`1-domain-definition.md`) §6에 정의된 두 개의 Bounded Context(Identity & Access, Todo Management)를 가진다. 기능 단위로 코드를 묶으면 각 컨텍스트의 경계가 디렉토리 구조에 반영되어 변경 영향 범위를 파악하기 쉽다. Layer 기반 구조는 기능이 분산되어 관련 코드를 추적하는 비용이 크다. MVP 규모에서도 auth, category, todo 세 도메인이 명확하게 분리되므로 Feature 기반 구조가 적합하다.

### 6.2 디렉토리 트리

```
src/
├── app/                          # 앱 전역 설정
│   ├── App.tsx                   # 루트 컴포넌트, 라우팅 정의
│   ├── router.tsx                # React Router 라우트 정의
│   └── queryClient.ts            # TanStack Query QueryClient 인스턴스
│
├── features/                     # 기능(도메인) 단위 모듈
│   ├── auth/                     # Identity & Access 컨텍스트
│   │   ├── api/                  # 인증 관련 API 클라이언트 함수
│   │   │   └── auth-api.ts
│   │   ├── components/           # 인증 화면 전용 컴포넌트
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProfileEditForm.tsx
│   │   ├── hooks/                # 인증 관련 커스텀 훅 (TanStack Query)
│   │   │   ├── use-login.ts
│   │   │   ├── use-register.ts
│   │   │   └── use-token-refresh.ts
│   │   ├── store/                # Zustand 인증 전역 상태
│   │   │   └── auth-store.ts
│   │   ├── types/                # 인증 도메인 타입 정의
│   │   │   └── auth-types.ts
│   │   └── pages/                # 인증 관련 페이지 컴포넌트
│   │       ├── LoginPage.tsx
│   │       └── RegisterPage.tsx
│   │
│   ├── category/                 # 카테고리 관리 컨텍스트
│   │   ├── api/
│   │   │   └── category-api.ts
│   │   ├── components/
│   │   │   ├── CategoryList.tsx
│   │   │   ├── CategoryItem.tsx
│   │   │   └── CategoryForm.tsx
│   │   ├── hooks/
│   │   │   ├── use-categories.ts
│   │   │   ├── use-create-category.ts
│   │   │   └── use-delete-category.ts
│   │   └── types/
│   │       └── category-types.ts
│   │
│   └── todo/                     # 할일 관리 컨텍스트
│       ├── api/
│       │   └── todo-api.ts
│       ├── components/
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   ├── TodoForm.tsx
│       │   └── TodoFilter.tsx
│       ├── hooks/
│       │   ├── use-todos.ts
│       │   ├── use-create-todo.ts
│       │   ├── use-update-todo.ts
│       │   ├── use-toggle-todo.ts
│       │   └── use-delete-todo.ts
│       ├── pages/
│       │   └── TodoListPage.tsx
│       └── types/
│           └── todo-types.ts
│
├── shared/                       # 기능 간 공유 모듈
│   ├── api/                      # 공통 API 유틸리티
│   │   └── http-client.ts        # fetch 래퍼, Authorization 헤더 주입, 401 인터셉트
│   ├── components/               # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ErrorMessage.tsx
│   ├── types/                    # 전역 공통 타입
│   │   └── common-types.ts       # ApiErrorResponse 등
│   └── utils/                    # 공통 유틸리티 함수
│       └── date-utils.ts
│
└── main.tsx                      # 애플리케이션 진입점
```

### 6.3 각 디렉토리 역할

| 디렉토리 | 역할 |
|----------|------|
| `app/` | 전역 라우팅 설정, QueryClient 인스턴스 생성 등 앱 초기화 로직 |
| `features/{domain}/api/` | 해당 도메인의 API 엔드포인트 호출 함수. `shared/api/http-client.ts`를 사용한다. |
| `features/{domain}/components/` | 해당 도메인에서만 사용하는 React 컴포넌트 |
| `features/{domain}/hooks/` | TanStack Query의 `useQuery`, `useMutation`을 감싸는 커스텀 훅 |
| `features/{domain}/store/` | Zustand Store. 인증 도메인에만 존재하며, 서버 상태는 TanStack Query가 담당한다. |
| `features/{domain}/types/` | 해당 도메인의 TypeScript 타입 정의 |
| `features/{domain}/pages/` | 라우트와 1:1 대응하는 페이지 컴포넌트 |
| `shared/api/http-client.ts` | `Authorization: Bearer` 헤더 주입, 401 응답 시 토큰 재발급(UC-02b) 처리 |
| `shared/components/` | 특정 도메인에 종속되지 않는 재사용 가능한 UI 컴포넌트 |
| `shared/types/` | `ApiErrorResponse` 등 프로젝트 전체에서 공유하는 타입 |

---

## 7. 백엔드 디렉토리 구조

### 7.1 구조 선택 근거

**레이어 기반 구조**를 채택한다.

백엔드는 HTTP 요청 처리부터 DB 접근까지 명확한 수직적 레이어(Router → Controller → Service → Repository → DB)를 가진다. 레이어 기반 구조는 각 레이어의 책임을 강제하고 역방향 의존을 방지하는 데 효과적이다. 도메인 구분은 각 레이어 내부에서 파일명으로 표현한다.

### 7.2 디렉토리 트리

```
src/
├── app.ts                        # Express 앱 인스턴스 생성, 미들웨어 등록
├── server.ts                     # HTTP 서버 시작 진입점
│
├── config/                       # 환경변수 로드 및 검증
│   ├── env.ts                    # 환경변수 파싱 및 필수값 검증
│   └── db.ts                     # pg Pool 인스턴스 생성 및 export
│
├── routes/                       # Router 레이어: 경로 및 미들웨어 연결
│   ├── index.ts                  # 전체 라우터 통합 (/api 마운트)
│   ├── auth-routes.ts            # /api/auth
│   ├── user-routes.ts            # /api/users/me
│   ├── category-routes.ts        # /api/categories
│   └── todo-routes.ts            # /api/todos
│
├── controllers/                  # Controller 레이어: 요청 파싱, 유효성 검증, 응답 변환
│   ├── auth-controller.ts
│   ├── user-controller.ts
│   ├── category-controller.ts
│   └── todo-controller.ts
│
├── services/                     # Service 레이어: 비즈니스 규칙 구현
│   ├── auth-service.ts           # UC-01, UC-02, UC-02a, UC-02b 비즈니스 로직
│   ├── user-service.ts           # UC-03, UC-12 비즈니스 로직
│   ├── category-service.ts       # UC-04, UC-05, UC-06 비즈니스 로직
│   └── todo-service.ts           # UC-07, UC-08, UC-09, UC-10, UC-11 비즈니스 로직
│
├── repositories/                 # Repository 레이어: pg를 이용한 SQL 실행
│   ├── user-repository.ts
│   ├── refresh-token-repository.ts
│   ├── category-repository.ts
│   └── todo-repository.ts
│
├── middlewares/                  # Express 미들웨어
│   ├── authenticate.ts           # JWT Access Token 검증, req.userId 주입
│   ├── error-handler.ts          # 전역 오류 처리, 표준 오류 응답 형식 반환
│   └── validate-body.ts          # 요청 바디 유효성 검증 미들웨어
│
├── types/                        # 백엔드 전역 타입 정의
│   ├── domain-types.ts           # User, Todo, Category 등 도메인 엔티티 타입
│   ├── request-types.ts          # Controller 입력 타입 (CreateTodoRequest 등)
│   └── express.d.ts              # Express Request 타입 확장 (req.userId 등)
│
└── utils/                        # 공통 유틸리티
    ├── jwt-utils.ts              # JWT 발급 및 검증 함수
    ├── hash-utils.ts             # bcrypt 해시 및 비교 함수
    └── app-error.ts              # 표준 오류 클래스 (code, message, httpStatus 포함)
```

### 7.3 각 디렉토리 역할

| 디렉토리/파일 | 역할 |
|---------------|------|
| `config/env.ts` | 시작 시 필수 환경변수를 검증한다. 누락된 변수가 있으면 프로세스를 종료한다. |
| `config/db.ts` | `pg.Pool` 인스턴스를 싱글턴으로 생성하여 export한다. Repository만 이 인스턴스를 import한다. |
| `routes/` | HTTP 메서드와 경로를 정의하고 `authenticate` 미들웨어를 적용한다. Controller 함수를 핸들러로 등록한다. |
| `controllers/` | `req.body`, `req.params`, `req.query`에서 입력을 추출하고 유효성을 검증한다. Service를 호출하고 결과를 HTTP 응답으로 변환한다. |
| `services/` | BR-01 ~ BR-11의 비즈니스 규칙을 구현한다. 권한 검증(BR-02)은 Service에서 수행하며, HTTP 컨텍스트를 직접 참조하지 않는다. |
| `repositories/` | `pg` 파라미터 바인딩을 사용한 SQL 쿼리만 포함한다. 비즈니스 판단을 하지 않는다. |
| `middlewares/authenticate.ts` | `Authorization: Bearer` 헤더의 Access Token을 검증하고 `req.userId`에 사용자 ID를 주입한다. 토큰이 없거나 유효하지 않으면 401을 반환한다. |
| `middlewares/error-handler.ts` | 모든 오류를 포착하여 §5.3에 정의한 표준 오류 응답 형식으로 변환한다. |
| `utils/app-error.ts` | `code`, `message`, `httpStatus`를 가진 커스텀 오류 클래스. Service에서 생성하여 throw하고 `error-handler`에서 처리한다. |
| `utils/jwt-utils.ts` | Access Token과 Refresh Token 발급 및 검증 함수. 환경변수의 시크릿과 만료 설정을 사용한다. |

---

*본 구조 설계 원칙은 `2-prd.md` v1.1을 기반으로 작성되었으며, 개발 진행에 따라 버전 관리를 통해 업데이트된다.*
