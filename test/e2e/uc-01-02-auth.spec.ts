import { test, expect } from '@playwright/test';
import { generateTestEmail, TEST_PASSWORD, TEST_NAME, registerUser, loginUser } from './helpers/auth-helpers';

test.describe('UC-01. 회원가입', () => {
  test('기본 흐름: 이메일+비밀번호로 가입 후 할일 목록으로 이동', async ({ page }) => {
    const email = generateTestEmail();
    await page.goto('/register');
    await page.getByLabel('이름').fill(TEST_NAME);
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page).toHaveURL(/\/todos/, { timeout: 10000 });
  });

  test('E1. 이미 사용 중인 이메일로 가입 시도 → 오류 메시지', async ({ page }) => {
    const email = generateTestEmail();
    await registerUser(page, email);

    await page.goto('/register');
    await page.getByLabel('이름').fill(TEST_NAME);
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '가입하기' }).click();
    // ErrorMessage 컴포넌트는 role="alert"
    await expect(page.getByRole('alert')).toContainText('이미 사용 중인 이메일', { timeout: 8000 });
  });

  test('E2. 필수 항목 누락 → 제출 차단', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page.getByText('이름을 입력해주세요')).toBeVisible();
  });

  test('E3. 잘못된 이메일 형식 → 오류 메시지', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('이름').fill(TEST_NAME);
    await page.getByLabel('이메일').fill('invalid-email');
    await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page.getByText('올바른 이메일')).toBeVisible();
  });
});

test.describe('UC-02. 로그인', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    await registerUser(page, testEmail);
    // 인앱 로그아웃 후 로그인 페이지로 이동 (Zustand 상태 유지 경로)
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('기본 흐름: 이메일+비밀번호로 로그인 후 할일 목록으로 이동', async ({ page }) => {
    await page.getByLabel('이메일').fill(testEmail);
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/todos/, { timeout: 10000 });
  });

  test('E1/E2. 잘못된 인증정보 → 오류 메시지', async ({ page }) => {
    await page.getByLabel('이메일').fill(testEmail);
    await page.getByLabel('비밀번호').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();
    // ErrorMessage 컴포넌트는 role="alert"로 렌더링
    await expect(page.getByRole('alert')).toContainText('이메일 또는 비밀번호', { timeout: 8000 });
  });

  test('E3. 이메일 누락 → 제출 차단', async ({ page }) => {
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.getByText('이메일을 입력해주세요')).toBeVisible();
  });
});

test.describe('UC-02a. 로그아웃', () => {
  test('기본 흐름: 로그아웃 후 로그인 화면으로 이동, 인증 상태 초기화', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await expect(page).toHaveURL(/\/todos/);

    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // 다시 /todos 접근 시 로그인 페이지로 리다이렉트 (page.goto는 상태를 초기화하므로 링크 클릭 후 확인)
    await page.goto('/todos');
    await expect(page).toHaveURL(/\/login/);
  });
});
