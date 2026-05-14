# 스타일 가이드 — TodoListApp

**버전:** 2.0  
**작성일:** 2026-05-14  
**레퍼런스:** Channel.io (https://channel.io/ko) 실제 CSS 분석 기반  
**참조 문서:** `8-wireframe.md`

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **명료함** | 텍스트와 배경의 대비를 항상 최우선으로, 정보 가독성 극대화 |
| **일관성** | 컴포넌트 반복 사용으로 학습 비용 최소화 |
| **응답성** | 320px 모바일부터 1440px 데스크톱까지 동일한 UX |
| **간결함** | 불필요한 장식 배제, 기능에 집중하는 레이아웃 |
| **깊이감** | 미묘한 그림자·그라디언트로 레이어 계층을 시각화 |

---

## 2. 색상 시스템

> Channel.io 소스에서 직접 추출한 실제 hex 값 기반.

### 2.1 브랜드 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `brand-primary` | `#6157EA` | 주요 CTA 버튼, 활성 탭, 링크 |
| `brand-primary-deep` | `#5742F8` | 호버 상태 |
| `brand-primary-light` | `#8082FF` | 아이콘 강조, 보조 배지 |
| `brand-primary-muted` | `#C8BDFF` | 비활성 표시, 서브틀 배경 |
| `brand-accent` | `#329BE7` | "New" 배지, 링크 색상 |
| `brand-accent-bg` | `#329BE733` | 배지 배경 (20% 투명도) |

### 2.2 배경 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `bg-page` | `#F6F6F7` | 앱 전체 페이지 배경 |
| `bg-surface` | `#FFFFFF` | 카드, 모달, 입력 필드 배경 |
| `bg-surface-alt` | `#F2F2F2` | 사이드바, 구분 영역 배경 |
| `bg-dark` | `#190331` | 로그인/회원가입 페이지 배경 (딥 퍼플) |
| `bg-dark-card` | `#242428` | 다크 테마 카드 배경 |
| `bg-dark-mid` | `#313234` | 다크 테마 보조 영역 |

### 2.3 다크 배경 그라디언트

로그인/회원가입 페이지는 Channel.io 히어로와 동일한 딥 퍼플 그라디언트를 사용한다.

```css
/* 페이지 배경 그라디언트 (로그인/회원가입) */
background: #190331;
background-image:
  radial-gradient(
    circle at 50% 100%,
    rgba(38, 9, 15, 1)  0%,
    rgba(32, 13, 175, 1) 33%,
    rgba(96, 50, 247, 1) 66%,
    rgba(162, 54, 234, 1) 100%
  );

/* 앱 네비게이션 바 배경 그라디언트 (선택 사항) */
background: linear-gradient(
  90deg,
  rgba(96, 50, 247, 1) 0%,
  rgba(32, 13, 175, 1) 45%,
  rgba(38, 9, 15, 1)  100%
);
```

### 2.4 텍스트 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `text-primary` | `#190331` | 강조 제목, 최상위 텍스트 |
| `text-body` | `#242428` | 본문, 할일 제목 |
| `text-secondary` | `#464748` | 보조 텍스트, 레이블 |
| `text-muted` | `#888888` | 플레이스홀더, 비활성 |
| `text-on-dark` | `#FFFFFF` | 다크 배경 위 텍스트 |
| `text-on-dark-muted` | `rgba(255,255,255,0.65)` | 다크 배경 위 보조 텍스트 |

### 2.5 시맨틱 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `success` | `#20AB55` | 성공 메시지, 완료 상태 |
| `success-bg` | `#4AE6A7` | 성공 배지 배경 |
| `danger` | `#E1535D` | 삭제 버튼, 에러 메시지, 마감 초과 날짜 |
| `danger-bg` | `#FFE8F0` | 에러 배너 배경, 위험 영역 배경 |
| `warning` | `#F0BE27` | 경고 아이콘, 임박 마감일 |
| `warning-bg` | `#FFF9E6` | 경고 배너 배경 |

### 2.6 카테고리 배지 컬러

기본 카테고리 3종은 고정 색상을 사용하고, 사용자 정의 카테고리는 아래 팔레트에서 순서대로 자동 할당한다.

| 카테고리 | 배경 | 텍스트 |
|----------|------|--------|
| 업무 (기본) | `#C8BDFF` | `#5742F8` |
| 개인 (기본) | `#4BC16C26` | `#20AB55` |
| 쇼핑 (기본) | `#EDBC4026` | `#A0A540` |
| 사용자 정의 #1 | `#A970FF26` | `#915CE0` |
| 사용자 정의 #2 | `#EC6FD326` | `#D64BB5` |
| 사용자 정의 #3 | `#329BE733` | `#3A4F8D` |
| 사용자 정의 #4 | `#F4800B26` | `#E67F2B` |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

Channel.io 소스에서 확인된 실제 폰트 스택:

```css
/* 한국어 (UI 전반) */
font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;

/* 영문/숫자 (데이터, 날짜) */
font-family: 'Inter', 'Arial', sans-serif;

/* 루트 폰트 크기 — rem 환산 기준 */
html { font-size: 62.5%; } /* 1rem = 10px */
```

### 3.2 타입 스케일

| 역할 | 크기 (rem) | px 환산 | 굵기 | letter-spacing | 행간 | 용도 |
|------|-----------|---------|------|----------------|------|------|
| Display XL | 5.4rem | 54px | 700 | -2px | 6.4rem | — (미사용) |
| Display L | 4.2rem | 42px | 700 | -1.6px | 5.2rem | — (미사용) |
| Heading 1 | 3.2rem | 32px | 700 | -1.0px | 4.2rem | 로그인/회원가입 페이지 타이틀 |
| Heading 2 | 2.4rem | 24px | 700 | -0.6px | 3.2rem | 섹션 헤더 (프로필 설정 등) |
| Heading 3 | 2.0rem | 20px | 600 | -0.5px | 2.8rem | 모달 타이틀, 카드 제목 |
| Heading 4 | 1.8rem | 18px | 600 | -0.4px | 2.6rem | 서브 섹션 헤더 |
| Body L | 1.7rem | 17px | 400 | -0.1px | 2.7rem | 강조 본문 |
| Body | 1.6rem | 16px | 400 | -0.1px | 2.4rem | 할일 제목, 일반 본문 |
| Body S | 1.4rem | 14px | 400 | 0 | 2.0rem | 보조 설명, 폼 레이블 |
| Caption | 1.2rem | 12px | 400 | 0 | 1.8rem | 글자수 카운터, 최하위 보조 텍스트 |

### 3.3 특수 텍스트 스타일

```css
/* 완료된 할일 제목 */
.todo-completed-title {
  text-decoration: line-through;
  color: #888888; /* text-muted */
}

/* 마감 초과 날짜 */
.overdue-date {
  color: #E1535D; /* danger */
  font-weight: 500;
}

/* 읽기 전용 입력 필드 */
.input-readonly {
  color: #888888;
  background-color: #F2F2F2;
  cursor: not-allowed;
}

/* 앱 로고/타이틀 */
.app-title {
  font-size: 2.0rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #6157EA; /* brand-primary */
}
```

---

## 4. 간격 시스템 (Spacing)

Channel.io에서 확인된 실제 간격 값 기반. 2px 단위 그리드.

| 토큰 | 값 | 주요 용도 |
|------|----|-----------|
| `space-1` | 2px | 아이콘-텍스트 최소 간격 |
| `space-2` | 4px | 인라인 요소 간 간격 |
| `space-3` | 6px | 배지 내부 수직 패딩 |
| `space-4` | 8px | 소형 요소 패딩 |
| `space-5` | 10px | 버튼 내부 수직 패딩 |
| `space-6` | 12px | 입력 필드 패딩, 보조 간격 |
| `space-7` | 14px | 카드 내부 요소 간격 |
| `space-8` | 16px | 카드 내부 패딩, 폼 필드 간격 |
| `space-10` | 20px | 섹션 내부 여백 |
| `space-12` | 24px | 카드 간 간격, 모달 패딩 |
| `space-16` | 30px | 섹션 간 간격 |
| `space-20` | 40px | 주요 레이아웃 여백 |
| `space-24` | 60px | 페이지 수직 패딩 |
| `space-32` | 80px | 최상위 컨테이너 패딩 |

---

## 5. 테두리 반경 (Border Radius)

Channel.io에서 실제 사용된 값 기준.

| 토큰 | 값 | 용도 |
|------|----|------|
| `radius-xs` | 6px | 소형 배지, 코드 블록 |
| `radius-sm` | 8px | 입력 필드, 이미지 |
| `radius-md` | 12px | 카드, 드롭다운, 토스트 |
| `radius-lg` | 16px | 모달, 큰 카드 |
| `radius-xl` | 20px | 사이드바 선택 아이템 |
| `radius-2xl` | 24px | 섹션 컨테이너 |
| `radius-3xl` | 32px | 강조 카드 |
| `radius-full` | 9999px | 필 버튼(pill), 아바타 |

---

## 6. 그림자 (Shadow)

```css
/* 카드 기본 그림자 */
--shadow-card: 0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06);

/* 이미지/썸네일 인셋 그림자 */
--shadow-inset: inset 0 0 0 1px rgba(0,0,0,0.08);

/* 모달/드롭다운 그림자 */
--shadow-modal: 0 10px 30px -5px rgba(0,0,0,0.15), 0 4px 10px -4px rgba(0,0,0,0.1);

/* 네비게이션 바 하단 구분선 */
--shadow-nav: 0 1px 0 0 #E5E5E5;

/* 토스트 그림자 */
--shadow-toast: 0 20px 40px -8px rgba(0,0,0,0.2), 0 8px 15px -6px rgba(0,0,0,0.12);
```

---

## 7. 컴포넌트

### 7.1 버튼

#### Primary 버튼 (Filled)
```
배경:  #6157EA (brand-primary)
텍스트: #FFFFFF
테두리: none
반경:  radius-full (9999px) — pill 형태
패딩:  12px 24px
폰트:  1.6rem / 600
호버:  #5742F8 (brand-primary-deep)
비활성: #F2F2F2 배경 / #888888 텍스트 / cursor-not-allowed
높이:  44px (데스크톱) / 48px (모바일)
```

#### Secondary 버튼 (Outlined)
```
배경:  transparent
텍스트: #242428 (text-body)
테두리: 1.5px solid #242428
반경:  radius-full (9999px)
패딩:  12px 24px
호버:  #F2F2F2 배경
```

#### Danger 버튼 (삭제, 탈퇴)
```
배경:  #E1535D (danger)
텍스트: #FFFFFF
테두리: none
반경:  radius-full (9999px)
패딩:  12px 24px
호버:  #C9444D
```

#### Ghost 버튼 (텍스트형)
```
배경:  transparent
텍스트: #6157EA (brand-primary)
테두리: none
패딩:  8px 16px
호버:  rgba(97,87,234,0.08) 배경
반경:  radius-full (9999px)
```

#### 다크 배경 위 버튼 (로그인 페이지)
```
배경:  #FFFFFF
텍스트: #190331 (bg-dark)
테두리: none
반경:  radius-full (9999px)
패딩:  12px 28px
폰트:  1.6rem / 700
호버:  rgba(255,255,255,0.9) 배경
```

### 7.2 입력 필드 (Input / Textarea)

```
배경:  #FFFFFF
테두리: 1.5px solid #E5E5E5
반경:  radius-sm (8px)
패딩:  12px 16px
폰트:  1.6rem / 400 / #242428
높이:  48px (단일 행) / auto (textarea)
letter-spacing: -0.1px

포커스:  테두리 #6157EA / box-shadow 0 0 0 3px rgba(97,87,234,0.15)
에러:    테두리 #E1535D / box-shadow 0 0 0 3px rgba(225,83,93,0.15)
비활성:  배경 #F2F2F2 / 텍스트 #888888
플레이스홀더: #888888
```

#### 에러 메시지
```
폰트:  1.3rem / 400
색상:  #E1535D
위치:  입력 필드 하단 6px 간격
예시:  제목을 입력해주세요.
```

#### 글자수 카운터
```
폰트:  1.2rem / 400 / #888888
위치:  입력 필드 우측 하단 정렬
예시:  0 / 100
```

### 7.3 체크박스

```
크기:  20x20px
미완료: 배경 #FFFFFF / 테두리 2px solid #E5E5E5 / 반경 6px
완료:  배경 #6157EA / 체크 아이콘(white) / 테두리 없음
호버:  테두리 #6157EA
전환:  background-color 150ms ease, border-color 150ms ease
```

### 7.4 카드 (할일 아이템)

```
배경:  #FFFFFF
테두리: 1.5px solid #EFEFEF
반경:  radius-md (12px)
패딩:  16px
그림자: --shadow-card
호버:  테두리 #C8BDFF / 배경 #FAFAFA

완료 상태:
  배경:  #F6F6F7
  텍스트: #888888 (제목 취소선 포함)
  체크박스: #6157EA 배경
```

#### 카드 내부 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│ [체크박스]  [할일 제목 — 1.6rem/600]     [배지] [수정] [삭제] │
│             [마감일 — 1.4rem/400/muted]                      │
│             [설명 — 1.4rem/400 — 최대 2줄]                   │
└──────────────────────────────────────────────────────────────┘
```

### 7.5 배지 (카테고리 태그)

```
패딩:  3px 10px
반경:  radius-xs (6px)
폰트:  1.3rem / 600
색상:  §2.6 카테고리 배지 컬러 참고
```

### 7.6 모달

```
오버레이: rgba(25, 3, 49, 0.7) — bg-dark 기반 (Channel.io 스타일)
배경:    #FFFFFF
반경:    radius-lg (16px)
그림자:  --shadow-modal
최대 너비: 480px (데스크톱) / calc(100vw - 32px) (모바일)
패딩:    28px

헤더:  1.8rem / 700 / text-primary, 하단 구분선 1px solid #EFEFEF
닫기:  우측 상단, #888888, 호버 #242428
등장:  opacity 0→1 + scale 0.96→1 / 200ms ease-out
퇴장:  opacity 1→0 + scale 1→0.96 / 150ms ease-in
```

### 7.7 토스트 알림

```
위치:    우측 하단, bottom: 24px, right: 24px
배경:    #242428
텍스트:  #FFFFFF / 1.5rem / 400
반경:    radius-md (12px)
패딩:    14px 18px
그림자:  --shadow-toast
최소 너비: 240px / 최대 너비: 360px
지속 시간: 3초 후 자동 소멸
등장:    translateY(12px) → translateY(0) + opacity 0→1 / 200ms ease-out

성공: 좌측 4px solid #20AB55 border
에러: 좌측 4px solid #E1535D border
```

### 7.8 드롭다운 / 셀렉트

```
트리거:  입력 필드와 동일한 스타일
화살표:  #888888 ChevronDown 아이콘, 우측 12px
옵션 목록:
  배경:    #FFFFFF
  그림자:  --shadow-modal
  반경:    radius-md (12px)
  최대 높이: 280px (스크롤)
  아이템 패딩: 10px 16px / 1.5rem / 400
  선택 아이템: 배경 rgba(97,87,234,0.08) / 텍스트 #6157EA / 폰트 600
  호버:    배경 #F6F6F7
```

### 7.9 탭 (필터 바)

```
컨테이너: 배경 #F2F2F2 / 반경 radius-md (12px) / 패딩 4px / 인라인 flex
탭 아이템: 패딩 8px 18px / 1.5rem / 500 / 반경 radius-sm (8px)

비활성: 배경 transparent / 텍스트 #464748
활성:   배경 #FFFFFF / 텍스트 #190331 / 폰트 700 / --shadow-card
호버(비활성): 배경 rgba(0,0,0,0.04)
전환:   background-color 150ms ease, box-shadow 150ms ease
```

### 7.10 사이드바 (카테고리 목록)

```
너비:   220px (데스크톱) / 전체 너비 (모바일)
배경:   #F6F6F7
패딩:   16px 10px
구분선: 1px solid #EFEFEF

헤더:   1.4rem / 600 / #888888 (대문자) — 섹션 레이블
아이템 기본: 패딩 9px 14px / 반경 radius-xl (20px) / 1.5rem / 400 / #464748
아이템 선택: 배경 rgba(97,87,234,0.1) / 텍스트 #6157EA / 폰트 600
아이템 호버: 배경 #EFEFEF
전환:   background-color 120ms ease
```

### 7.11 네비게이션 바

```
배경:   #FFFFFF
높이:   56px
구분선: --shadow-nav
패딩:   0 24px
z-index: 100

앱 로고/타이틀:  좌측 / .app-title 스타일
메뉴 영역:      우측 flex / gap: 8px
로그아웃 버튼:  Ghost 버튼 스타일
```

#### 로그인/회원가입 페이지 네비게이션
```
배경:    transparent (다크 그라디언트 위)
텍스트:  #FFFFFF
로고:    흰색
버튼:    다크 배경 위 버튼 스타일 (흰색 pill)
```

### 7.12 빈 상태 (Empty State)

```
컨테이너: flex-col / items-center / justify-center / gap: 12px / py: 60px
아이콘:   48px / color: #C8BDFF
제목:     2.0rem / 600 / #464748
설명:     1.5rem / 400 / #888888 / text-center
CTA:      Primary 버튼 / margin-top: 16px
```

---

## 8. 반응형 브레이크포인트

| 이름 | 최소 너비 | 레이아웃 변화 |
|------|----------|--------------|
| `mobile` | 320px | 단일 열, 사이드바 숨김 (드로어) |
| `tablet` | 768px | 사이드바 접히는 드로어 방식 |
| `desktop` | 1024px | 사이드바 고정 노출 (220px), 2단 레이아웃 |
| `wide` | 1280px | 콘텐츠 최대 너비 1200px 제한 |

### 모바일 우선 (Mobile First)
- 기본 스타일은 모바일 기준으로 작성
- `md:`, `lg:` 접두사로 태블릿/데스크톱 오버라이드
- 모바일 버튼 최소 높이: 48px (터치 타깃 44px 이상)

---

## 9. 아이콘

Lucide Icons 라이브러리 사용.

| 용도 | 아이콘 이름 |
|------|------------|
| 할일 추가 | `Plus` |
| 할일 수정 | `Pencil` |
| 할일 삭제 | `Trash2` |
| 완료 체크 | `Check` |
| 카테고리 | `Tag` |
| 검색 | `Search` |
| 달력/마감일 | `Calendar` |
| 로그아웃 | `LogOut` |
| 프로필 | `User` |
| 드롭다운 화살표 | `ChevronDown` |
| 모달 닫기 | `X` |
| 경고 | `AlertCircle` |
| 성공 | `CheckCircle2` |
| 빈 할일 목록 | `ClipboardList` |

**아이콘 크기 규격**

| 위치 | 크기 |
|------|------|
| 버튼 인라인 | 16px |
| 카드 액션 아이콘 | 18px |
| 사이드바 카테고리 | 18px |
| 네비게이션 | 20px |
| Empty State | 48px |

---

## 10. 애니메이션 / 전환 효과

Channel.io에서 사용된 `transition-delay` 패턴 반영.

| 상황 | 속성 | 값 |
|------|------|----|
| 버튼 호버 | `background-color` | 120ms ease |
| 입력 포커스 | `border-color`, `box-shadow` | 150ms ease |
| 카드 호버 | `border-color`, `box-shadow` | 150ms ease |
| 체크박스 완료 | `background-color`, `border-color` | 150ms ease |
| 할일 완료 텍스트 | `color`, `opacity` | 200ms ease |
| 탭 전환 | `background-color`, `box-shadow` | 150ms ease |
| 모달 등장 | `opacity`, `transform` (scale) | 200ms ease-out |
| 모달 퇴장 | `opacity`, `transform` (scale) | 150ms ease-in |
| 토스트 등장 | `opacity`, `transform` (translateY) | 200ms ease-out |
| 토스트 퇴장 | `opacity`, `transform` | 150ms ease-in |
| 사이드바 드로어 (모바일) | `transform` (translateX) | 250ms ease |
| 스켈레톤 로딩 | `opacity` (pulse) | 1.5s ease-in-out infinite |
| 목록 아이템 등장 | `opacity`, `transform` (translateY) | 순차 delay 40ms씩 |

---

## 11. 상태 패턴

### 11.1 로딩 상태
- 최초 로드: 스켈레톤 카드 3개 표시 (`#EFEFEF` pulse 애니메이션)
- 버튼 로딩: 스피너 아이콘 표시 / 텍스트 "저장 중..." / 비활성화

### 11.2 에러 상태
- 폼 필드 에러: 입력 필드 `border-color: #E1535D` + 하단 인라인 메시지
- API 에러 (모달): 모달 상단 에러 배너 (`#FFE8F0` 배경, `#E1535D` 텍스트)
- 페이지 레벨 에러: 중앙 정렬 에러 메시지 + "다시 시도" 버튼

### 11.3 성공 상태
- 저장/수정: 토스트 알림 (success border)
- 삭제: 토스트 알림 + "실행 취소" 링크 (5초 이내)

### 11.4 빈 상태
- 할일 없음: Empty State (§7.12)
- 필터 결과 없음: Search 아이콘 + "결과 없음" + 필터 초기화 버튼

---

## 12. 접근성 (a11y)

- 색상 대비: WCAG AA (일반 텍스트 4.5:1, 큰 텍스트 3:1 이상)
- 포커스 링: `outline: 2px solid #6157EA; outline-offset: 2px`
- 모달: `role="dialog"`, `aria-modal="true"`, 열릴 때 첫 포커스 이동
- 에러 메시지: `aria-describedby`로 입력 필드 연결
- 토스트: `aria-live="polite"` 영역에 렌더링
- 버튼 비활성: `disabled` + `aria-disabled="true"`
- 체크박스: `aria-label="완료로 표시"` / `aria-label="미완료로 표시"`

---

## 13. Tailwind CSS 커스텀 설정

Channel.io 실제 값 기반 커스텀 토큰.

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary:      '#6157EA',
          'primary-deep': '#5742F8',
          'primary-light': '#8082FF',
          'primary-muted': '#C8BDFF',
          accent:       '#329BE7',
          'accent-bg':  '#329BE733',
        },
        bg: {
          page:    '#F6F6F7',
          surface: '#FFFFFF',
          alt:     '#F2F2F2',
          dark:    '#190331',
        },
        text: {
          primary:   '#190331',
          body:      '#242428',
          secondary: '#464748',
          muted:     '#888888',
        },
        semantic: {
          success:    '#20AB55',
          'success-bg': '#4AE6A7',
          danger:     '#E1535D',
          'danger-bg': '#FFE8F0',
          warning:    '#F0BE27',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'Apple SD Gothic Neo', 'sans-serif'],
        mono: ['Inter', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'display': ['5.4rem', { lineHeight: '6.4rem', letterSpacing: '-2px', fontWeight: '700' }],
        'h1':      ['3.2rem', { lineHeight: '4.2rem', letterSpacing: '-1px',  fontWeight: '700' }],
        'h2':      ['2.4rem', { lineHeight: '3.2rem', letterSpacing: '-0.6px', fontWeight: '700' }],
        'h3':      ['2.0rem', { lineHeight: '2.8rem', letterSpacing: '-0.5px', fontWeight: '600' }],
        'body-l':  ['1.7rem', { lineHeight: '2.7rem', letterSpacing: '-0.1px' }],
        'body':    ['1.6rem', { lineHeight: '2.4rem', letterSpacing: '-0.1px' }],
        'body-s':  ['1.4rem', { lineHeight: '2.0rem' }],
        'caption': ['1.2rem', { lineHeight: '1.8rem' }],
      },
      borderRadius: {
        'xs':   '6px',
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '20px',
        '2xl':  '24px',
        '3xl':  '32px',
        'full': '9999px',
      },
      boxShadow: {
        'card':  '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'modal': '0 10px 30px -5px rgba(0,0,0,0.15), 0 4px 10px -4px rgba(0,0,0,0.1)',
        'toast': '0 20px 40px -8px rgba(0,0,0,0.2), 0 8px 15px -6px rgba(0,0,0,0.12)',
        'nav':   '0 1px 0 0 #E5E5E5',
      },
    },
  },
}
```

---

**문서 관리:**
- 컴포넌트 추가 시 §7에 섹션 추가
- 색상 토큰 변경 시 §2와 §13 동시 수정
- 실제 구현 결과물과 스타일 가이드가 불일치할 경우 구현 결과물 기준으로 가이드 업데이트
