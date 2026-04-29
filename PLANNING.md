# LandBook 구현 계획

## 아키텍처

```
landbook/
├── backend/          Express API 서버 (포트 8020)
│   ├── routes/       auth, reports, viewer, dashboard, share
│   ├── models/       Report, ViewLog (MongoDB)
│   ├── services/     upload, pdf, og, pageImage, sms, email
│   └── middleware/   auth(JWT), viewCounter, ogDetector
├── viewer/           뷰어 Vue 3 SPA (포트 5201)
├── admin/            관리자 Vue 3 SPA (포트 5200)
├── scripts/          빌드/배포 스크립트
└── designs/          디자인 토큰/가이드
```

## 구현 상태

### Phase 1: 백엔드 API — 완료
- [x] Express 서버 + MongoDB 연결
- [x] JWT 인증 (관리자 로그인)
- [x] 리포트 CRUD + ZIP 업로드/파싱
- [x] 뷰어 API (토큰 기반 리포트 조회)
- [x] Puppeteer PDF/OG이미지/페이지PNG 생성
- [x] 대시보드 KPI API
- [x] SMS(알리고)/이메일(Nodemailer) 공유

### Phase 2: 뷰어 프론트엔드 — 완료
- [x] 에디토리얼 스크롤뷰 (프리미엄 디자인)
- [x] 책장 넘기기 북뷰 (StPageFlip)
- [x] PDF 다운로드
- [x] 공유 모달 (카카오톡, 링크 복사)
- [x] 조회수/통계 트래킹

### Phase 3: 관리자 프론트엔드 — 완료
- [x] 대시보드 (KPI 카드, 차트)
- [x] 리포트 목록/상세 관리
- [x] ZIP 업로드 (드래그앤드롭)
- [x] SMS/이메일 공유 발송

### Phase 4: 통합 및 배포 — 완료
- [x] OG 메타태그 서버 사이드 처리 (/r/:token 봇 감지)
- [x] 프로덕션 빌드 스크립트 (scripts/build.sh)
- [x] 정적 파일 서빙 (viewer/dist → /, admin/dist → /admin)
- [x] SPA 폴백 라우팅
- [x] 프로젝트 문서 작성

## 디자인 토큰

- 액센트: 코퍼 (#B87333)
- 폰트: Playfair Display, Cormorant Garamond, Pretendard
- 스타일: 에디토리얼/매거진 프리미엄 톤
