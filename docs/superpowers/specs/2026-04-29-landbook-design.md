# LandBook - 부동산 투자 분석 리포트 웹 서비스 설계

## 1. 개요

### 목적
부동산 매물 분석 리포트(HTML+이미지)를 웹에 등록하고, 고유 링크를 통해 외부 클라이언트가 열람/PDF 다운로드/공유할 수 있는 프리미엄 리포트 서비스.

### 핵심 워크플로우
1. 관리자가 매물 분석 리포트(ZIP: HTML 1개 + 이미지 N개)를 업로드
2. 서버가 ZIP 해제, 페이지 분할, PDF 생성, OG 이미지 생성
3. 고유 토큰 링크 발급
4. 관리자가 SMS/이메일/카카오톡으로 링크 공유
5. 클라이언트가 링크로 접근하여 프리미엄 뷰어에서 리포트 열람

### 사용자 역할
- **관리자**: 리포트 등록, 관리, 공유 발송 (1명, 진호님)
- **클라이언트**: 리포트 열람, PDF 다운로드, 재공유 (불특정 다수, 인증 없음)

## 2. 아키텍처

### 방식: 분리형 (관리자 앱 + 뷰어 앱 + API 서버)

```
landbook/
├── backend/            Express API 서버 (포트 8020)
│   ├── routes/
│   │   ├── reports.js        리포트 CRUD, 업로드, 통계
│   │   ├── share.js          SMS/이메일/카카오 공유 발송
│   │   └── viewer.js         뷰어용 리포트 데이터 API + OG 메타 SSR
│   ├── services/
│   │   ├── uploadService.js  ZIP 해제, 파일 저장, 페이지 분할
│   │   ├── pdfService.js     Puppeteer PDF 생성
│   │   ├── smsService.js     알리고 API 연동 (bulk-sms 로직 재사용)
│   │   ├── emailService.js   Nodemailer 이메일 발송
│   │   └── ogService.js      OG 이미지/메타태그 생성
│   ├── models/
│   │   └── Report.js         MongoDB 스키마
│   └── uploads/              업로드된 리포트 파일 저장소
│       └── {reportId}/
│           ├── original.zip
│           ├── index.html
│           ├── images/
│           ├── pages/        분할된 페이지별 HTML
│           ├── report.pdf    생성된 PDF
│           └── og-image.png  OG 썸네일 이미지
│
├── admin/              관리자 SPA (포트 5200)
│   └── Vue 3 + Vite + Tailwind
│
└── viewer/             클라이언트 뷰어 (포트 5201)
    └── Vue 3 + Vite + Tailwind
```

### 분리 이유
- 뷰어는 극도로 가볍고 빠르게 로딩 (관리자 코드 미포함)
- OG 메타태그를 위한 서버 사이드 처리 용이
- 관리자는 실용적 UI, 뷰어는 프리미엄 디자인으로 독립 개발
- 관리자 라우트/로직이 클라이언트에게 노출되지 않음

## 3. 데이터 모델

### Report 스키마 (MongoDB)

```javascript
{
  _id: ObjectId,
  token: String,            // 고유 토큰 (nanoid, 12자)
  title: String,            // 리포트 제목
  description: String,      // 간단 설명 (OG 설명용)
  address: String,          // 매물 주소
  coverImage: String,       // 표지 이미지 경로 (OG 이미지용)
  pageCount: Number,        // 페이지 수
  filePath: String,         // 저장 경로
  pdfPath: String,          // PDF 파일 경로
  ogImagePath: String,      // OG 이미지 경로
  isActive: Boolean,        // 활성/비활성
  stats: {
    views: Number,          // 조회수
    pdfDownloads: Number,   // PDF 다운로드 수
    shares: Number          // 공유 횟수
  },
  sharedVia: [{             // 공유 이력
    type: String,           // 'sms' | 'email' | 'kakao' | 'link'
    target: String,         // 수신자 (번호/이메일)
    sentAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 4. 관리자 화면 설계

### 인증
- 환경변수 기반 단일 비밀번호 인증
- JWT 토큰으로 세션 유지

### 화면 구성

#### 4-1. 대시보드 (`/admin`)
- 전체 리포트 수, 총 조회수, 총 PDF 다운로드 수
- 최근 등록 리포트 5개
- 최근 7일 조회수 추이 차트

#### 4-2. 리포트 목록 (`/admin/reports`)
- 테이블: 제목 | 주소 | 페이지수 | 조회수 | 다운로드 | 생성일 | 상태
- 검색/필터 (제목, 주소)
- 활성/비활성 토글, 삭제

#### 4-3. 리포트 등록 (`/admin/reports/new`)
- Step 1: ZIP 파일 드래그앤드롭 업로드
- Step 2: 자동 파싱 후 제목, 설명, 주소 입력 + 페이지 미리보기
- Step 3: 등록 완료, 공유 링크 즉시 표시

#### 4-4. 리포트 상세 (`/admin/reports/:id`)
- 메타 정보 편집
- 공유 링크 복사
- 뷰어 미리보기 (새 탭)
- 공유 패널:
  - SMS 발송: 수신번호 입력(복수) → 알리고 API로 링크 포함 문자 발송
  - 이메일 발송: 수신 이메일 입력 → PDF 첨부 또는 링크 포함 이메일
  - 카카오톡: 카카오 공유 링크 생성
  - 웹 링크: 복사 버튼
- 통계 패널: 조회수, PDF 다운로드, 공유 이력 타임라인

#### 4-5. 설정 (`/admin/settings`)
- 알리고 API 키/발신번호
- 이메일 SMTP 설정
- 카카오 JavaScript 키
- 관리자 비밀번호 변경

## 5. 클라이언트 뷰어 설계 (디자인 상세 명세)

> 이 섹션은 디자인 도구(클로드 디자인 등)가 정확한 목업을 생성할 수 있도록 구체적인 수치, CSS 속성, 컴포넌트 구조를 명시합니다.

### 5-1. 디자인 콘셉트

**스타일**: 프리미엄 에디토리얼 매거진 + 고급 부동산 컨설팅 브로셔
**레퍼런스 키워드**: 다크/라이트 섹션 교차, 대형 섹션 넘버링, 레터스페이싱 대문자 헤딩, 배경 워터마크 텍스트, 코퍼 액센트 라인, 비대칭 그리드, 넉넉한 여백
**톤앤무드**: 전문가적, 격조 있는, 절제된, 신뢰감

### 5-2. 디자인 토큰 (Design Tokens)

#### 컬러 팔레트

```css
/* 다크 섹션 */
--bg-dark: #1C1C1E;
--bg-dark-elevated: #2A2A2E;
--text-on-dark-primary: #F0EDE8;
--text-on-dark-secondary: #9A9A9E;
--watermark-on-dark: rgba(255, 255, 255, 0.03);

/* 라이트 섹션 */
--bg-light: #FAFAFA;
--bg-light-elevated: #FFFFFF;
--text-on-light-primary: #1C1C1E;
--text-on-light-secondary: #6B6B6F;
--watermark-on-light: rgba(0, 0, 0, 0.02);

/* 액센트 */
--accent-copper: #C47D4A;
--accent-copper-light: #D4956A;
--accent-copper-dark: #A0623A;

/* 호버 상태 */
--hover-bg: #FFFFFF;
--hover-text: #1C1C1E;
```

#### 타이포그래피

```css
/* 섹션 넘버 - 좌측 대형 번호 (01, 02, 03...) */
--font-number: 'Playfair Display', serif;
--font-number-size: clamp(64px, 8vw, 96px);
--font-number-weight: 300;
--font-number-line-height: 1;

/* 섹션 헤딩 - 영문 대문자 (R E P O R T, L O C A T I O N) */
--font-heading: 'Cormorant Garamond', serif;
--font-heading-size: clamp(12px, 1.5vw, 14px);
--font-heading-weight: 600;
--font-heading-letter-spacing: 0.3em;
--font-heading-transform: uppercase;

/* 매물 주소/타이틀 - 큰 한글 텍스트 */
--font-title: 'Cormorant Garamond', 'Pretendard', serif;
--font-title-size: clamp(24px, 3.5vw, 42px);
--font-title-weight: 500;
--font-title-line-height: 1.3;

/* 서브 타이틀 */
--font-subtitle: 'Pretendard', sans-serif;
--font-subtitle-size: clamp(14px, 1.5vw, 18px);
--font-subtitle-weight: 400;
--font-subtitle-line-height: 1.6;

/* 본문 한국어 */
--font-body: 'Pretendard', sans-serif;
--font-body-size: 16px;
--font-body-weight: 400;
--font-body-line-height: 1.8;

/* 데이터/수치 */
--font-data: 'DM Sans', sans-serif;
--font-data-weight: 500;
--font-data-feature: 'tnum';

/* 워터마크 배경 텍스트 */
--font-watermark: 'Playfair Display', serif;
--font-watermark-size: clamp(120px, 20vw, 240px);
--font-watermark-weight: 700;
```

#### 여백 시스템

```css
--section-padding-y: clamp(80px, 12vh, 160px);
--section-padding-x: clamp(24px, 8vw, 120px);
--content-max-width: 1200px;
--element-gap-lg: 48px;
--element-gap-md: 32px;
--element-gap-sm: 16px;
--accent-line-width: 1px;
--accent-line-length: 60px;
```

#### 애니메이션

```css
--transition-hover: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--transition-fade-in: 0.6s ease-out;
--transition-slide-up: 0.8s cubic-bezier(0.16, 1, 0.3, 1);
--stagger-delay: 0.15s;  /* 순차 애니메이션 간격 */
```

### 5-3. 화면 1: 리포트 목록 페이지 (`/`)

전체 페이지가 풀스크린 섹션들의 수직 나열. 각 리포트가 뷰포트 높이(100vh)에 가까운 대형 섹션 하나를 차지.

#### 페이지 구조

```
[헤더 영역 - 고정 아님, 첫 화면에만]
  - 중앙 정렬
  - "-- L A N D B O O K --" (Cormorant Garamond, letter-spacing 0.3em, 14px)
  - "부동산 투자 분석 리포트" (Pretendard, 16px, --text-on-dark-secondary)
  - 배경: --bg-dark
  - 높이: 30vh
  - 하단에 스크롤 유도 아이콘 (얇은 라인 화살표, 코퍼 색)

[리포트 섹션 01 - 다크]
[리포트 섹션 02 - 라이트]
[리포트 섹션 03 - 다크]
... (교차 반복)

[푸터 영역]
  - "-- LANDBOOK by JWORKS --"
  - 배경: --bg-dark
  - 높이: 20vh
```

#### 리포트 섹션 상세 레이아웃 (홀수: 다크 배경, 이미지 좌측)

```
┌──────────────────────────────────────────────────────────┐
│ padding: var(--section-padding-y) var(--section-padding-x)│
│ background: var(--bg-dark)                                │
│ min-height: 70vh                                         │
│ position: relative                                       │
│ overflow: hidden                                         │
│ cursor: pointer                                          │
│                                                          │
│ ┌─ 워터마크 (position: absolute, z-index: 0) ──────────┐ │
│ │ "역삼동"                                              │ │
│ │ font: var(--font-watermark)                           │ │
│ │ color: var(--watermark-on-dark)                       │ │
│ │ right: -5%, top: 50%, transform: translateY(-50%)     │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ 콘텐츠 (position: relative, z-index: 1) ────────────┐ │
│ │                                                       │ │
│ │  ┌─ 좌측 넘버 칼럼 (width: 80px) ──┐                  │ │
│ │  │ "01"                            │                  │ │
│ │  │ font: var(--font-number)        │                  │ │
│ │  │ color: var(--text-on-dark-primary)                  │ │
│ │  │                                 │                  │ │
│ │  │ 아래에 수직 코퍼 라인 (1px, 40px)│                  │ │
│ │  │ color: var(--accent-copper)     │                  │ │
│ │  │                                 │                  │ │
│ │  │ "REPORT"                        │                  │ │
│ │  │ font-size: 10px                 │                  │ │
│ │  │ letter-spacing: 0.2em           │                  │ │
│ │  │ writing-mode: vertical-rl (선택)│                  │ │
│ │  └─────────────────────────────────┘                  │ │
│ │                                                       │ │
│ │  ┌─ 메인 콘텐츠 (flex, gap: 48px) ───────────────────┐│ │
│ │  │                                                    ││ │
│ │  │  ┌─ 썸네일 이미지 ───────────┐  ┌─ 텍스트 ──────┐ ││ │
│ │  │  │ width: 45%                │  │ width: 55%    │ ││ │
│ │  │  │ aspect-ratio: 4/3        │  │               │ ││ │
│ │  │  │ object-fit: cover        │  │ "강남구 역삼동 │ ││ │
│ │  │  │ border: none             │  │  123-45"      │ ││ │
│ │  │  │ filter: grayscale(15%)   │  │ font: title   │ ││ │
│ │  │  │                          │  │               │ ││ │
│ │  │  │ 호버시:                   │  │ ── (코퍼라인) │ ││ │
│ │  │  │  transform: scale(1.02)  │  │               │ ││ │
│ │  │  │  filter: grayscale(0%)   │  │ "오피스 빌딩  │ ││ │
│ │  │  │  transition: 0.4s ease   │  │  투자 분석"   │ ││ │
│ │  │  └──────────────────────────┘  │ font: subtitle│ ││ │
│ │  │                                │               │ ││ │
│ │  │                                │ "2026.04.29"  │ ││ │
│ │  │                                │ font: data    │ ││ │
│ │  │                                │ ── (코퍼라인) │ ││ │
│ │  │                                └───────────────┘ ││ │
│ │  └────────────────────────────────────────────────────┘│ │
│ └───────────────────────────────────────────────────────┘ │
│                                                          │
│ transition: background var(--transition-hover),           │
│             color var(--transition-hover)                 │
│                                                          │
│ &:hover {                                                │
│   background: var(--hover-bg)                            │
│   color: var(--hover-text)                               │
│   워터마크 color: rgba(0,0,0,0.03)으로 전환              │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
```

#### 리포트 섹션 (짝수: 라이트 배경, 이미지 우측)

- 배경: `var(--bg-light)`
- 텍스트: `var(--text-on-light-primary)`
- 썸네일과 텍스트 위치가 좌우 반전 (텍스트 좌, 이미지 우)
- 워터마크: `var(--watermark-on-light)`
- 호버: 동일하게 `#FFFFFF` 배경 + `#1C1C1E` 텍스트 (라이트는 변화 미세하므로 코퍼 액센트 라인이 더 굵어지고(2px) 썸네일 scale 효과로 차별화)

#### 모바일 반응형 (max-width: 768px)

- 섹션 레이아웃: flex-direction column (이미지 위, 텍스트 아래)
- 썸네일: width 100%, aspect-ratio 16/9
- 넘버링: font-size 48px
- padding: 48px 24px
- min-height: auto (콘텐츠에 맞춤)

#### 스크롤 진입 애니메이션 (Intersection Observer)

각 섹션이 뷰포트에 진입할 때:
1. `0ms` - 섹션 넘버 fade-in + translateY(20px → 0)
2. `150ms` - "REPORT" 라벨 fade-in
3. `300ms` - 코퍼 라인 width 0 → 60px 확장
4. `450ms` - 매물 주소 fade-in + translateY(30px → 0)
5. `600ms` - 서브타이틀, 날짜 fade-in
6. `750ms` - 썸네일 이미지 fade-in + scale(0.95 → 1)

모든 애니메이션: `var(--transition-slide-up)` 타이밍

### 5-4. 화면 2: 리포트 상세 뷰어 (`/r/{token}`)

#### 랜딩 (표지) - 뷰어 진입 시 첫 화면

```
┌──────────────────────────────────────────────┐
│ position: relative                           │
│ height: 100vh                                │
│ overflow: hidden                             │
│                                              │
│ ┌─ 배경 이미지 ──────────────────────────────┐│
│ │ 매물 대표 이미지                           ││
│ │ width: 100%, height: 100%                  ││
│ │ object-fit: cover                          ││
│ │ filter: brightness(0.3) grayscale(20%)     ││
│ └────────────────────────────────────────────┘│
│                                              │
│ ┌─ 오버레이 콘텐츠 (중앙 정렬) ──────────────┐│
│ │ position: absolute                         ││
│ │ inset: 0                                   ││
│ │ display: flex, align/justify: center       ││
│ │                                            ││
│ │ "── L A N D B O O K ──"                    ││
│ │ font: heading, color: --accent-copper      ││
│ │ margin-bottom: 48px                        ││
│ │                                            ││
│ │ "서울 강남구 역삼동 123-45"                 ││
│ │ font: title (42px), color: white           ││
│ │ margin-bottom: 16px                        ││
│ │                                            ││
│ │ "부동산 투자 가치 분석 리포트"               ││
│ │ font: subtitle, color: --text-on-dark-secondary ││
│ │ margin-bottom: 64px                        ││
│ │                                            ││
│ │ [리포트 열람하기]                           ││
│ │ border: 1px solid var(--accent-copper)      ││
│ │ color: var(--accent-copper)                ││
│ │ padding: 16px 48px                         ││
│ │ font: heading (letter-spacing 0.2em)       ││
│ │ background: transparent                    ││
│ │ hover: background var(--accent-copper),    ││
│ │        color white                         ││
│ │                                            ││
│ │ ──────────────                             ││
│ │ "JWORKS 부동산 컨설팅"                      ││
│ │ font: 12px, letter-spacing 0.15em          ││
│ │ color: --text-on-dark-secondary            ││
│ │ position: absolute, bottom: 48px           ││
│ └────────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

#### 북 뷰 (데스크톱 기본 모드)

FlipHTML5 스타일의 사실적 책장 넘기기를 **메인 열람 모드**로 사용.
데스크톱에서는 북 뷰가 기본, 모바일에서는 스크롤 뷰가 기본.

레퍼런스: FlipHTML5 브로셔 (https://fliphtml5.com) — 사실적 페이지 플립, 2페이지 펼침, 그림자/곡선 효과, 반응형

#### 스크롤 뷰 (모바일 기본 / 데스크톱 전환 모드)

표지 아래로 스크롤하면 리포트 콘텐츠가 섹션별로 나열됨.
업로드된 HTML의 `<div class="page">` 각각이 하나의 섹션이 됨.
목록 페이지와 동일한 다크/라이트 교차, 넘버링, 워터마크 디자인 시스템 적용.

각 페이지 섹션:
- 넘버: 01, 02, 03...
- 라벨: 페이지 내 첫 번째 h1/h2 태그에서 추출하여 레터스페이싱 헤딩으로 표시
- 콘텐츠: 해당 페이지의 HTML 콘텐츠를 서비스 디자인 시스템 위에 렌더링
- 이미지: 해당 페이지 내 이미지들을 에디토리얼 그리드로 배치

#### 북 뷰 상세 (turn.js)

```
┌──────────────────────────────────────────────────┐
│ background: #0C0C0E                              │
│ height: 100vh                                    │
│ display: flex, justify: center, align: center    │
│                                                  │
│ ┌─ 상단 바 ────────────────────────────────────┐ │
│ │ position: fixed, top: 0                      │ │
│ │ "LANDBOOK"  "역삼동 123-45"  "1/12"  [X]    │ │
│ │ background: rgba(12,12,14,0.9)               │ │
│ │ backdrop-filter: blur(20px)                  │ │
│ │ height: 56px                                 │ │
│ │ font: heading, 12px                          │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ 책 컨테이너 (turn.js) ──────────────────────┐ │
│ │ width: min(90vw, 1200px)                     │ │
│ │ height: min(70vh, 800px)                     │ │
│ │ perspective: 2000px                          │ │
│ │                                              │ │
│ │ ┌──────────────┐ ┌──────────────┐           │ │
│ │ │              │ │              │           │ │
│ │ │   좌측       │ │   우측       │           │ │
│ │ │   페이지     │ │   페이지     │           │ │
│ │ │              │ │              │           │ │
│ │ │ background:  │ │ background:  │           │ │
│ │ │  #FEFCF9    │ │  #FEFCF9    │           │ │
│ │ │ (종이 색)    │ │ (종이 색)    │           │ │
│ │ │              │ │              │           │ │
│ │ │ box-shadow:  │ │              │           │ │
│ │ │ inset -10px  │ │              │           │ │
│ │ │ 0 30px       │ │              │           │ │
│ │ │ rgba(0,0,0,  │ │              │           │ │
│ │ │ 0.15)        │ │              │           │ │
│ │ └──────────────┘ └──────────────┘           │ │
│ │                                              │ │
│ │ 페이지 넘김: 3D rotateY transform            │ │
│ │ 그림자: 넘기는 동안 동적 box-shadow           │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ◀  ● ● ● ○ ○ ○  ▶                              │
│ 페이지 인디케이터: gap 8px, 현재=코퍼, 나머지=gray │
│                                                  │
│ ┌─ 플로팅 액션 바 ─────────────────────────────┐ │
│ │ (하단 고정, 상세 아래 참조)                    │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

모바일 북 뷰: 1페이지씩 표시, 좌우 스와이프로 넘기기

#### 플로팅 액션 바 (스크롤뷰 + 북뷰 공통)

```
┌──────────────────────────────────────────────┐
│ position: fixed                              │
│ bottom: 24px                                 │
│ left: 50%, transform: translateX(-50%)       │
│ background: rgba(28, 28, 30, 0.85)           │
│ backdrop-filter: blur(20px)                  │
│ border: 1px solid rgba(196, 125, 74, 0.2)   │
│ border-radius: 16px                          │
│ padding: 12px 32px                           │
│ display: flex, gap: 24px                     │
│                                              │
│  [PDF 아이콘]  [공유 아이콘]  [뷰전환]  [목록] │
│   다운로드       공유        스크롤/북   돌아가기│
│                                              │
│ 각 버튼:                                     │
│   SVG 아이콘 (20px, stroke: --accent-copper) │
│   라벨 (10px, letter-spacing 0.1em)          │
│   hover: 아이콘 scale(1.1), color 밝아짐      │
│                                              │
│ 아이콘만 사용 (이모지 금지)                    │
│ Lucide Icons 또는 커스텀 SVG                  │
└──────────────────────────────────────────────┘
```

### 5-5. 화면 3: 원본 HTML (`/r/{token}/raw`)

```
┌──────────────────────────────────────────────┐
│ ┌─ 상단 바 ──────────────────────────────────┐│
│ │ height: 48px                               ││
│ │ background: var(--bg-dark)                 ││
│ │ "원본 보기"  [뷰어로 돌아가기 →]            ││
│ │ font: heading, 12px, letter-spacing 0.15em ││
│ └────────────────────────────────────────────┘│
│ ┌─ iframe ───────────────────────────────────┐│
│ │ width: 100%                                ││
│ │ height: calc(100vh - 48px)                 ││
│ │ border: none                               ││
│ │ src: /api/viewer/{token}/raw               ││
│ └────────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

### 5-6. 공유 모달 (클라이언트 뷰어용)

> SMS/이메일 발송은 관리자 전용. 클라이언트 뷰어의 공유 모달에는 카카오톡, 링크 복사, PDF 저장만 제공.

```
┌──────────────────────────────────────────────┐
│ 오버레이: rgba(0, 0, 0, 0.7)                 │
│ backdrop-filter: blur(10px)                  │
│                                              │
│ ┌─ 모달 ────────────────────────────────────┐│
│ │ background: var(--bg-dark)                ││
│ │ border: 1px solid rgba(196,125,74,0.15)   ││
│ │ border-radius: 12px                       ││
│ │ padding: 48px                             ││
│ │ width: min(480px, 90vw)                   ││
│ │                                           ││
│ │ "S H A R E" (heading, 코퍼, 중앙)         ││
│ │ "이 리포트를 공유하기" (subtitle, 중앙)     ││
│ │                                           ││
│ │ ── (코퍼 라인, 중앙, 60px) ──             ││
│ │                                           ││
│ │ ┌────────┐ ┌────────┐ ┌────────┐         ││
│ │ │카카오톡│ │링크 복사│ │PDF 저장│         ││
│ │ │ [SVG]  │ │ [SVG]  │ │ [SVG]  │         ││
│ │ └────────┘ └────────┘ └────────┘         ││
│ │                                           ││
│ │ 각 버튼:                                  ││
│ │   width: 100px, height: 100px             ││
│ │   border: 1px solid rgba(255,255,255,0.1) ││
│ │   border-radius: 12px                     ││
│ │   display: flex-col, center               ││
│ │   SVG 아이콘: 28px, --accent-copper       ││
│ │   라벨: 11px, letter-spacing 0.1em        ││
│ │   hover: border-color --accent-copper     ││
│ │          background rgba(196,125,74,0.05) ││
│ │                                           ││
│ │ ── (코퍼 라인) ──                         ││
│ │                                           ││
│ │ URL 표시:                                 ││
│ │ ┌──────────────────────────────────┐      ││
│ │ │ https://landbook.jworks.world/.. │      ││
│ │ │ background: rgba(255,255,255,0.05)│     ││
│ │ │ border-radius: 8px               │      ││
│ │ │ padding: 12px 16px               │      ││
│ │ │ font: DM Sans, 13px, monospace   │      ││
│ │ └──────────────────────────────────┘      ││
│ │                                           ││
│ │ [      전체 URL 복사      ]                ││
│ │ background: var(--accent-copper)           ││
│ │ color: white                              ││
│ │ border-radius: 8px                        ││
│ │ padding: 14px                             ││
│ │ font: heading, 12px, letter-spacing 0.15em││
│ │ width: 100%                               ││
│ └───────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

### 5-7. 글로벌 디자인 규칙

#### 아이콘
- 이모지 사용 금지. 모든 아이콘은 SVG (Lucide Icons 라이브러리 또는 커스텀 SVG)
- 아이콘 기본 사이즈: 20px (액션 바), 28px (모달 버튼)
- 아이콘 색상: `var(--accent-copper)` 또는 현재 텍스트 색상

#### 코퍼 액센트 라인
- 수평 라인: `width: 60px; height: 1px; background: var(--accent-copper);`
- 수직 라인: `width: 1px; height: 40px; background: var(--accent-copper);`
- 헤딩 아래, 섹션 구분, 날짜 옆에 사용

#### 사진 처리
- 다크 섹션: `filter: grayscale(15%);` 기본, 호버 시 `grayscale(0%)`
- 라이트 섹션: `box-shadow: 0 8px 32px rgba(0,0,0,0.08);`
- 전체: `transition: all var(--transition-hover);`

#### 스크롤 애니메이션 (Intersection Observer)
- threshold: 0.2 (20% 보일 때 트리거)
- 초기 상태: `opacity: 0; transform: translateY(30px);`
- 진입 상태: `opacity: 1; transform: translateY(0);`
- 순차 지연: `var(--stagger-delay)` 간격으로 자식 요소 순차 등장

#### 반응형 브레이크포인트
- 데스크톱: 1200px+
- 태블릿: 768px ~ 1199px
- 모바일: ~767px

## 6. 공유 및 외부 연동

### SMS 발송 (알리고 API)
- bulk-sms 프로젝트의 알리고 API 로직 재사용
- 관리자 상세 화면에서 수신번호 입력 → LMS 발송
- 메시지 템플릿: [LANDBOOK] 제목 + 주소 + 리포트 링크
- 발송 결과 sharedVia 이력에 저장

### 이메일 발송 (Nodemailer)
- 관리자 상세 화면에서 수신 이메일 입력
- 옵션: 링크만 포함 / PDF 첨부
- HTML 이메일 템플릿 (프리미엄 디자인: 다크 헤더 + 썸네일 + 링크 버튼)

### 카카오톡 공유 (Kakao SDK)
- 관리자: 카카오 공유 링크 생성
- 클라이언트 뷰어: 공유 모달에서 Kakao.Share.sendDefault 호출
- feed 타입: 썸네일 이미지 + 제목 + 설명 + "리포트 보기" 버튼

### OG 메타태그
- Express 미들웨어에서 뷰어 라우트 요청 시 User-Agent로 봇 감지
- 봇이면 OG 메타만 서빙, 일반 브라우저면 Vue SPA 서빙
- OG 이미지: 리포트 업로드 시 Puppeteer로 표지 기반 1200x630 자동 생성

## 7. 페이지 분할 전략

### 업로드 처리 흐름
1. ZIP 수신 → 해제 → index.html + images/ 추출
2. HTML 파싱: `<div class="page">` 또는 `<!-- page-break -->` 구분자 탐색
3. 구분자 기준으로 페이지별 HTML 분할 → pages/ 디렉토리에 저장
4. 첫 페이지 기반으로 표지 이미지 추출 (coverImage)
5. Puppeteer로 전체 HTML → PDF 변환
6. Puppeteer로 표지 기반 OG 이미지(1200x630) 생성

### HTML 작성 규칙 (관리자용)
- 각 페이지를 `<div class="page">...</div>`로 감쌈
- 이미지는 상대경로 `images/photo1.jpg`로 참조
- PDF 출력을 고려한 A4 비율 레이아웃

## 8. API 엔드포인트

### 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/login` | 관리자 로그인 (비밀번호 → JWT 토큰, 만료 7일) |

### 리포트 관리 (관리자, JWT 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/reports` | 리포트 목록 (페이지네이션, 검색) |
| POST | `/api/reports` | 리포트 등록 (multipart/form-data, ZIP 업로드) |
| GET | `/api/reports/:id` | 리포트 상세 (메타 + 통계) |
| PUT | `/api/reports/:id` | 리포트 수정 (제목, 설명, 주소, 활성 상태) |
| DELETE | `/api/reports/:id` | 리포트 삭제 (파일 포함) |
| GET | `/api/reports/:id/stats` | 리포트 통계 상세 (날짜별 조회수) |
| GET | `/api/dashboard` | 대시보드 KPI (총 리포트, 조회수, 다운로드, 7일 추이) |

### 공유 (관리자, JWT 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/reports/:id/share/sms` | SMS 발송 (body: { recipients: string[] }) |
| POST | `/api/reports/:id/share/email` | 이메일 발송 (body: { recipients: string[], attachPdf: boolean }) |

### 뷰어 (인증 불요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/viewer/:token` | 리포트 데이터 (메타 + 페이지 목록, 조회수 +1) |
| GET | `/api/viewer/:token/pages/:pageNum` | 개별 페이지 HTML 콘텐츠 |
| GET | `/api/viewer/:token/pdf` | PDF 다운로드 (다운로드 수 +1) |
| GET | `/api/viewer/:token/raw` | 원본 HTML 서빙 |
| GET | `/api/viewer/:token/images/:filename` | 이미지 파일 서빙 |
| POST | `/api/viewer/:token/share` | 공유 카운트 +1 (body: { type: 'kakao'|'link' }) |

### OG 메타 (인증 불요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/og/:token.png` | OG 이미지 서빙 |
| GET | `/r/:token` | 봇 → OG 메타 HTML, 브라우저 → Vue SPA |

### 공개 목록 (인증 불요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/public/reports` | 활성(isActive=true) 리포트 목록만 (제목, 주소, 썸네일, 토큰, 날짜) |

## 9. 통계 수집 모델

### ViewLog 스키마 (날짜별 통계 집계용)

```javascript
{
  _id: ObjectId,
  reportId: ObjectId,       // ref: Report
  date: String,             // 'YYYY-MM-DD'
  views: Number,            // 해당 날짜 조회수
  pdfDownloads: Number,     // 해당 날짜 다운로드 수
  shares: Number            // 해당 날짜 공유 수
}
```

- 조회/다운로드/공유 발생 시 해당 날짜의 ViewLog를 `$inc`로 업데이트 (upsert)
- Report.stats는 총합 캐시 (ViewLog 집계와 별개로 빠른 조회용)
- 대시보드 7일 추이: ViewLog에서 최근 7일 aggregate

### 조회수 카운팅 정책
- 같은 IP에서 같은 리포트를 10분 내 재조회 시 카운트하지 않음 (메모리 캐시)
- 봇 User-Agent는 카운트 제외

## 10. 에러 처리 및 제약

### 업로드 제약
- ZIP 최대 크기: 100MB
- 이미지 개수 제한: 최대 50개
- 허용 이미지 형식: jpg, jpeg, png, webp, gif, svg
- HTML 파일: 정확히 1개 필수

### 페이지 분할 폴백
- `<div class="page">` 또는 `<!-- page-break -->` 구분자가 없는 경우 → 전체 HTML을 1페이지로 처리
- 구분자가 1개인 경우 → 정상 분할
- 빈 페이지(콘텐츠 없는 div) → 자동 스킵

### 에러 시나리오

| 상황 | 처리 |
|------|------|
| ZIP 해제 실패 | 400 에러 + "유효하지 않은 ZIP 파일" 메시지 |
| HTML 파일 없음 | 400 에러 + "HTML 파일이 포함되어야 합니다" |
| PDF 생성 실패 | 리포트는 등록하되, pdfPath를 null로 저장. 관리자에게 알림. 다운로드 시 "PDF 준비 중" 표시 |
| SMS 발송 실패 | 실패 건수 표시 + 재발송 버튼 |
| 이메일 발송 실패 | 실패 건수 표시 + 재발송 버튼 |
| 비활성 리포트 접근 | 404 페이지 ("리포트를 찾을 수 없습니다") |
| 존재하지 않는 토큰 | 404 페이지 |

## 11. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 (관리자) | Vue 3 + Vite + Tailwind CSS |
| 프론트엔드 (뷰어) | Vue 3 + Vite + Tailwind CSS |
| 백엔드 | Node.js + Express.js |
| 데이터베이스 | MongoDB + Mongoose |
| PDF 생성 | Puppeteer |
| 책장 넘기기 | StPageFlip (순수 TypeScript, MIT 라이선스, jQuery 무의존) |
| SMS | 알리고 REST API |
| 이메일 | Nodemailer |
| 카카오 공유 | Kakao JavaScript SDK |
| 파일 처리 | adm-zip, cheerio (HTML 파싱) |
| 토큰 생성 | nanoid |
| 외부 접속 | Cloudflare Tunnel |
| 폰트 로딩 | Google Fonts CDN (font-display: swap) + Pretendard CDN |

> **책장 넘기기 라이브러리 선택 근거**: turn.js는 jQuery 의존성 + 상용 라이선스 문제가 있어 StPageFlip(순수 TS, MIT)을 사용. 3D 페이지 플립 효과를 CSS transform으로 구현하며, Vue 3와 자연스럽게 통합 가능.

## 12. 뷰어 렌더링 전략

### 스크롤 뷰에서의 HTML 렌더링
- 각 페이지의 HTML 콘텐츠를 **scoped iframe**으로 렌더링
- iframe 바깥 프레임(넘버링, 헤딩, 다크/라이트 배경)만 서비스 디자인 시스템 적용
- 원본 HTML의 스타일과 서비스 CSS가 충돌하지 않도록 완전 격리
- iframe 높이는 콘텐츠에 맞게 자동 조절 (postMessage 통신)

### 북 뷰에서의 HTML 렌더링
- 각 페이지를 Puppeteer로 이미지(PNG)로 미리 렌더링하여 저장
- StPageFlip에서는 이미지 기반으로 페이지 플립
- 이미지 기반이므로 HTML 스타일 충돌 없음, 플립 성능 최적

### 뷰 모드 자동 전환
- 데스크톱(1200px+): 북 뷰 기본
- 태블릿(768px~1199px): 스크롤 뷰 기본 (북 뷰 전환 가능)
- 모바일(~767px): 스크롤 뷰 전용 (북 뷰 버튼 숨김)

## 13. 목록 페이지 접근 정책

- `/` 목록 페이지는 **전체 공개** (isActive=true인 리포트만 노출)
- 목록에는 최소 정보만 표시: 썸네일, 주소, 제목, 날짜
- 상세 내용은 `/r/{token}` 토큰 링크에서만 열람 가능
- 목적: LandBook 서비스 자체의 포트폴리오/쇼케이스 역할

## 14. 포트 할당

| 포트 | 역할 |
|------|------|
| 8020 | API 서버 |
| 5200 | 관리자 프론트엔드 |
| 5201 | 뷰어 프론트엔드 |

## 15. URL 구조

| URL | 용도 |
|-----|------|
| `landbook.jworks.world/` | 리포트 목록 (공개, 활성 리포트만) |
| `landbook.jworks.world/r/{token}` | 리포트 상세 뷰어 |
| `landbook.jworks.world/r/{token}/raw` | 원본 HTML 보기 (디버깅/비교용, 뷰어에서 링크) |
| `landbook.jworks.world/og/{token}.png` | OG 이미지 |
| `landbook.jworks.world/api/*` | API 엔드포인트 |
| `landbook-admin.jworks.world/` | 관리자 화면 |
