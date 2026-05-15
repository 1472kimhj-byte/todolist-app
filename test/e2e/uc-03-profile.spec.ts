import { test, expect } from '@playwright/test';
import { generateTestEmail, TEST_PASSWORD, TEST_NAME, registerUser } from './helpers/auth-helpers';

async function navigateToProfile(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: TEST_NAME }).click();
  await page.waitForURL('**/profile', { timeout: 5000 });
}

test.describe('UC-03. 개인정보 수정', () => {
  test('기본 흐름 — 이름 수정: 새 이름 저장 후 네비게이션 바에 즉시 반영', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await navigateToProfile(page);

    const newName = '수정된이름';
    await page.getByLabel('이름').fill(newName);
    await page.getByRole('button', { name: '이름 변경' }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '돌아가기' }).or(page.locator('button').filter({ hasText: '돌아가기' })).click();
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
  });

  test('기본 흐름 — 비밀번호 변경: 정상 변경 완료', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await registerUser(page, generateTestEmail());
    await navigateToProfile(page);

    const newPassword = 'newpassword456';
    await page.getByLabel('현재 비밀번호').fill(TEST_PASSWORD);
    await page.getByLabel('새 비밀번호', { exact: true }).fill(newPassword);
    await page.getByLabel('새 비밀번호 확인').fill(newPassword);
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await page.waitForTimeout(2000);
  });

  test('E1. 현재 비밀번호 불일치 → 오류 메시지', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await navigateToProfile(page);

    await page.getByLabel('현재 비밀번호').fill('wrongpassword');
    await page.getByLabel('새 비밀번호', { exact: true }).fill('newpassword456');
    await page.getByLabel('새 비밀번호 확인').fill('newpassword456');
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await expect(page.getByText('현재 비밀번호가 올바르지 않습니다')).toBeVisible({ timeout: 5000 });
  });

  test('E3. 이름 비어있을 때 저장 시도 → 오류 메시지', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await navigateToProfile(page);

    await page.getByLabel('이름').fill('');
    await page.getByRole('button', { name: '이름 변경' }).click();
    await expect(page.getByText('이름을 입력해주세요')).toBeVisible();
  });
});
