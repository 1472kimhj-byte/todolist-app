import { test, expect } from '@playwright/test';
import { generateTestEmail, TEST_NAME, registerUser } from './helpers/auth-helpers';

async function navigateToProfile(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: TEST_NAME }).click();
  await page.waitForURL('**/profile', { timeout: 5000 });
}

test.describe('UC-12. 회원 탈퇴', () => {
  test('기본 흐름: window.confirm 수락 후 탈퇴 → 로그인 화면으로 이동', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await navigateToProfile(page);

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '회원 탈퇴' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('E2. 탈퇴 취소 (window.confirm 거부): 프로필 화면 유지', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await navigateToProfile(page);

    page.on('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: '회원 탈퇴' }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText('프로필 설정')).toBeVisible();
  });
});
