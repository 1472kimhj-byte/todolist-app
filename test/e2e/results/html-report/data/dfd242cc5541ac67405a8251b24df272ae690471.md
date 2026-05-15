# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uc-03-profile.spec.ts >> UC-03. 개인정보 수정 >> 기본 흐름 — 이름 수정: 새 이름 저장 후 네비게이션 바에 즉시 반영
- Location: test\e2e\uc-03-profile.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('수정된이름')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('수정된이름')

```

```yaml
- navigation "메인 네비게이션":
  - text: TodoListApp
  - button "다크 모드로 전환"
  - link "프로필":
    - /url: /profile
  - button "로그아웃"
- complementary:
  - text: 카테고리
  - button "+ 추가"
  - button "전체" [pressed]
  - button "업무 선택": 업무
  - button "개인 선택": 개인
  - button "쇼핑 선택": 쇼핑
- main:
  - button "전체" [pressed]
  - button "미완료"
  - button "완료"
  - combobox "카테고리 필터":
    - option "전체 카테고리" [selected]
    - option "업무"
    - option "개인"
    - option "쇼핑"
  - button "할일 추가": + 추가
  - img
  - paragraph: 할일이 없습니다
  - paragraph: 새 할일을 추가해 보세요.
- button "Open Tanstack query devtools":
  - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { generateTestEmail, TEST_PASSWORD, TEST_NAME, registerUser } from './helpers/auth-helpers';
  3  | 
  4  | async function navigateToProfile(page: import('@playwright/test').Page) {
  5  |   await page.getByRole('link', { name: TEST_NAME }).click();
  6  |   await page.waitForURL('**/profile', { timeout: 5000 });
  7  | }
  8  | 
  9  | test.describe('UC-03. 개인정보 수정', () => {
  10 |   test('기본 흐름 — 이름 수정: 새 이름 저장 후 네비게이션 바에 즉시 반영', async ({ page }) => {
  11 |     await registerUser(page, generateTestEmail());
  12 |     await navigateToProfile(page);
  13 | 
  14 |     const newName = '수정된이름';
  15 |     await page.getByLabel('이름').fill(newName);
  16 |     await page.getByRole('button', { name: '이름 변경' }).click();
  17 |     await page.waitForTimeout(1000);
  18 | 
  19 |     await page.getByRole('button', { name: '돌아가기' }).or(page.locator('button').filter({ hasText: '돌아가기' })).click();
> 20 |     await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
     |                                           ^ Error: expect(locator).toBeVisible() failed
  21 |   });
  22 | 
  23 |   test('기본 흐름 — 비밀번호 변경: 정상 변경 완료', async ({ page }) => {
  24 |     page.on('dialog', (dialog) => dialog.accept());
  25 |     await registerUser(page, generateTestEmail());
  26 |     await navigateToProfile(page);
  27 | 
  28 |     const newPassword = 'newpassword456';
  29 |     await page.getByLabel('현재 비밀번호').fill(TEST_PASSWORD);
  30 |     await page.getByLabel('새 비밀번호', { exact: true }).fill(newPassword);
  31 |     await page.getByLabel('새 비밀번호 확인').fill(newPassword);
  32 |     await page.getByRole('button', { name: '비밀번호 변경' }).click();
  33 |     await page.waitForTimeout(2000);
  34 |   });
  35 | 
  36 |   test('E1. 현재 비밀번호 불일치 → 오류 메시지', async ({ page }) => {
  37 |     await registerUser(page, generateTestEmail());
  38 |     await navigateToProfile(page);
  39 | 
  40 |     await page.getByLabel('현재 비밀번호').fill('wrongpassword');
  41 |     await page.getByLabel('새 비밀번호', { exact: true }).fill('newpassword456');
  42 |     await page.getByLabel('새 비밀번호 확인').fill('newpassword456');
  43 |     await page.getByRole('button', { name: '비밀번호 변경' }).click();
  44 |     await expect(page.getByText('현재 비밀번호가 올바르지 않습니다')).toBeVisible({ timeout: 5000 });
  45 |   });
  46 | 
  47 |   test('E3. 이름 비어있을 때 저장 시도 → 오류 메시지', async ({ page }) => {
  48 |     await registerUser(page, generateTestEmail());
  49 |     await navigateToProfile(page);
  50 | 
  51 |     await page.getByLabel('이름').fill('');
  52 |     await page.getByRole('button', { name: '이름 변경' }).click();
  53 |     await expect(page.getByText('이름을 입력해주세요')).toBeVisible();
  54 |   });
  55 | });
  56 | 
```