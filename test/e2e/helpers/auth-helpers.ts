import type { Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:5173';

export function generateTestEmail(): string {
  return `test_${Date.now()}_${Math.floor(Math.random() * 9999)}@e2e.test`;
}

export const TEST_PASSWORD = 'password123';
export const TEST_NAME = 'E2E테스터';

export async function registerUser(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
  name = TEST_NAME,
) {
  await page.goto('/register');
  await page.getByLabel('이름').fill(name);
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByLabel('비밀번호 확인').fill(password);
  await page.getByRole('button', { name: '가입하기' }).click();
  await page.waitForURL('**/todos', { timeout: 10000 });
}

export async function loginUser(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
) {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('**/todos', { timeout: 10000 });
}
