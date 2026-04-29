# LandBook — 부동산 투자 분석 리포트 서비스

부동산 매물 분석 리포트(HTML+이미지)를 업로드하면 프리미엄 뷰어로 열람/PDF 다운로드/공유할 수 있는 웹 서비스.

## 기술 스택

- 프론트엔드 (뷰어): Vue 3 + Vite + Tailwind CSS
- 프론트엔드 (관리자): Vue 3 + Vite + Tailwind CSS
- 백엔드: Node.js + Express.js
- 데이터베이스: MongoDB + Mongoose
- PDF: Puppeteer
- 책장 넘기기: StPageFlip (page-flip)
- SMS: 알리고 REST API
- 이메일: Nodemailer
- 공유: Kakao SDK

## 포트 할당

| 포트 | 역할 |
|------|------|
| 8020 | API 서버 |
| 5200 | 관리자 프론트엔드 |
| 5201 | 뷰어 프론트엔드 |

## 실행 방법

### 백엔드

```bash
cd backend
npm install
npm run dev
```

### 관리자 프론트엔드

```bash
cd admin
npm install
npm run dev
```

### 뷰어 프론트엔드

```bash
cd viewer
npm install
npm run dev
```

### 프로덕션 빌드

```bash
chmod +x scripts/build.sh
./scripts/build.sh
# 빌드 후 backend 서버가 viewer/dist, admin/dist를 정적 서빙
cd backend && node server.js
```

## 주요 기능

- ZIP(HTML+이미지) 업로드 → 자동 파싱/페이지 분할
- 프리미엄 뷰어: 에디토리얼 스크롤뷰 + 책장 넘기기 북뷰
- PDF 자동 생성 + 즉시 다운로드
- 공유: 카카오톡, 링크 복사 (클라이언트) + SMS, 이메일 (관리자)
- OG 메타태그: 카카오/슬랙 등 미리보기 자동 생성
- 통계: 조회수, 다운로드, 공유 추적
