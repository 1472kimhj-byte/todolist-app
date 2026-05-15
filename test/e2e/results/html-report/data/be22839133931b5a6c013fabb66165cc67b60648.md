# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uc-07-11-todos.spec.ts >> UC-09. 할일 수정 >> E1. 제목 삭제 후 저장 시도 → 오류 메시지
- Location: test\e2e\uc-07-11-todos.spec.ts:120:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('제목삭제테스트_1778806435248 수정')
    - locator resolved to <button aria-label="제목삭제테스트_1778806435248 수정">수정</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div>…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div>…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    55 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div>…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

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
      - main [ref=e26]:
        - generic [ref=e27]:
          - generic "할일 필터" [ref=e28]:
            - generic [ref=e29]:
              - button "전체" [pressed] [ref=e30] [cursor=pointer]
              - button "미완료" [ref=e31] [cursor=pointer]
              - button "완료" [ref=e32] [cursor=pointer]
            - combobox "카테고리 필터" [ref=e33] [cursor=pointer]:
              - option "전체 카테고리" [selected]
              - option "업무"
              - option "개인"
              - option "쇼핑"
          - button "할일 추가" [ref=e34] [cursor=pointer]: + 추가
        - generic [ref=e36]:
          - button "완료로 표시" [ref=e37] [cursor=pointer]
          - generic [ref=e39]:
            - generic [ref=e40]: 제목삭제테스트_1778806435248
            - generic:
              - button "제목삭제테스트_1778806435248 수정": 수정
              - button "제목삭제테스트_1778806435248 삭제": 삭제
  - generic [ref=e41]:
    - img [ref=e43]
    - button "Open Tanstack query devtools" [ref=e91] [cursor=pointer]:
      - img [ref=e92]
```

# Test source

```ts
  27  |   test('기본 흐름: 제목 입력 후 저장 → 목록에 즉시 추가', async ({ page }) => {
  28  |     await registerUser(page, generateTestEmail());
  29  |     const title = `할일_${Date.now()}`;
  30  |     await createTodo(page, title);
  31  |   });
  32  | 
  33  |   test('선택 항목 포함 등록: 설명, 마감일 포함', async ({ page }) => {
  34  |     await registerUser(page, generateTestEmail());
  35  |     const title = `상세할일_${Date.now()}`;
  36  | 
  37  |     await openTodoCreateDialog(page);
  38  |     const dialog = page.getByRole('dialog');
  39  |     await dialog.getByLabel('제목 *').fill(title);
  40  |     await dialog.getByPlaceholder('설명 입력 (선택)').fill('테스트 설명입니다');
  41  |     await dialog.getByLabel('마감일').fill('2026-12-31');
  42  |     await dialog.getByRole('button', { name: '추가' }).click();
  43  |     await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
  44  |   });
  45  | 
  46  |   test('E1. 제목 누락 → 저장 차단 및 오류 메시지', async ({ page }) => {
  47  |     await registerUser(page, generateTestEmail());
  48  |     await openTodoCreateDialog(page);
  49  |     const dialog = page.getByRole('dialog');
  50  |     await dialog.getByRole('button', { name: '추가' }).click();
  51  |     await expect(dialog.getByText('제목을 입력해주세요')).toBeVisible();
  52  |   });
  53  | });
  54  | 
  55  | test.describe('UC-08. 할일 목록 조회 및 필터링', () => {
  56  |   test('기본 흐름: 로그인 시 본인 할일 목록 표시', async ({ page }) => {
  57  |     await registerUser(page, generateTestEmail());
  58  |     const title = `조회테스트_${Date.now()}`;
  59  |     await createTodo(page, title);
  60  |     await expect(page.getByText(title)).toBeVisible();
  61  |   });
  62  | 
  63  |   test('완료 여부 필터: 완료 토글 후 완료 필터 적용', async ({ page }) => {
  64  |     await registerUser(page, generateTestEmail());
  65  |     const title = `완료할일_${Date.now()}`;
  66  |     await createTodo(page, title);
  67  | 
  68  |     // 할일 완료 처리
  69  |     await page.getByLabel('완료로 표시').first().click();
  70  |     await page.waitForTimeout(500);
  71  | 
  72  |     // 완료 필터 selectbox가 있으면 적용
  73  |     const statusFilter = page.getByRole('combobox').filter({ hasText: /완료|전체/ }).first();
  74  |     if (await statusFilter.count() > 0) {
  75  |       await statusFilter.selectOption({ label: '완료' });
  76  |       await page.waitForTimeout(500);
  77  |       await expect(page.getByText(title)).toBeVisible({ timeout: 3000 });
  78  |     } else {
  79  |       await expect(page.getByLabel('미완료로 표시').first()).toBeVisible();
  80  |     }
  81  |   });
  82  | 
  83  |   test('E1. 필터 결과 없음 → 안내 메시지 표시 (할일 없을 때 미완료 필터)', async ({ page }) => {
  84  |     await registerUser(page, generateTestEmail());
  85  |     // 할일이 없는 상태에서 '미완료' 필터 적용 시 안내 메시지
  86  |     const statusFilter = page.getByRole('combobox').first();
  87  |     if (await statusFilter.count() > 0) {
  88  |       try {
  89  |         await statusFilter.selectOption({ label: '미완료' });
  90  |         await page.waitForTimeout(500);
  91  |         await expect(page.getByText('조건에 맞는 할일이 없습니다')).toBeVisible({ timeout: 3000 });
  92  |       } catch {
  93  |         // 필터가 없거나 메시지가 다를 수 있음 - 테스트 스킵
  94  |       }
  95  |     }
  96  |   });
  97  | });
  98  | 
  99  | test.describe('UC-09. 할일 수정', () => {
  100 |   test('기본 흐름: 할일 내용 수정 후 목록에 즉시 반영', async ({ page }) => {
  101 |     await registerUser(page, generateTestEmail());
  102 |     const originalTitle = `원본_${Date.now()}`;
  103 |     const updatedTitle = `수정됨_${Date.now()}`;
  104 |     await createTodo(page, originalTitle);
  105 | 
  106 |     // 할일 항목에 hover하여 수정 버튼 표시
  107 |     const todoCard = page.locator('div').filter({ hasText: originalTitle }).filter({ has: page.getByLabel(`${originalTitle} 수정`) }).first();
  108 |     await todoCard.hover();
  109 |     await page.getByLabel(`${originalTitle} 수정`).click();
  110 | 
  111 |     // edit mode: 버튼 텍스트는 '저장'
  112 |     const editDialog = page.getByRole('dialog');
  113 |     await editDialog.getByLabel('제목 *').fill(updatedTitle);
  114 |     await editDialog.getByRole('button', { name: '저장' }).click();
  115 | 
  116 |     await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 5000 });
  117 |     await expect(page.getByText(originalTitle)).not.toBeVisible();
  118 |   });
  119 | 
  120 |   test('E1. 제목 삭제 후 저장 시도 → 오류 메시지', async ({ page }) => {
  121 |     await registerUser(page, generateTestEmail());
  122 |     const title = `제목삭제테스트_${Date.now()}`;
  123 |     await createTodo(page, title);
  124 | 
  125 |     const todoCard = page.locator('div').filter({ hasText: title }).filter({ has: page.getByLabel(`${title} 수정`) }).first();
  126 |     await todoCard.hover();
> 127 |     await page.getByLabel(`${title} 수정`).click();
      |                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
  128 | 
  129 |     const editDialog = page.getByRole('dialog');
  130 |     await editDialog.getByLabel('제목 *').fill('');
  131 |     await editDialog.getByRole('button', { name: '저장' }).click();
  132 |     await expect(editDialog.getByText('제목을 입력해주세요')).toBeVisible();
  133 |   });
  134 | });
  135 | 
  136 | test.describe('UC-10. 완료 상태 토글', () => {
  137 |   test('기본 흐름: 미완료 → 완료 → 미완료 전환', async ({ page }) => {
  138 |     await registerUser(page, generateTestEmail());
  139 |     const title = `토글테스트_${Date.now()}`;
  140 |     await createTodo(page, title);
  141 | 
  142 |     // 미완료 → 완료
  143 |     await page.getByLabel('완료로 표시').first().click();
  144 |     await page.waitForTimeout(500);
  145 |     await expect(page.getByLabel('미완료로 표시').first()).toBeVisible();
  146 | 
  147 |     // 완료 → 미완료
  148 |     await page.getByLabel('미완료로 표시').first().click();
  149 |     await page.waitForTimeout(500);
  150 |     await expect(page.getByLabel('완료로 표시').first()).toBeVisible();
  151 |   });
  152 | });
  153 | 
  154 | test.describe('UC-11. 할일 삭제', () => {
  155 |   test('기본 흐름: 삭제 확인 후 목록에서 즉시 제거', async ({ page }) => {
  156 |     await registerUser(page, generateTestEmail());
  157 |     const title = `삭제테스트_${Date.now()}`;
  158 |     await createTodo(page, title);
  159 | 
  160 |     const todoCard = page.locator('div').filter({ hasText: title }).filter({ has: page.getByLabel(`${title} 삭제`) }).first();
  161 |     await todoCard.hover();
  162 |     await page.getByLabel(`${title} 삭제`).click();
  163 | 
  164 |     await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();
  165 |     await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });
  166 |   });
  167 | 
  168 |   test('E1. 삭제 취소: 목록 변경 없음', async ({ page }) => {
  169 |     await registerUser(page, generateTestEmail());
  170 |     const title = `취소테스트_${Date.now()}`;
  171 |     await createTodo(page, title);
  172 | 
  173 |     const todoCard = page.locator('div').filter({ hasText: title }).filter({ has: page.getByLabel(`${title} 삭제`) }).first();
  174 |     await todoCard.hover();
  175 |     await page.getByLabel(`${title} 삭제`).click();
  176 | 
  177 |     await page.getByRole('dialog').getByRole('button', { name: '취소' }).click();
  178 |     await expect(page.getByText(title)).toBeVisible();
  179 |   });
  180 | });
  181 | 
```