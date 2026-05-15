# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uc-01-02-auth.spec.ts >> UC-02. 로그인 >> E1/E2. 잘못된 인증정보 → 오류 메시지
- Location: test\e2e\uc-01-02-auth.spec.ts:65:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "이메일 또는 비밀번호"
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 8000ms
  - waiting for getByRole('alert')

```

```yaml
- heading "TodoListApp" [level=1]
- paragraph: 개인 할일 관리 앱
- form "로그인 폼":
  - heading "로그인" [level=2]
  - text: 이메일
  - textbox "이메일":
    - /placeholder: 이메일을 입력하세요
  - text: 비밀번호
  - textbox "비밀번호":
    - /placeholder: 비밀번호를 입력하세요
  - button "로그인"
- paragraph:
  - text: 아직 계정이 없으신가요?
  - link "회원가입":
    - /url: /register
- button "Open Tanstack query devtools":
  - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { generateTestEmail, TEST_PASSWORD, TEST_NAME, registerUser, loginUser } from './helpers/auth-helpers';
  3  | 
  4  | test.describe('UC-01. 회원가입', () => {
  5  |   test('기본 흐름: 이메일+비밀번호로 가입 후 할일 목록으로 이동', async ({ page }) => {
  6  |     const email = generateTestEmail();
  7  |     await page.goto('/register');
  8  |     await page.getByLabel('이름').fill(TEST_NAME);
  9  |     await page.getByLabel('이메일').fill(email);
  10 |     await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
  11 |     await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
  12 |     await page.getByRole('button', { name: '가입하기' }).click();
  13 |     await expect(page).toHaveURL(/\/todos/, { timeout: 10000 });
  14 |   });
  15 | 
  16 |   test('E1. 이미 사용 중인 이메일로 가입 시도 → 오류 메시지', async ({ page }) => {
  17 |     const email = generateTestEmail();
  18 |     await registerUser(page, email);
  19 | 
  20 |     await page.goto('/register');
  21 |     await page.getByLabel('이름').fill(TEST_NAME);
  22 |     await page.getByLabel('이메일').fill(email);
  23 |     await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
  24 |     await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
  25 |     await page.getByRole('button', { name: '가입하기' }).click();
  26 |     // ErrorMessage 컴포넌트는 role="alert"
  27 |     await expect(page.getByRole('alert')).toContainText('이미 사용 중인 이메일', { timeout: 8000 });
  28 |   });
  29 | 
  30 |   test('E2. 필수 항목 누락 → 제출 차단', async ({ page }) => {
  31 |     await page.goto('/register');
  32 |     await page.getByRole('button', { name: '가입하기' }).click();
  33 |     await expect(page.getByText('이름을 입력해주세요')).toBeVisible();
  34 |   });
  35 | 
  36 |   test('E3. 잘못된 이메일 형식 → 오류 메시지', async ({ page }) => {
  37 |     await page.goto('/register');
  38 |     await page.getByLabel('이름').fill(TEST_NAME);
  39 |     await page.getByLabel('이메일').fill('invalid-email');
  40 |     await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
  41 |     await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
  42 |     await page.getByRole('button', { name: '가입하기' }).click();
  43 |     await expect(page.getByText('올바른 이메일')).toBeVisible();
  44 |   });
  45 | });
  46 | 
  47 | test.describe('UC-02. 로그인', () => {
  48 |   let testEmail: string;
  49 | 
  50 |   test.beforeEach(async ({ page }) => {
  51 |     testEmail = generateTestEmail();
  52 |     await registerUser(page, testEmail);
  53 |     // 인앱 로그아웃 후 로그인 페이지로 이동 (Zustand 상태 유지 경로)
  54 |     await page.getByRole('button', { name: '로그아웃' }).click();
  55 |     await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  56 |   });
  57 | 
  58 |   test('기본 흐름: 이메일+비밀번호로 로그인 후 할일 목록으로 이동', async ({ page }) => {
  59 |     await page.getByLabel('이메일').fill(testEmail);
  60 |     await page.getByLabel('비밀번호').fill(TEST_PASSWORD);
  61 |     await page.getByRole('button', { name: '로그인' }).click();
  62 |     await expect(page).toHaveURL(/\/todos/, { timeout: 10000 });
  63 |   });
  64 | 
  65 |   test('E1/E2. 잘못된 인증정보 → 오류 메시지', async ({ page }) => {
  66 |     await page.getByLabel('이메일').fill(testEmail);
  67 |     await page.getByLabel('비밀번호').fill('wrongpassword');
  68 |     await page.getByRole('button', { name: '로그인' }).click();
  69 |     // ErrorMessage 컴포넌트는 role="alert"로 렌더링
> 70 |     await expect(page.getByRole('alert')).toContainText('이메일 또는 비밀번호', { timeout: 8000 });
     |                                           ^ Error: expect(locator).toContainText(expected) failed
  71 |   });
  72 | 
  73 |   test('E3. 이메일 누락 → 제출 차단', async ({ page }) => {
  74 |     await page.getByLabel('비밀번호').fill(TEST_PASSWORD);
  75 |     await page.getByRole('button', { name: '로그인' }).click();
  76 |     await expect(page.getByText('이메일을 입력해주세요')).toBeVisible();
  77 |   });
  78 | });
  79 | 
  80 | test.describe('UC-02a. 로그아웃', () => {
  81 |   test('기본 흐름: 로그아웃 후 로그인 화면으로 이동, 인증 상태 초기화', async ({ page }) => {
  82 |     await registerUser(page, generateTestEmail());
  83 |     await expect(page).toHaveURL(/\/todos/);
  84 | 
  85 |     await page.getByRole('button', { name: '로그아웃' }).click();
  86 |     await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  87 | 
  88 |     // 다시 /todos 접근 시 로그인 페이지로 리다이렉트 (page.goto는 상태를 초기화하므로 링크 클릭 후 확인)
  89 |     await page.goto('/todos');
  90 |     await expect(page).toHaveURL(/\/login/);
  91 |   });
  92 | });
  93 | 
```