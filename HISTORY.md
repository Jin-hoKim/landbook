# LandBook 변경 이력

## 2026-06-08 — 보안: 약한 기본 비밀번호/시크릿 가드 추가 (P0)

### 백엔드 (backend/)

- `config/index.js` — 운영 환경(NODE_ENV==='production')에서 ADMIN_PASSWORD/JWT_SECRET이 미설정이거나 알려진 약한 기본값(`admin1234`/`landbook-dev-secret`)이면 서버 시작을 거부(throw + 안내 로그). 개발 환경에서는 경고 로그만 출력하고 기존 동작 유지. 인증 로직은 변경하지 않고 가드만 추가.
- `.env.example` — JWT_SECRET/ADMIN_PASSWORD 항목에 "운영 시 반드시 변경" 보안 주석 추가.
- 검증: dev 기본값 → 경고 후 정상 로드, prod 약한값 → throw, prod 강한값 → 정상 로드 확인.

## 2026-04-29 — 프로젝트 전체 초기 구현

### 백엔드 (backend/)

- `app.js` — Express 앱 설정, CORS, 라우트 마운트, OG 이미지 서빙
- `server.js` — MongoDB 연결 + 서버 시작
- `config/index.js` — 환경변수 기반 설정 (포트, DB, JWT, 알리고, SMTP)
- `models/Report.js` — 리포트 스키마 (토큰, 제목, 주소, 페이지, PDF, OG, 통계, 공유)
- `models/ViewLog.js` — 조회 로그 스키마
- `routes/auth.js` — 관리자 로그인 (JWT 발급)
- `routes/reports.js` — 리포트 CRUD + ZIP 업로드
- `routes/viewer.js` — 토큰 기반 리포트 조회 API
- `routes/dashboard.js` — 대시보드 KPI API
- `routes/share.js` — SMS/이메일 공유 API
- `middleware/auth.js` — JWT 인증 미들웨어
- `middleware/viewCounter.js` — 조회수 카운터
- `middleware/ogDetector.js` — 봇 User-Agent 감지
- `services/uploadService.js` — ZIP 업로드/파싱
- `services/pdfService.js` — Puppeteer PDF 생성
- `services/ogService.js` — OG 이미지 생성
- `services/pageImageService.js` — 페이지별 PNG 생성
- `services/smsService.js` — 알리고 SMS 발송
- `services/emailService.js` — Nodemailer 이메일 발송

### 뷰어 (viewer/)

- Vue 3 + Vite + Tailwind CSS SPA
- 에디토리얼 스크롤뷰 + 책장 넘기기 북뷰
- PDF 다운로드, 카카오톡/링크 공유 모달
- 코퍼 액센트, Playfair/Cormorant/Pretendard 폰트

### 관리자 (admin/)

- Vue 3 + Vite + Tailwind CSS SPA
- 대시보드 (KPI 카드), 리포트 관리, ZIP 업로드
- SMS/이메일 공유 발송 기능

### 통합 (Task 22~25)

- `backend/app.js` — OG 메타태그 서버 사이드 처리 추가 (/r/:token 봇 감지)
- `backend/app.js` — 프로덕션 정적 서빙 추가 (viewer/dist, admin/dist, SPA 폴백)
- `scripts/build.sh` — 뷰어+관리자 빌드 스크립트 생성
- `README.md` — 프로젝트 문서 작성
- `PLANNING.md` — 구현 계획 및 진행 상태
- `HISTORY.md` — 변경 이력
