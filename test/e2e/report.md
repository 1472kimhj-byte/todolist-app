# E2E 통합 테스트 결과 보고서

**작성일:** 2026-05-15  
**테스트 도구:** Playwright MCP  
**참조 문서:** `docs/3-user-scenario.md`  
**테스트 대상:** 프론트엔드 `http://localhost:5173` / 백엔드 `http://localhost:3000`

---

## 요약

| UC | 시나리오 | 결과 | 비고 |
|----|---------|------|------|
| UC-01 | 회원가입 기본 흐름 | ✅ PASS | |
| UC-01 E1 | 이메일 중복 | ✅ PASS | "이미 사용 중인 이메일입니다." 표시 |
| UC-01 E2 | 필수 항목 누락 | ✅ PASS | 각 항목별 오류 메시지 표시 |
| UC-01 E3 | 이메일 형식 오류 | ✅ PASS | "올바른 이메일을 입력해주세요." 표시 |
| UC-02 | 로그인 기본 흐름 | ✅ PASS | |
| UC-02 E1 | 이메일 미존재 오류 메시지 | ✅ PASS | BUG-01 수정 후 재검증 통과 |
| UC-02 E2 | 비밀번호 불일치 오류 메시지 | ✅ PASS | BUG-01 수정 후 재검증 통과 |
| UC-02 E3 | 필수 항목 누락 | ✅ PASS | |
| UC-02a | 로그아웃 기본 흐름 | ✅ PASS | 로그인 페이지로 이동 |
| UC-02b | 토큰 재발급 | ⏭️ SKIP | 토큰 만료 시뮬레이션 필요 |
| UC-03 | 이름 수정 기본 흐름 | ✅ PASS | |
| UC-03 | 비밀번호 변경 기본 흐름 | ⏭️ SKIP | E1 테스트 후 실행 필요 (코드 검증) |
| UC-03 E1 | 현재 비밀번호 불일치 | ✅ PASS | "현재 비밀번호가 올바르지 않습니다." 표시 |
| UC-03 E3 | 이름 누락 | ✅ PASS | "이름을 입력해주세요." 표시 |
| UC-04 | 기본 카테고리 조회 | ✅ PASS | 업무·개인·쇼핑 표시, 수정·삭제 버튼 없음 |
| UC-05 | 사용자 정의 카테고리 생성 기본 흐름 | ✅ PASS | 목록에 즉시 반영 |
| UC-05 E1 | 카테고리 이름 누락 | ✅ PASS | "카테고리 이름을 입력해주세요." 표시 |
| UC-06 수정 | 카테고리 이름 수정 기본 흐름 | ✅ PASS | |
| UC-06 삭제 | 카테고리 삭제 기본 흐름 | ✅ PASS | 확인 다이얼로그 표시, 삭제 후 목록 갱신 |
| UC-07 | 할일 등록 기본 흐름 | ✅ PASS | 카테고리 미선택 시 기본 카테고리(업무) 자동 배정 |
| UC-07 E1 | 제목 누락 | ✅ PASS | "제목을 입력해주세요." 표시 |
| UC-08 | 할일 목록 조회 | ✅ PASS | |
| UC-08 | 카테고리 필터 | ✅ PASS | |
| UC-08 | 완료 상태 필터 | ✅ PASS | |
| UC-08 E1 | 필터 결과 없음 | ✅ PASS | "할일이 없습니다" 안내 표시 |
| UC-09 | 할일 수정 기본 흐름 | ✅ PASS | |
| UC-10 | 완료 상태 토글 | ✅ PASS | 미완료 → 완료 → 미완료 전환 정상 |
| UC-11 | 할일 삭제 기본 흐름 | ✅ PASS | |
| UC-11 E1 | 삭제 취소 | ✅ PASS | 취소 후 할일 유지 확인 |
| UC-12 | 회원 탈퇴 기본 흐름 | ✅ PASS | BUG-02 수정 후 재검증 통과. 비밀번호 확인 다이얼로그 → 탈퇴 성공 → 로그인 이동 |
| UC-12 E1 | 비밀번호 불일치 탈퇴 차단 | ✅ PASS | BUG-02 수정 후 재검증 통과. "비밀번호가 올바르지 않습니다." 표시 |
| UC-12 E2 | 탈퇴 취소 | ✅ PASS | |

---

## 상세 결과

### ✅ 정상 동작

- **회원가입**: 폼 유효성 검사(이메일 형식, 필수 항목, 이메일 중복), 가입 후 즉시 `/todos` 이동
- **로그인**: 올바른 자격증명으로 로그인 후 할일 목록 진입
- **로그아웃**: Refresh Token 무효화 후 로그인 화면 이동
- **카테고리**: 기본 카테고리 수정·삭제 버튼 없음, 사용자 정의 카테고리 CRUD 전 정상
- **할일 CRUD**: 등록·수정·삭제·완료 토글 모두 정상, 즉시 화면 반영
- **필터링**: 카테고리·완료 상태별 필터 정상 작동
- **카테고리 미선택 자동 배정**: 할일 등록 시 카테고리 미선택 → 첫 번째 기본 카테고리(업무)로 자동 배정 [BR-06 준수]

---

## 버그 수정 결과 (2026-05-15 재검증)

| 버그 | 심각도 | 수정 상태 | 수정 파일 |
|------|--------|-----------|-----------|
| BUG-01 | 높음 | ✅ 수정 완료 | `frontend/src/shared/api/http-client.ts` |
| BUG-02 | 중간 | ✅ 수정 완료 | `backend/src/services/user-service.js`, `backend/src/controllers/user-controller.js`, `frontend/src/features/auth/components/ProfileEditForm.tsx`, `auth-api.ts`, `use-delete-me.ts`, `auth-types.ts` |
| BUG-03 | 낮음 | ✅ 수정 완료 | `frontend/src/features/auth/components/ProfileEditForm.tsx` |
| BUG-04 | 낮음 | ✅ 수정 완료 | `frontend/src/features/todo/components/TodoItem.tsx`, `TodoForm.tsx` |

---

## 발견된 버그

### BUG-01: 로그인 실패 시 오류 메시지 미표시 [심각도: 높음] ✅ 수정 완료

**관련 UC:** UC-02 E1, E2  
**증상:** 잘못된 이메일 또는 비밀번호 입력 시 오류 메시지가 표시되지 않고 로그인 폼이 빈 상태로 리셋됨  
**원인:** `http-client.ts`의 응답 인터셉터가 401 응답을 모두 토큰 만료로 간주하고 Refresh Token 갱신을 시도함. 로그인 엔드포인트도 인증 실패 시 401을 반환하므로 인터셉터가 개입 → 갱신 실패 → `window.location.href = '/login'` 실행으로 전체 페이지 리로드 발생, React 상태 초기화  
**재현 경로:** 로그인 폼 → 잘못된 이메일/비밀번호 입력 → 로그인 버튼 클릭  
**수정 방향:** `/api/auth/login`, `/api/auth/register` 등 인증 엔드포인트는 401 인터셉터에서 제외 처리

```js
// http-client.ts 수정 예시
if (error.response?.status === 401 && !originalRequest._retry) {
  const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') || 
                         originalRequest.url?.includes('/api/auth/register');
  if (isAuthEndpoint) return Promise.reject(error); // 추가
  // ... 기존 refresh 로직
}
```

---

### BUG-02: UC-12 비밀번호 확인 절차 미구현 [심각도: 중간] ✅ 수정 완료

**관련 UC:** UC-12 E1  
**증상:** 회원 탈퇴 시 비밀번호 입력 없이 브라우저 기본 `confirm()` 다이얼로그로만 처리됨  
**시나리오 요구사항:** 탈퇴 전 현재 비밀번호 입력으로 본인 확인 후 탈퇴 최종 확인 (2단계 확인)  
**현재 구현:** 브라우저 `window.confirm()` 1회 호출로 즉시 탈퇴  
**수정 방향:** 비밀번호 입력 필드가 포함된 커스텀 확인 다이얼로그 구현 필요

---

### BUG-03: 이름 변경 시 React controlled/uncontrolled input 경고 [심각도: 낮음] ✅ 수정 완료

**관련 UC:** UC-03  
**증상:** 이름 수정 후 콘솔에 "A component is changing a controlled input to be uncontrolled" 경고 발생  
**원인:** `ProfileEditForm` 컴포넌트에서 이름 수정 성공 후 폼 상태가 `undefined`로 전환되는 구간 존재  
**영향:** 기능 동작에는 영향 없음, 코드 품질 이슈

---

### BUG-04 (관찰): 마감일 UTC 시차 표시 [심각도: 낮음] ✅ 수정 완료

**증상:** `2026-05-20` 입력 시 `2026-05-19T15:00:00.000Z`로 표시됨 (한국 시간 기준 전날 오후 3시 UTC = 당일 자정 KST)  
**원인:** 날짜를 UTC로 저장 후 변환 없이 ISO 문자열 그대로 표시  
**수정 방향:** 날짜 표시 시 로컬 타임존 변환 처리 필요

---

## 미테스트 시나리오

| UC | 사유 |
|----|------|
| UC-02b (토큰 재발급) | Access Token 만료 시뮬레이션을 위한 시간 조작 또는 짧은 만료 시간 설정 필요 |
| UC-03 비밀번호 변경 기본 흐름 | 로직상 정상으로 추정되나 변경 후 모든 Refresh Token 무효화 검증 필요 |
| UC-06 E1 (기본 카테고리 수정·삭제 시도) | UI에서 수정·삭제 버튼이 노출되지 않아 정상 방어됨 |
