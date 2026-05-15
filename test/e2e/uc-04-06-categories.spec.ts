import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers/auth-helpers';

async function openCategoryCreateDialog(page: import('@playwright/test').Page) {
  // CategoryList의 "+ 추가" 버튼 (aria-label 없어 텍스트로 매칭)
  await page.getByRole('button', { name: '+ 추가', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
}

test.describe('UC-04. 기본 카테고리 조회', () => {
  test('기본 흐름: 할일 목록 화면에 기본 카테고리 표시, 수정·삭제 버튼 없음', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await page.waitForTimeout(500);

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('전체')).toBeVisible();

    // 기본 카테고리가 존재하면 수정/삭제 버튼 없음을 확인
    const firstDefaultCategory = sidebar.locator('[aria-label$=" 수정"]').first();
    // 기본 카테고리(is_default=true)는 수정 버튼이 렌더링되지 않아야 함
    // 사용자 정의 카테고리가 없으므로 수정 버튼이 없어야 함
    await expect(firstDefaultCategory).toHaveCount(0);
  });
});

test.describe('UC-05. 사용자 정의 카테고리 생성', () => {
  test('기본 흐름: 카테고리 추가 후 목록에 즉시 반영', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    const categoryName = `카테고리_${Date.now()}`;

    await openCategoryCreateDialog(page);
    await page.getByRole('dialog').getByLabel('카테고리 이름').fill(categoryName);
    // create mode: 버튼 텍스트는 '생성'
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();

    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  });

  test('E1. 카테고리 이름 누락 → 저장 차단 및 오류 메시지', async ({ page }) => {
    await registerUser(page, generateTestEmail());

    await openCategoryCreateDialog(page);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
    await expect(page.getByText('카테고리 이름을 입력해주세요')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('UC-06. 사용자 정의 카테고리 수정·삭제', () => {
  test('기본 흐름 — 수정: 카테고리 이름 변경 후 목록 갱신', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    const originalName = `원본_${Date.now()}`;
    const editedName = `수정됨_${Date.now()}`;

    // 카테고리 생성
    await openCategoryCreateDialog(page);
    await page.getByRole('dialog').getByLabel('카테고리 이름').fill(originalName);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
    await expect(page.getByText(originalName)).toBeVisible({ timeout: 5000 });

    // 카테고리 수정 버튼 클릭 (aria-label="${name} 수정")
    await page.getByRole('button', { name: `${originalName} 수정` }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('카테고리 이름').fill(editedName);
    // edit mode: 버튼 텍스트는 '수정'
    await editDialog.getByRole('button', { name: '수정' }).click();

    await expect(page.getByText(editedName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(originalName)).not.toBeVisible();
  });

  test('기본 흐름 — 삭제: 확인 후 카테고리 제거', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    const categoryName = `삭제대상_${Date.now()}`;

    await openCategoryCreateDialog(page);
    await page.getByRole('dialog').getByLabel('카테고리 이름').fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });

    // 카테고리 삭제 버튼 클릭 (aria-label="${name} 삭제")
    await page.getByRole('button', { name: `${categoryName} 삭제` }).click();
    // 삭제 확인 다이얼로그에서 삭제 확인
    await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

    await expect(page.getByText(categoryName)).not.toBeVisible({ timeout: 5000 });
  });

  test('E1. 기본 카테고리 수정·삭제 시도 불가: 버튼 없음', async ({ page }) => {
    await registerUser(page, generateTestEmail());
    await page.waitForTimeout(500);
    // 기본 카테고리에는 수정/삭제 버튼이 없어야 함 (CategoryItem에서 !category.is_default 조건)
    // 사용자 정의 카테고리를 추가하지 않은 상태에서 수정 버튼은 0개
    const editButtons = page.getByRole('button', { name: / 수정$/ });
    await expect(editButtons).toHaveCount(0);
  });
});
