# 프론트엔드 통합 가이드 — TodoListApp

**버전:** 1.0
**작성일:** 2026-05-14
**참조 문서:** `5-arch-diagram.md` v1.3, `6-erd.md` v1.1, `7-execution-plan.md` v1.1

---

## 1. 백엔드 서버 정보

| 항목 | 값 |
|------|-----|
| 로컬 개발 URL | `http://localhost:3000` |
| Swagger UI | `http://localhost:3000/api-docs` |
| CORS 허용 Origin | `http://localhost:5173` (백엔드 `.env`의 `CORS_ALLOWED_ORIGIN`) |
| 인증 방식 | JWT Bearer Token |

---

## 2. 프론트엔드 환경변수 설정

`.env.local` (프로젝트 루트):

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 3. HTTP 클라이언트 구성

`src/shared/api/http-client.ts`에 axios 인스턴스를 생성하고 두 가지 인터셉터를 설정한다.

```typescript
import axios from 'axios';
import { useAuthStore } from '@/features/auth/store/auth-store';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 요청 인터셉터: accessToken 자동 주입
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 수신 시 토큰 재발급 후 재시도
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return httpClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = data;
        useAuthStore.getState().updateTokens(accessToken, newRefreshToken);

        failedQueue.forEach(({ resolve }) => resolve(accessToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return httpClient(originalRequest);
      } catch {
        failedQueue.forEach(({ reject }) => reject(error));
        failedQueue = [];
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
```

---

## 4. 인증 스토어 (Zustand)

토큰은 **메모리(Zustand)에만 저장**한다. localStorage / sessionStorage / cookie 사용 금지.

```typescript
// src/features/auth/store/auth-store.ts
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  updateTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),
  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
```

---

## 5. 인증 API

### 5-1. 회원가입

```
POST /api/auth/register
```

**요청 Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**성공 응답 (201):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "created_at": "2026-05-14T00:00:00.000Z"
  }
}
```

**에러 응답:**
- `400 VALIDATION_ERROR` — 필수 필드 누락
- `409 EMAIL_ALREADY_EXISTS` — 중복 이메일

**프론트엔드 처리:** 응답의 `accessToken`, `refreshToken`, `user`를 `setAuth()`로 저장 후 `/todos`로 navigate.

---

### 5-2. 로그인

```
POST /api/auth/login
```

**요청 Body:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**성공 응답 (200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "홍길동", "created_at": "..." }
}
```

**에러 응답:**
- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS`

---

### 5-3. 로그아웃

```
POST /api/auth/logout
```

**요청 Body:**
```json
{ "refreshToken": "eyJ..." }
```

**성공 응답 (200):**
```json
{ "message": "로그아웃 되었습니다." }
```

**프론트엔드 처리:** API 호출 후 `clearAuth()` 실행, `/login`으로 navigate.

---

### 5-4. 토큰 재발급 (Token Rotation)

```
POST /api/auth/refresh
```

**요청 Body:**
```json
{ "refreshToken": "eyJ..." }
```

**성공 응답 (200):**
```json
{
  "accessToken": "eyJ...(새 액세스 토큰)",
  "refreshToken": "eyJ...(새 리프레시 토큰)"
}
```

**에러 응답:**
- `401 INVALID_REFRESH_TOKEN` — 만료되거나 무효한 토큰

> **Token Rotation:** 재발급 시 기존 refreshToken은 즉시 무효화된다. 응답의 새 `accessToken`과 `refreshToken` 모두 `updateTokens()`로 교체해야 한다.

---

## 6. 사용자 API

모든 엔드포인트에 `Authorization: Bearer <accessToken>` 헤더 필요.

### 6-1. 내 정보 조회

```
GET /api/users/me
```

**성공 응답 (200):**
```json
{ "id": "uuid", "email": "user@example.com", "name": "홍길동", "created_at": "..." }
```

### 6-2. 내 정보 수정

```
PATCH /api/users/me
```

**요청 Body (변경할 항목만 포함):**
```json
{
  "name": "새이름"
}
```

비밀번호 변경 시:
```json
{
  "currentPassword": "password123",
  "password": "newpassword456"
}
```

**성공 응답 (200):** 수정된 User 객체 (`password_hash` 필드 미포함)

**에러 응답:**
- `401 INVALID_PASSWORD` — 현재 비밀번호 불일치

### 6-3. 회원 탈퇴

```
DELETE /api/users/me
```

**성공 응답 (204 No Content)**

**프론트엔드 처리:** 응답 후 `clearAuth()`, `/login` navigate.

---

## 7. 카테고리 API

모든 엔드포인트에 `Authorization: Bearer <accessToken>` 헤더 필요.

### 7-1. 카테고리 목록 조회

```
GET /api/categories
```

**성공 응답 (200):**
```json
{
  "categories": [
    { "id": "uuid", "name": "업무", "is_default": true, "user_id": null, "created_at": "..." },
    { "id": "uuid", "name": "개인", "is_default": true, "user_id": null, "created_at": "..." },
    { "id": "uuid", "name": "쇼핑", "is_default": true, "user_id": null, "created_at": "..." },
    { "id": "uuid", "name": "내 카테고리", "is_default": false, "user_id": "uuid", "created_at": "..." }
  ]
}
```

> 기본 카테고리(시스템 제공)는 `is_default: true`, `user_id: null`이다.

### 7-2. 카테고리 생성

```
POST /api/categories
```

**요청 Body:**
```json
{ "name": "운동" }
```

**성공 응답 (201):**
```json
{ "category": { "id": "uuid", "name": "운동", "is_default": false, "user_id": "uuid", "created_at": "..." } }
```

### 7-3. 카테고리 수정

```
PATCH /api/categories/:id
```

**요청 Body:**
```json
{ "name": "새 이름" }
```

**에러 응답:**
- `403 CANNOT_MODIFY_DEFAULT` — 기본 카테고리 수정 불가
- `404 CATEGORY_NOT_FOUND`

### 7-4. 카테고리 삭제

```
DELETE /api/categories/:id
```

**성공 응답 (204 No Content)**

> 삭제 시 해당 카테고리의 할일들은 자동으로 첫 번째 기본 카테고리로 재배정된다. (백엔드 트랜잭션 처리)

**에러 응답:**
- `403 CANNOT_DELETE_DEFAULT` — 기본 카테고리 삭제 불가
- `404 CATEGORY_NOT_FOUND`

---

## 8. 할일 API

모든 엔드포인트에 `Authorization: Bearer <accessToken>` 헤더 필요.

### 8-1. 할일 목록 조회

```
GET /api/todos
```

**쿼리 파라미터 (모두 선택):**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `category_id` | string (UUID) | 카테고리 필터 |
| `is_completed` | boolean | 완료 여부 필터 |
| `due_date_from` | date (YYYY-MM-DD) | 마감일 시작 |
| `due_date_to` | date (YYYY-MM-DD) | 마감일 종료 |

**성공 응답 (200):**
```json
{
  "todos": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "category_id": "uuid",
      "title": "장보기",
      "description": "우유, 계란",
      "is_completed": false,
      "due_date": "2026-05-20",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### 8-2. 할일 생성

```
POST /api/todos
```

**요청 Body:**
```json
{
  "title": "장보기",
  "description": "우유, 계란",
  "due_date": "2026-05-20",
  "category_id": "uuid"
}
```

> `category_id` 미입력 시 첫 번째 기본 카테고리에 자동 배정된다.

**성공 응답 (201):**
```json
{ "todo": { ...Todo 객체 } }
```

### 8-3. 할일 수정

```
PATCH /api/todos/:id
```

**요청 Body (변경할 항목만):**
```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "due_date": "2026-05-25",
  "category_id": "uuid"
}
```

**성공 응답 (200):** `{ "todo": { ...수정된 Todo 객체 } }`

### 8-4. 할일 완료 토글

```
PATCH /api/todos/:id/toggle
```

요청 Body 없음. `is_completed` 값을 반전시킨다. 레코드는 삭제되지 않는다.

**성공 응답 (200):** `{ "todo": { ...토글된 Todo 객체 } }`

### 8-5. 할일 삭제

```
DELETE /api/todos/:id
```

**성공 응답 (204 No Content)**

---

## 9. 공통 에러 응답 형식

모든 에러 응답은 아래 형식을 따른다:

```json
{
  "error": {
    "code": "에러_코드",
    "message": "사람이 읽을 수 있는 메시지"
  }
}
```

**주요 에러 코드:**

| HTTP 상태 | code | 설명 |
|-----------|------|------|
| 400 | `VALIDATION_ERROR` | 필수 필드 누락 또는 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |
| 401 | `TOKEN_EXPIRED` | Access Token 만료 (재발급 트리거) |
| 401 | `INVALID_CREDENTIALS` | 이메일/비밀번호 불일치 |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh Token 무효 또는 만료 |
| 401 | `INVALID_PASSWORD` | 현재 비밀번호 불일치 |
| 403 | `CANNOT_MODIFY_DEFAULT` | 기본 카테고리 수정 시도 |
| 403 | `CANNOT_DELETE_DEFAULT` | 기본 카테고리 삭제 시도 |
| 404 | `CATEGORY_NOT_FOUND` | 카테고리 없음 또는 권한 없음 |
| 404 | `TODO_NOT_FOUND` | 할일 없음 또는 권한 없음 |
| 409 | `EMAIL_ALREADY_EXISTS` | 중복 이메일 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 내부 오류 |

---

## 10. 토큰 생명주기

| 토큰 | 유효 시간 | 저장 위치 |
|------|-----------|-----------|
| Access Token | 1시간 | Zustand 메모리 |
| Refresh Token | 7일 | Zustand 메모리 |

- **페이지 새로고침 시 토큰 소실** — 재로그인 필요. 로그인 상태 유지가 필요하면 별도 정책 논의 필요.
- **Token Rotation** — Refresh Token 사용 시 새 Refresh Token을 발급받아 기존 것을 폐기한다.
- **동시 401 처리** — 여러 요청이 동시에 401을 받을 경우 재발급 요청은 1회만 보내고 나머지 요청은 큐에서 대기한다 (위 http-client 코드의 `isRefreshing` 플래그 참고).

---

## 11. 데이터 타입 참조

```typescript
interface User {
  id: string;           // UUID
  email: string;
  name: string;
  created_at: string;   // ISO 8601
}

interface Category {
  id: string;           // UUID
  name: string;
  is_default: boolean;
  user_id: string | null;  // null이면 시스템 기본 카테고리
  created_at: string;
}

interface Todo {
  id: string;           // UUID
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;  // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}
```

---

*본 문서는 `backend/swagger/swagger.json` 및 실제 구현 코드를 기준으로 작성되었다.*
