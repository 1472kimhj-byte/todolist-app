# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uc-04-06-categories.spec.ts >> UC-06. 사용자 정의 카테고리 수정·삭제 >> 기본 흐름 — 수정: 카테고리 이름 변경 후 목록 갱신
- Location: test\e2e\uc-04-06-categories.spec.ts:50:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('원본_1778806373386')
Expected: visible
Error: strict mode violation: getByText('원본_1778806373386') resolved to 2 elements:
    1) <span>원본_1778806373386</span> aka getByRole('button', { name: '원본_1778806373386 선택' })
    2) <option value="1808284a-2091-4137-a50e-1c1341b8c072">원본_1778806373386</option> aka getByLabel('카테고리 필터')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('원본_1778806373386')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - navigation "메인 네비게이션" [ref=e4]:
      - generic [ref=e6]: TodoListApp
      - generic [ref=e7]:
        - button "다크 모드로 전환" [ref=e8] [cursor=pointer]:
          - img [ref=e9]
        - link "E2E테스터" [ref=e11] [cursor=pointer]:
          - /url: /profile
        - button "로그아웃" [ref=e12] [cursor=pointer]
    - generic [ref=e13]:
      - complementary [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: 카테고리
            - button "+ 추가" [ref=e18] [cursor=pointer]
          - button "전체" [pressed] [ref=e19] [cursor=pointer]
          - button "업무 선택" [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: 업무
          - button "개인 선택" [ref=e22] [cursor=pointer]:
            - generic [ref=e23]: 개인
          - button "쇼핑 선택" [ref=e24] [cursor=pointer]:
            - generic [ref=e25]: 쇼핑
          - button "원본_1778806373386 선택" [ref=e26] [cursor=pointer]:
            - generic [ref=e27]: 원본_1778806373386
            - generic [ref=e28]:
              - button "원본_1778806373386 수정" [ref=e29]: 수정
              - button "원본_1778806373386 삭제" [ref=e30]: 삭제
      - main [ref=e31]:
        - generic [ref=e32]:
          - generic "할일 필터" [ref=e33]:
            - generic [ref=e34]:
              - button "전체" [pressed] [ref=e35] [cursor=pointer]
              - button "미완료" [ref=e36] [cursor=pointer]
              - button "완료" [ref=e37] [cursor=pointer]
            - combobox "카테고리 필터" [ref=e38] [cursor=pointer]:
              - option "전체 카테고리" [selected]
              - option "업무"
              - option "개인"
              - option "쇼핑"
              - option "원본_1778806373386"
          - button "할일 추가" [ref=e39] [cursor=pointer]: + 추가
        - generic [ref=e40]:
          - img [ref=e41]
          - paragraph [ref=e45]: 할일이 없습니다
          - paragraph [ref=e46]: 새 할일을 추가해 보세요.
  - generic [ref=e47]:
    - img [ref=e49]
    - button "Open Tanstack query devtools" [ref=e97] [cursor=pointer]:
      - img [ref=e98]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { generateTestEmail, registerUser } from './helpers/auth-helpers';
  3  | 
  4  | async function openCategoryCreateDialog(page: import('@playwright/test').Page) {
  5  |   // CategoryList의 "+ 추가" 버튼 (aria-label 없어 텍스트로 매칭)
  6  |   await page.getByRole('button', { name: '+ 추가', exact: true }).click();
  7  |   await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
  8  | }
  9  | 
  10 | test.describe('UC-04. 기본 카테고리 조회', () => {
  11 |   test('기본 흐름: 할일 목록 화면에 기본 카테고리 표시, 수정·삭제 버튼 없음', async ({ page }) => {
  12 |     await registerUser(page, generateTestEmail());
  13 |     await page.waitForTimeout(500);
  14 | 
  15 |     const sidebar = page.locator('aside');
  16 |     await expect(sidebar).toBeVisible();
  17 |     await expect(sidebar.getByText('전체')).toBeVisible();
  18 | 
  19 |     // 기본 카테고리가 존재하면 수정/삭제 버튼 없음을 확인
  20 |     const firstDefaultCategory = sidebar.locator('[aria-label$=" 수정"]').first();
  21 |     // 기본 카테고리(is_default=true)는 수정 버튼이 렌더링되지 않아야 함
  22 |     // 사용자 정의 카테고리가 없으므로 수정 버튼이 없어야 함
  23 |     await expect(firstDefaultCategory).toHaveCount(0);
  24 |   });
  25 | });
  26 | 
  27 | test.describe('UC-05. 사용자 정의 카테고리 생성', () => {
  28 |   test('기본 흐름: 카테고리 추가 후 목록에 즉시 반영', async ({ page }) => {
  29 |     await registerUser(page, generateTestEmail());
  30 |     const categoryName = `카테고리_${Date.now()}`;
  31 | 
  32 |     await openCategoryCreateDialog(page);
  33 |     await page.getByRole('dialog').getByLabel('카테고리 이름').fill(categoryName);
  34 |     // create mode: 버튼 텍스트는 '생성'
  35 |     await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
  36 | 
  37 |     await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  38 |   });
  39 | 
  40 |   test('E1. 카테고리 이름 누락 → 저장 차단 및 오류 메시지', async ({ page }) => {
  41 |     await registerUser(page, generateTestEmail());
  42 | 
  43 |     await openCategoryCreateDialog(page);
  44 |     await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
  45 |     await expect(page.getByText('카테고리 이름을 입력해주세요')).toBeVisible({ timeout: 3000 });
  46 |   });
  47 | });
  48 | 
  49 | test.describe('UC-06. 사용자 정의 카테고리 수정·삭제', () => {
  50 |   test('기본 흐름 — 수정: 카테고리 이름 변경 후 목록 갱신', async ({ page }) => {
  51 |     await registerUser(page, generateTestEmail());
  52 |     const originalName = `원본_${Date.now()}`;
  53 |     const editedName = `수정됨_${Date.now()}`;
  54 | 
  55 |     // 카테고리 생성
  56 |     await openCategoryCreateDialog(page);
  57 |     await page.getByRole('dialog').getByLabel('카테고리 이름').fill(originalName);
  58 |     await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
> 59 |     await expect(page.getByText(originalName)).toBeVisible({ timeout: 5000 });
     |                                                ^ Error: expect(locator).toBeVisible() failed
  60 | 
  61 |     // 카테고리 수정 버튼 클릭 (aria-label="${name} 수정")
  62 |     await page.getByRole('button', { name: `${originalName} 수정` }).click();
  63 |     const editDialog = page.getByRole('dialog');
  64 |     await editDialog.getByLabel('카테고리 이름').fill(editedName);
  65 |     // edit mode: 버튼 텍스트는 '수정'
  66 |     await editDialog.getByRole('button', { name: '수정' }).click();
  67 | 
  68 |     await expect(page.getByText(editedName)).toBeVisible({ timeout: 5000 });
  69 |     await expect(page.getByText(originalName)).not.toBeVisible();
  70 |   });
  71 | 
  72 |   test('기본 흐름 — 삭제: 확인 후 카테고리 제거', async ({ page }) => {
  73 |     await registerUser(page, generateTestEmail());
  74 |     const categoryName = `삭제대상_${Date.now()}`;
  75 | 
  76 |     await openCategoryCreateDialog(page);
  77 |     await page.getByRole('dialog').getByLabel('카테고리 이름').fill(categoryName);
  78 |     await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
  79 |     await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  80 | 
  81 |     // 카테고리 삭제 버튼 클릭 (aria-label="${name} 삭제")
  82 |     await page.getByRole('button', { name: `${categoryName} 삭제` }).click();
  83 |     // 삭제 확인 다이얼로그에서 삭제 확인
  84 |     await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();
  85 | 
  86 |     await expect(page.getByText(categoryName)).not.toBeVisible({ timeout: 5000 });
  87 |   });
  88 | 
  89 |   test('E1. 기본 카테고리 수정·삭제 시도 불가: 버튼 없음', async ({ page }) => {
  90 |     await registerUser(page, generateTestEmail());
  91 |     await page.waitForTimeout(500);
  92 |     // 기본 카테고리에는 수정/삭제 버튼이 없어야 함 (CategoryItem에서 !category.is_default 조건)
  93 |     // 사용자 정의 카테고리를 추가하지 않은 상태에서 수정 버튼은 0개
  94 |     const editButtons = page.getByRole('button', { name: / 수정$/ });
  95 |     await expect(editButtons).toHaveCount(0);
  96 |   });
  97 | });
  98 | 
```