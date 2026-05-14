# 기술 아키텍처 다이어그램 — TodoListApp

**버전:** 1.3  
**작성일:** 2026-05-13  
**참조 문서:** `2-prd.md` v1.1, `4-project-principles.md` v1.0

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.3 | 2026-05-14 | kimhj | §3 토큰 재발급 응답에 refreshToken 추가(Rotation), §1에 /api-docs(Swagger UI) 추가 |
| 1.2 | 2026-05-13 | kimhj | 인증 토큰 저장 방식 변경 — Refresh Token을 httpOnly 쿠키 → Zustand 메모리로 전환, §1·§3 다이어그램 수정 |
| 1.1 | 2026-05-13 | kimhj | §1 Middleware 별도 박스 제거(Router에 통합), §4 USER.display_name → name 수정 |
| 1.0 | 2026-05-13 | kimhj | 최초 작성 |

---

## 1. 전체 시스템 구성 (3계층 아키텍처)

전체 시스템을 클라이언트, 백엔드 API, 데이터베이스 3계층으로 표현한 고수준 개요도입니다.

```mermaid
flowchart LR
    subgraph client["🌐 클라이언트 (브라우저)"]
        react["React 19<br/>Zustand<br/>TanStack Query"]
    end
    
    subgraph backend["🔧 백엔드 (Node.js + Express)"]
        swagger["GET /api-docs<br/>(Swagger UI)"]
        router["Router<br/>(+ Auth Middleware)"]
        controller["Controller"]
        service["Service<br/>(비즈니스 규칙)"]
        repo["Repository<br/>(pg 드라이버)"]
    end
    
    subgraph db["🗄️ 데이터베이스"]
        postgres["PostgreSQL 17<br/>users, categories,<br/>todos, refresh_tokens"]
    end
    
    react -->|"HTTP 요청<br/>(Authorization:<br/>Bearer)"|router
    router -->|"JWT 검증"| controller
    controller --> service
    service --> repo
    repo -->|"SQL 쿼리<br/>(pg 파라미터 바인딩)"| postgres
    postgres -->|"쿼리 결과"| repo
    repo -->|"데이터 반환"| service
    service -->|"응답 DTO"| controller
    controller -->|"JSON 응답<br/>(HTTP 상태 코드)"| router
    router -->|"HTTP 응답<br/>(Access/Refresh<br/>Token)"| react
```

---

## 2. 백엔드 5계층 구조

HTTP 요청부터 데이터베이스 접근까지의 명확한 수직 흐름을 표현한 백엔드 레이어 다이어그램입니다.

```mermaid
flowchart TD
    req["📥 HTTP Request<br/>(POST /api/todos)"]
    
    route["Router<br/>경로/메서드 정의<br/>미들웨어 연결"]
    
    auth["Middleware: Auth<br/>Access Token 검증<br/>req.userId 주입"]
    
    ctrl["Controller<br/>요청 파싱 & 유효성 검증<br/>BR-01~11 전제 검증"]
    
    svc["Service<br/>비즈니스 규칙 구현<br/>데이터 권한 검증 BR-02<br/>카테고리/할일 CRUD 로직"]
    
    repo["Repository<br/>pg 파라미터 바인딩<br/>SQL 실행만 담당"]
    
    pgdb["PostgreSQL<br/>데이터 저장/조회"]
    
    req --> route
    route --> auth
    auth --> ctrl
    ctrl --> svc
    svc --> repo
    repo --> pgdb
    pgdb -->|결과| repo
    repo -->|데이터| svc
    svc -->|응답 DTO| ctrl
    ctrl -->|표준 JSON| route
    route -->|200/400/401/403/409| req
```

---

## 3. JWT 인증 및 토큰 재발급 흐름

로그인(UC-02)과 토큰 재발급(UC-02b)의 전체 시퀀스를 표현한 인증 흐름 다이어그램입니다.

```mermaid
sequenceDiagram
    participant Browser
    participant API as API Server
    participant DB as Database
    
    Browser->>API: POST /api/auth/login<br/>{email, password}
    API->>DB: SELECT user WHERE email=?
    DB-->>API: user record (password_hash)
    API->>API: bcrypt.compare(password, password_hash)
    API->>DB: INSERT INTO refresh_tokens<br/>(user_id, token_hash, expires_at)
    DB-->>API: success
    API-->>Browser: 200 OK<br/>Body: {accessToken, refreshToken, user}
    
    Note over Browser: Access Token · Refresh Token<br/>모두 Zustand 메모리 저장
    
    Browser->>API: GET /api/todos<br/>Authorization: Bearer {accessToken}
    API->>API: JWT 검증 & 서명 확인
    API-->>Browser: 200 OK<br/>{todos: [...]}
    
    Note over Browser: Access Token 만료 (1시간 후)
    
    Browser->>API: GET /api/todos<br/>Authorization: Bearer {expired_token}
    API->>API: 토큰 만료 감지
    API-->>Browser: 401 Unauthorized<br/>{code: "TOKEN_EXPIRED"}
    
    Browser->>API: POST /api/auth/refresh<br/>Body: {refreshToken}
    API->>DB: SELECT FROM refresh_tokens<br/>WHERE user_id=? AND revoked=false
    DB-->>API: token record
    API->>API: Refresh Token 검증 & 만료 확인
    API-->>Browser: 200 OK<br/>{accessToken: new_token,<br/>refreshToken: new_refresh_token}
    
    Note over Browser: 새 Access Token · Refresh Token<br/>모두 Zustand 메모리 갱신 (Token Rotation)
    
    Browser->>API: GET /api/todos<br/>Authorization: Bearer {new_token}
    API-->>Browser: 200 OK<br/>{todos: [...]}
```

---

## 4. 데이터 모델 (Entity Relationship Diagram)

사용자, 카테고리, 할일 세 핵심 엔티티의 관계를 표현한 데이터 모델 다이어그램입니다.

```mermaid
erDiagram
    USER ||--o{ CATEGORY : "1:N<br/>user_id"
    USER ||--o{ TODO : "1:N<br/>user_id"
    CATEGORY ||--o{ TODO : "1:N<br/>category_id<br/>SET DEFAULT"
    
    USER {
        uuid id PK
        string email UK "고유 식별자"
        string password_hash
        string name
        timestamptz created_at
        timestamptz updated_at
    }
    
    CATEGORY {
        uuid id PK
        uuid user_id FK "null = 기본 카테고리"
        string name
        boolean is_default "기본 카테고리 표시"
        timestamptz created_at
    }
    
    TODO {
        uuid id PK
        uuid user_id FK "필수"
        uuid category_id FK "필수"
        string title "필수"
        string description "선택"
        date due_date "선택"
        boolean is_completed "기본값: false"
        timestamptz created_at
        timestamptz updated_at
    }
```

---

*본 아키텍처 다이어그램은 `2-prd.md` v1.1과 `4-project-principles.md` v1.0을 기반으로 작성되었으며, 개발 진행에 따라 버전 관리를 통해 업데이트된다.*
