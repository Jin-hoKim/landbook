# LandBook 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부동산 매물 분석 리포트를 업로드하고, 프리미엄 뷰어로 열람/공유/PDF 다운로드할 수 있는 웹 서비스 구축

**Architecture:** Express API 서버 + 관리자 Vue SPA + 클라이언트 뷰어 Vue SPA 분리형. MongoDB에 리포트 메타데이터 저장, 파일은 로컬 uploads/ 디렉토리. Puppeteer로 PDF/OG 이미지 생성.

**Tech Stack:** Node.js, Express, MongoDB/Mongoose, Vue 3, Vite, Tailwind CSS, Puppeteer, StPageFlip, adm-zip, cheerio, nanoid, Nodemailer, Kakao SDK, 알리고 API

**Spec:** `docs/superpowers/specs/2026-04-29-landbook-design.md`
**Mockups:** `designs/` 폴더 (React 기반 오프라인 HTML — 디자인 레퍼런스 전용)

---

## File Structure

### Backend (`backend/`)

```
backend/
├── package.json
├── .env.example
├── app.js                      Express 앱 설정 (미들웨어, CORS, 라우트 마운트)
├── server.js                   서버 시작점 (포트 8020)
├── config/
│   └── index.js                환경변수 로딩 및 검증
├── middleware/
│   ├── auth.js                 JWT 인증 미들웨어
│   ├── viewCounter.js          조회수 카운팅 (IP 중복 방지)
│   └── ogDetector.js           봇/크롤러 감지 → OG 메타 서빙
├── models/
│   ├── Report.js               리포트 스키마
│   └── ViewLog.js              날짜별 통계 집계 스키마
├── routes/
│   ├── auth.js                 POST /api/auth/login
│   ├── reports.js              리포트 CRUD + 업로드 (관리자)
│   ├── share.js                SMS/이메일 발송 (관리자)
│   ├── viewer.js               뷰어 API (인증 불요)
│   └── dashboard.js            대시보드 KPI (관리자)
├── services/
│   ├── uploadService.js        ZIP 해제, 페이지 분할, 파일 저장
│   ├── pdfService.js           Puppeteer PDF 생성
│   ├── ogService.js            Puppeteer OG 이미지 생성
│   ├── smsService.js           알리고 API 연동
│   └── emailService.js         Nodemailer 이메일 발송
└── uploads/                    (gitignore) 업로드 파일 저장소
```

### Admin (`admin/`)

```
admin/
├── package.json
├── vite.config.js
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.js                 앱 진입점
│   ├── App.vue                 루트 컴포넌트
│   ├── router/
│   │   └── index.js            Vue Router 설정
│   ├── stores/
│   │   ├── auth.js             인증 스토어 (Pinia)
│   │   └── reports.js          리포트 데이터 스토어 (Pinia)
│   ├── api/
│   │   └── index.js            Axios 인스턴스 + API 함수
│   ├── components/
│   │   ├── AdminShell.vue      사이드바 + 탑바 레이아웃
│   │   ├── StatCard.vue        KPI 카드
│   │   ├── MiniChart.vue       조회수 추이 차트
│   │   └── SharePanel.vue      SMS/이메일/카카오/링크 공유 패널
│   └── views/
│       ├── LoginView.vue       로그인 페이지
│       ├── DashboardView.vue   대시보드
│       ├── ReportsView.vue     리포트 목록 테이블
│       ├── ReportDetailView.vue 리포트 상세 + 공유 + 통계
│       ├── ReportNewView.vue   리포트 등록 (ZIP 업로드 → 메타 입력)
│       └── SettingsView.vue    설정 (API 키, SMTP, 카카오)
```

### Viewer (`viewer/`)

```
viewer/
├── package.json
├── vite.config.js
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.js                 앱 진입점 (CSS 변수, 폰트 로딩)
│   ├── App.vue                 루트 컴포넌트
│   ├── router/
│   │   └── index.js            Vue Router 설정
│   ├── assets/
│   │   └── styles.css          CSS 변수 (디자인 토큰), 폰트 import
│   ├── composables/
│   │   ├── useScrollReveal.js  Intersection Observer 스크롤 애니메이션
│   │   └── useReport.js        리포트 데이터 fetch
│   ├── components/
│   │   ├── CopperLine.vue      코퍼 액센트 라인
│   │   ├── SectionNumber.vue   대형 섹션 넘버링 (01, 02...)
│   │   ├── Watermark.vue       배경 워터마크 텍스트
│   │   ├── FloatingBar.vue     하단 플로팅 액션 바
│   │   ├── ShareModal.vue      공유 모달 (카카오, 링크, PDF)
│   │   ├── BookViewer.vue      StPageFlip 책장 넘기기 뷰어
│   │   └── PageSection.vue     스크롤뷰 개별 페이지 섹션
│   └── views/
│       ├── ListPage.vue        리포트 목록 (에디토리얼 섹션)
│       ├── ViewerPage.vue      리포트 상세 (표지 → 스크롤/북 뷰)
│       └── RawPage.vue         원본 HTML iframe 뷰
```

---

## Chunk 1: 백엔드 코어 (서버 + DB + 업로드)

### Task 1: 프로젝트 초기화 및 Express 서버 셋업

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/config/index.js`
- Create: `backend/app.js`
- Create: `backend/server.js`
- Create: `.gitignore`

- [ ] **Step 1: backend 디렉토리에서 npm 초기화**

```bash
cd /Users/jhkim/Desktop/workspace/landbook/backend
npm init -y
npm install express mongoose cors dotenv multer nanoid jsonwebtoken bcryptjs
npm install -D nodemon
```

- [ ] **Step 2: .env.example 작성**

```env
PORT=8020
MONGODB_URI=mongodb://localhost:27017/landbook
JWT_SECRET=your-jwt-secret-here
ADMIN_PASSWORD=your-admin-password
UPLOAD_DIR=./uploads
MAX_ZIP_SIZE=104857600
ALIGO_API_KEY=
ALIGO_USER_ID=
ALIGO_SENDER=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
KAKAO_JS_KEY=
```

- [ ] **Step 3: config/index.js 작성**

```javascript
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 8020,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/landbook',
  jwtSecret: process.env.JWT_SECRET || 'landbook-dev-secret',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin1234',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),
  maxZipSize: parseInt(process.env.MAX_ZIP_SIZE) || 100 * 1024 * 1024,
  aligo: {
    apiKey: process.env.ALIGO_API_KEY,
    userId: process.env.ALIGO_USER_ID,
    sender: process.env.ALIGO_SENDER,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  kakaoJsKey: process.env.KAKAO_JS_KEY,
};
```

- [ ] **Step 4: app.js 작성**

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 이미지/PDF)
app.use('/uploads', express.static(config.uploadDir));

// 라우트 마운트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/share', require('./routes/share'));
app.use('/api/viewer', require('./routes/viewer'));

// 헬스체크
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
```

- [ ] **Step 5: server.js 작성**

```javascript
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');

mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB 연결 완료');
    app.listen(config.port, () => {
      console.log(`LandBook API 서버: http://localhost:${config.port}`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
  });
```

- [ ] **Step 6: .gitignore 작성 (루트)**

```
node_modules/
.env
uploads/
dist/
.DS_Store
*.log
```

- [ ] **Step 7: package.json에 스크립트 추가 후 서버 실행 테스트**

package.json scripts에 추가:
```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

실행: `cd backend && npm run dev`
확인: `curl http://localhost:8020/api/health` → `{"status":"ok"}`

- [ ] **Step 8: 커밋**

```bash
cd /Users/jhkim/Desktop/workspace/landbook
git add .gitignore backend/package.json backend/.env.example backend/config/ backend/app.js backend/server.js
git commit -m "$(cat <<'EOF'
[landbook] 프로젝트 초기화 및 Express 서버 셋업

- Express + MongoDB + CORS 기본 구성
- 환경변수 설정 (config/index.js)
- 헬스체크 엔드포인트
- 포트 8020

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: MongoDB 모델 (Report + ViewLog)

**Files:**
- Create: `backend/models/Report.js`
- Create: `backend/models/ViewLog.js`

- [ ] **Step 1: Report 모델 작성**

```javascript
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  coverImage: { type: String, default: '' },
  pageCount: { type: Number, default: 1 },
  filePath: { type: String, required: true },
  pdfPath: { type: String, default: null },
  ogImagePath: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  stats: {
    views: { type: Number, default: 0 },
    pdfDownloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  sharedVia: [{
    type: { type: String, enum: ['sms', 'email', 'kakao', 'link'] },
    target: String,
    sentAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
```

- [ ] **Step 2: ViewLog 모델 작성**

```javascript
const mongoose = require('mongoose');

const viewLogSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  views: { type: Number, default: 0 },
  pdfDownloads: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
});

viewLogSchema.index({ reportId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ViewLog', viewLogSchema);
```

- [ ] **Step 3: 커밋**

```bash
git add backend/models/
git commit -m "$(cat <<'EOF'
[landbook] Report, ViewLog MongoDB 모델 추가

- Report: 토큰, 메타정보, 통계, 공유이력
- ViewLog: 날짜별 조회/다운로드/공유 집계

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 인증 미들웨어 + 로그인 API

**Files:**
- Create: `backend/middleware/auth.js`
- Create: `backend/routes/auth.js`

- [ ] **Step 1: JWT 인증 미들웨어 작성**

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], config.jwtSecret);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
};
```

- [ ] **Step 2: 로그인 라우트 작성**

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
  }
  const token = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
```

- [ ] **Step 3: 테스트**

```bash
curl -X POST http://localhost:8020/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin1234"}'
```

Expected: `{"token":"eyJ..."}`

- [ ] **Step 4: 커밋**

```bash
git add backend/middleware/auth.js backend/routes/auth.js
git commit -m "$(cat <<'EOF'
[landbook] JWT 인증 미들웨어 및 로그인 API

- 환경변수 기반 단일 비밀번호 인증
- JWT 토큰 발급 (7일 만료)
- Bearer 토큰 검증 미들웨어

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 업로드 서비스 (ZIP 해제 + 페이지 분할)

**Files:**
- Create: `backend/services/uploadService.js`

- [ ] **Step 1: 의존성 설치**

```bash
cd /Users/jhkim/Desktop/workspace/landbook/backend
npm install adm-zip cheerio
```

- [ ] **Step 2: uploadService.js 작성**

```javascript
const AdmZip = require('adm-zip');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs').promises;
const { nanoid } = require('nanoid');
const config = require('../config');

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_IMAGES = 50;

async function processZip(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // HTML 파일 찾기
  const htmlEntries = entries.filter(e =>
    !e.isDirectory && e.entryName.endsWith('.html')
  );
  if (htmlEntries.length === 0) {
    throw new Error('HTML 파일이 포함되어야 합니다');
  }
  if (htmlEntries.length > 1) {
    throw new Error('HTML 파일은 1개만 포함되어야 합니다');
  }

  // 이미지 파일 검증
  const imageEntries = entries.filter(e => {
    if (e.isDirectory) return false;
    const ext = path.extname(e.entryName).toLowerCase();
    return ALLOWED_IMAGE_EXTS.includes(ext);
  });
  if (imageEntries.length > MAX_IMAGES) {
    throw new Error(`이미지는 최대 ${MAX_IMAGES}개까지 허용됩니다`);
  }

  // 저장 디렉토리 생성
  const reportId = nanoid(12);
  const reportDir = path.join(config.uploadDir, reportId);
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(path.join(reportDir, 'images'), { recursive: true });
  await fs.mkdir(path.join(reportDir, 'pages'), { recursive: true });

  // 원본 ZIP 저장
  await fs.writeFile(path.join(reportDir, 'original.zip'), zipBuffer);

  // HTML 저장
  const htmlContent = htmlEntries[0].getData().toString('utf-8');
  await fs.writeFile(path.join(reportDir, 'index.html'), htmlContent);

  // 이미지 저장
  for (const entry of imageEntries) {
    const fileName = path.basename(entry.entryName);
    await fs.writeFile(path.join(reportDir, 'images', fileName), entry.getData());
  }

  // 페이지 분할
  const pages = splitPages(htmlContent);
  for (let i = 0; i < pages.length; i++) {
    await fs.writeFile(
      path.join(reportDir, 'pages', `page-${i + 1}.html`),
      pages[i]
    );
  }

  // 표지 이미지 추출 (첫 페이지의 첫 번째 img)
  const $ = cheerio.load(htmlContent);
  const firstImg = $('img').first().attr('src');
  const coverImage = firstImg
    ? path.join(reportDir, 'images', path.basename(firstImg))
    : '';

  return {
    reportId,
    reportDir,
    pageCount: pages.length,
    coverImage,
    htmlContent,
  };
}

function splitPages(html) {
  const $ = cheerio.load(html);
  const pageElements = $('.page');

  if (pageElements.length > 0) {
    // <div class="page"> 구분자 기반 분할
    return pageElements.map((_, el) => $.html(el)).get();
  }

  // page-break 주석 기반 분할
  const pageBreakPattern = /<!--\s*page-break\s*-->/gi;
  const parts = html.split(pageBreakPattern);
  if (parts.length > 1) {
    return parts.filter(p => p.trim());
  }

  // 구분자 없으면 전체를 1페이지로
  return [html];
}

module.exports = { processZip, splitPages };
```

- [ ] **Step 3: 커밋**

```bash
git add backend/services/uploadService.js backend/package.json backend/package-lock.json
git commit -m "$(cat <<'EOF'
[landbook] 업로드 서비스 구현 (ZIP 해제 + 페이지 분할)

- ZIP 유효성 검증 (HTML 1개 필수, 이미지 50개 제한)
- nanoid 기반 리포트 디렉토리 생성
- .page 클래스 또는 page-break 주석 기반 페이지 분할
- 폴백: 구분자 없으면 1페이지로 처리

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: PDF 생성 서비스

**Files:**
- Create: `backend/services/pdfService.js`

- [ ] **Step 1: Puppeteer 설치**

```bash
cd /Users/jhkim/Desktop/workspace/landbook/backend
npm install puppeteer
```

- [ ] **Step 2: pdfService.js 작성**

```javascript
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function generatePdf(reportDir) {
  const htmlPath = path.join(reportDir, 'index.html');
  const pdfPath = path.join(reportDir, 'report.pdf');

  const htmlContent = await fs.readFile(htmlPath, 'utf-8');
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // 이미지 경로를 절대경로로 치환
    await page.evaluate((imgDir) => {
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          img.src = `file://${imgDir}/${src.replace(/^(\.\/)?images\//, '')}`;
        }
      });
    }, path.join(reportDir, 'images'));

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    return pdfPath;
  } finally {
    await page.close();
  }
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = { generatePdf, closeBrowser };
```

- [ ] **Step 3: 커밋**

```bash
git add backend/services/pdfService.js backend/package.json backend/package-lock.json
git commit -m "$(cat <<'EOF'
[landbook] Puppeteer PDF 생성 서비스

- HTML → A4 PDF 변환
- 이미지 절대경로 치환
- 브라우저 인스턴스 재사용

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: OG 이미지 생성 서비스

**Files:**
- Create: `backend/services/ogService.js`

- [ ] **Step 1: ogService.js 작성**

```javascript
const puppeteer = require('puppeteer');
const path = require('path');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function generateOgImage(reportDir, { title, address }) {
  const ogPath = path.join(reportDir, 'og-image.png');
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

    const html = `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Pretendard:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px;
      background: linear-gradient(135deg, #1a1a1d 0%, #0c0c0e 50%, #1a1a1d 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Pretendard', sans-serif;
      color: white;
      overflow: hidden;
      position: relative;
    }
    .watermark {
      position: absolute; right: -30px; top: 50%; transform: translateY(-50%);
      font-family: 'Playfair Display', serif; font-size: 200px; font-weight: 700;
      color: rgba(255,255,255,0.03); line-height: 1;
    }
    .content { position: relative; text-align: center; z-index: 1; }
    .brand { font-family: 'Cormorant Garamond', serif; font-size: 14px;
      letter-spacing: 0.4em; color: #C47D4A; font-weight: 600; margin-bottom: 32px; }
    .address { font-family: 'Cormorant Garamond', serif; font-size: 42px;
      font-weight: 500; line-height: 1.3; margin-bottom: 16px; }
    .line { width: 60px; height: 1px; background: #C47D4A; margin: 0 auto 20px; }
    .title { font-size: 18px; color: #9A9A9E; }
    .footer { position: absolute; bottom: 32px; left: 0; right: 0;
      text-align: center; font-size: 12px; color: #6B6B6F; letter-spacing: 0.15em; }
  </style>
</head>
<body>
  <div class="watermark">LANDBOOK</div>
  <div class="content">
    <div class="brand">── L A N D B O O K ──</div>
    <div class="address">${address}</div>
    <div class="line"></div>
    <div class="title">${title}</div>
  </div>
  <div class="footer">JWORKS 부동산 컨설팅</div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: ogPath, type: 'png' });

    return ogPath;
  } finally {
    await page.close();
  }
}

module.exports = { generateOgImage };
```

- [ ] **Step 2: 커밋**

```bash
git add backend/services/ogService.js
git commit -m "$(cat <<'EOF'
[landbook] OG 이미지 생성 서비스

- Puppeteer로 1200x630 OG 이미지 생성
- LandBook 브랜딩 디자인 (다크 배경, 코퍼 액센트)
- 매물 주소 + 타이틀 동적 렌더링

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: 리포트 CRUD 라우트

**Files:**
- Create: `backend/routes/reports.js`

- [ ] **Step 1: reports.js 작성**

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const { processZip } = require('../services/uploadService');
const { generatePdf } = require('../services/pdfService');
const { generateOgImage } = require('../services/ogService');
const config = require('../config');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxZipSize },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('ZIP 파일만 업로드 가능합니다'));
    }
  },
});

// 리포트 목록 (관리자)
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ reports, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 리포트 등록 (ZIP 업로드)
router.post('/', auth, upload.single('zip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ZIP 파일이 필요합니다' });
    }

    const { reportId, reportDir, pageCount, coverImage } = await processZip(req.file.buffer);

    // Report 생성 (제목/주소는 다음 단계에서 업데이트)
    const report = await Report.create({
      token: reportId,
      title: req.body.title || '새 리포트',
      description: req.body.description || '',
      address: req.body.address || '',
      coverImage,
      pageCount,
      filePath: reportDir,
      isActive: false, // 메타 입력 전까지 비활성
    });

    // PDF 생성 (비동기, 실패해도 리포트는 등록)
    generatePdf(reportDir)
      .then(pdfPath => Report.updateOne({ _id: report._id }, { pdfPath }))
      .catch(err => console.error('PDF 생성 실패:', err));

    // OG 이미지 생성 (비동기)
    generateOgImage(reportDir, { title: report.title, address: report.address })
      .then(ogPath => Report.updateOne({ _id: report._id }, { ogImagePath: ogPath }))
      .catch(err => console.error('OG 이미지 생성 실패:', err));

    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 리포트 상세 (관리자)
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).lean();
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 리포트 수정
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, address, isActive } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (address !== undefined) update.address = address;
    if (isActive !== undefined) update.isActive = isActive;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    // OG 이미지 재생성 (제목/주소 변경 시)
    if (title || address) {
      generateOgImage(report.filePath, { title: report.title, address: report.address })
        .then(ogPath => Report.updateOne({ _id: report._id }, { ogImagePath: ogPath }))
        .catch(err => console.error('OG 이미지 재생성 실패:', err));
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 리포트 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    // 파일 삭제
    await fs.rm(report.filePath, { recursive: true, force: true }).catch(() => {});

    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 리포트 통계 상세
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const ViewLog = require('../models/ViewLog');
    const report = await Report.findById(req.params.id).lean();
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    const logs = await ViewLog.find({ reportId: report._id })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    res.json({ report, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: 커밋**

```bash
git add backend/routes/reports.js
git commit -m "$(cat <<'EOF'
[landbook] 리포트 CRUD + ZIP 업로드 라우트

- GET/POST/PUT/DELETE /api/reports
- multer ZIP 업로드 → processZip → PDF/OG 비동기 생성
- 검색/필터/페이지네이션 지원
- 통계 상세 API (/api/reports/:id/stats)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: 뷰어 API 라우트 + OG 메타 미들웨어 + 조회수 카운터

**Files:**
- Create: `backend/routes/viewer.js`
- Create: `backend/middleware/viewCounter.js`
- Create: `backend/middleware/ogDetector.js`

- [ ] **Step 1: viewCounter 미들웨어 작성**

```javascript
// 같은 IP에서 같은 리포트를 10분 내 재조회 시 카운트 제외
const recentViews = new Map(); // key: `${ip}:${token}`, value: timestamp
const COOLDOWN = 10 * 60 * 1000; // 10분

// 1시간마다 오래된 항목 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of recentViews) {
    if (now - time > COOLDOWN) recentViews.delete(key);
  }
}, 60 * 60 * 1000);

function shouldCount(ip, token) {
  const key = `${ip}:${token}`;
  const last = recentViews.get(key);
  if (last && Date.now() - last < COOLDOWN) return false;
  recentViews.set(key, Date.now());
  return true;
}

module.exports = { shouldCount };
```

- [ ] **Step 2: ogDetector 미들웨어 작성**

```javascript
const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'kakaotalk-scrap', 'yeti', 'Daum', 'Baiduspider',
  'Googlebot', 'WhatsApp', 'TelegramBot', 'Discordbot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(p => userAgent.includes(p));
}

module.exports = { isBot };
```

- [ ] **Step 3: viewer.js 라우트 작성**

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const Report = require('../models/Report');
const ViewLog = require('../models/ViewLog');
const { shouldCount } = require('../middleware/viewCounter');
const router = express.Router();

// 공개 리포트 목록 (활성만)
router.get('/public', async (req, res) => {
  try {
    const reports = await Report.find({ isActive: true })
      .select('token title address coverImage pageCount createdAt stats.views')
      .sort('-createdAt')
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 리포트 데이터 (뷰어용)
router.get('/:token', async (req, res) => {
  try {
    const report = await Report.findOne({ token: req.params.token, isActive: true }).lean();
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    // 조회수 증가
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (shouldCount(ip, report.token)) {
      const today = new Date().toISOString().slice(0, 10);
      await Promise.all([
        Report.updateOne({ _id: report._id }, { $inc: { 'stats.views': 1 } }),
        ViewLog.updateOne(
          { reportId: report._id, date: today },
          { $inc: { views: 1 } },
          { upsert: true }
        ),
      ]);
    }

    // 페이지 목록
    const pagesDir = path.join(report.filePath, 'pages');
    let pages = [];
    try {
      const files = await fs.readdir(pagesDir);
      pages = files
        .filter(f => f.startsWith('page-') && f.endsWith('.html'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
    } catch {}

    res.json({
      token: report.token,
      title: report.title,
      description: report.description,
      address: report.address,
      coverImage: report.coverImage ? `/uploads/${report.token}/images/${path.basename(report.coverImage)}` : null,
      pageCount: report.pageCount,
      pages: pages.map((f, i) => ({ num: i + 1, file: f })),
      hasPdf: !!report.pdfPath,
      createdAt: report.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 개별 페이지 HTML
router.get('/:token/pages/:pageNum', async (req, res) => {
  try {
    const report = await Report.findOne({ token: req.params.token, isActive: true });
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    const pagePath = path.join(report.filePath, 'pages', `page-${req.params.pageNum}.html`);
    const content = await fs.readFile(pagePath, 'utf-8');
    res.type('html').send(content);
  } catch (err) {
    res.status(404).json({ error: '페이지를 찾을 수 없습니다' });
  }
});

// PDF 다운로드
router.get('/:token/pdf', async (req, res) => {
  try {
    const report = await Report.findOne({ token: req.params.token, isActive: true });
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });
    if (!report.pdfPath) return res.status(404).json({ error: 'PDF 준비 중입니다' });

    // 다운로드 카운트
    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      Report.updateOne({ _id: report._id }, { $inc: { 'stats.pdfDownloads': 1 } }),
      ViewLog.updateOne(
        { reportId: report._id, date: today },
        { $inc: { pdfDownloads: 1 } },
        { upsert: true }
      ),
    ]);

    res.download(report.pdfPath, `${report.title || 'report'}.pdf`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 원본 HTML 서빙
router.get('/:token/raw', async (req, res) => {
  try {
    const report = await Report.findOne({ token: req.params.token, isActive: true });
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    const htmlPath = path.join(report.filePath, 'index.html');
    const content = await fs.readFile(htmlPath, 'utf-8');

    // 이미지 경로를 서버 URL로 치환
    const fixedContent = content.replace(
      /src=["'](?:\.\/)?images\//g,
      `src="/uploads/${report.token}/images/`
    );
    res.type('html').send(fixedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 공유 카운트
router.post('/:token/share', async (req, res) => {
  try {
    const { type } = req.body;
    if (!['kakao', 'link'].includes(type)) {
      return res.status(400).json({ error: '유효하지 않은 공유 타입' });
    }
    const report = await Report.findOne({ token: req.params.token, isActive: true });
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      Report.updateOne({ _id: report._id }, { $inc: { 'stats.shares': 1 } }),
      ViewLog.updateOne(
        { reportId: report._id, date: today },
        { $inc: { shares: 1 } },
        { upsert: true }
      ),
    ]);

    res.json({ message: '공유 카운트 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 이미지 서빙
router.get('/:token/images/:filename', async (req, res) => {
  try {
    const report = await Report.findOne({ token: req.params.token });
    if (!report) return res.status(404).end();

    const imgPath = path.join(report.filePath, 'images', req.params.filename);
    res.sendFile(imgPath);
  } catch {
    res.status(404).end();
  }
});

module.exports = router;
```

- [ ] **Step 4: 커밋**

```bash
git add backend/routes/viewer.js backend/middleware/viewCounter.js backend/middleware/ogDetector.js
git commit -m "$(cat <<'EOF'
[landbook] 뷰어 API + 조회수 카운터 + 봇 감지

- 공개 리포트 목록 (활성만)
- 토큰 기반 리포트 데이터/페이지/PDF/원본HTML 서빙
- IP 기반 10분 쿨다운 조회수 카운팅
- 봇 User-Agent 패턴 감지

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: 대시보드 API + 공유 라우트 (SMS/이메일)

**Files:**
- Create: `backend/routes/dashboard.js`
- Create: `backend/routes/share.js`
- Create: `backend/services/smsService.js`
- Create: `backend/services/emailService.js`

- [ ] **Step 1: Nodemailer 설치**

```bash
cd /Users/jhkim/Desktop/workspace/landbook/backend
npm install nodemailer
```

- [ ] **Step 2: dashboard.js 작성**

```javascript
const express = require('express');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const ViewLog = require('../models/ViewLog');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [totalReports, allReports] = await Promise.all([
      Report.countDocuments(),
      Report.find().select('stats').lean(),
    ]);

    const totalViews = allReports.reduce((s, r) => s + (r.stats?.views || 0), 0);
    const totalDownloads = allReports.reduce((s, r) => s + (r.stats?.pdfDownloads || 0), 0);
    const totalShares = allReports.reduce((s, r) => s + (r.stats?.shares || 0), 0);

    // 최근 7일 추이
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const logs = await ViewLog.aggregate([
      { $match: { date: { $in: days } } },
      { $group: { _id: '$date', views: { $sum: '$views' }, downloads: { $sum: '$pdfDownloads' } } },
      { $sort: { _id: 1 } },
    ]);

    const trend = days.map(d => {
      const log = logs.find(l => l._id === d);
      return { date: d, views: log?.views || 0, downloads: log?.downloads || 0 };
    });

    res.json({ totalReports, totalViews, totalDownloads, totalShares, trend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: smsService.js 작성**

```javascript
const https = require('https');
const querystring = require('querystring');
const config = require('../config');

async function sendSms(recipients, message) {
  if (!config.aligo.apiKey) throw new Error('알리고 API 키가 설정되지 않았습니다');

  const results = [];
  for (const phone of recipients) {
    const data = querystring.stringify({
      key: config.aligo.apiKey,
      user_id: config.aligo.userId,
      sender: config.aligo.sender,
      receiver: phone.replace(/-/g, ''),
      msg: message,
      msg_type: 'LMS',
    });

    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'apis.aligo.in',
          path: '/send/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data),
          },
        }, res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({ result_code: -1, message: body }); }
          });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
      results.push({ phone, success: result.result_code === 1, result });
    } catch (err) {
      results.push({ phone, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = { sendSms };
```

- [ ] **Step 4: emailService.js 작성**

```javascript
const nodemailer = require('nodemailer');
const path = require('path');
const config = require('../config');

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

async function sendEmail({ to, subject, reportUrl, reportTitle, address, pdfPath, attachPdf }) {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:12px;letter-spacing:0.4em;color:#C47D4A;font-weight:600;">
        ── L A N D B O O K ──
      </div>
    </div>
    <div style="text-align:center;color:#F0EDE8;">
      <h1 style="font-size:28px;font-weight:500;margin:0 0 12px;">${address}</h1>
      <div style="width:60px;height:1px;background:#C47D4A;margin:0 auto 16px;"></div>
      <p style="color:#9A9A9E;font-size:16px;margin:0 0 40px;">${reportTitle}</p>
      <a href="${reportUrl}" style="display:inline-block;padding:16px 48px;border:1px solid #C47D4A;color:#C47D4A;text-decoration:none;font-size:12px;letter-spacing:0.3em;font-weight:600;">
        리포트 열람하기 →
      </a>
    </div>
    <div style="text-align:center;margin-top:60px;font-size:11px;color:#6B6B6F;">
      JWORKS 부동산 컨설팅
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: config.smtp.user,
    to,
    subject,
    html,
    attachments: attachPdf && pdfPath ? [{
      filename: `${reportTitle || 'report'}.pdf`,
      path: pdfPath,
    }] : [],
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
```

- [ ] **Step 5: share.js 라우트 작성**

```javascript
const express = require('express');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const { sendSms } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');
const router = express.Router();

// SMS 발송
router.post('/:id/sms', auth, async (req, res) => {
  try {
    const { recipients } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: '수신번호가 필요합니다' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    const reportUrl = `https://landbook.jworks.world/r/${report.token}`;
    const message = `[LANDBOOK] 부동산 투자 분석 리포트\n\n${report.address}\n${report.title}\n\n리포트 보기:\n${reportUrl}\n\nJWORKS 부동산 컨설팅`;

    const results = await sendSms(recipients, message);

    // 공유 이력 저장
    const shareEntries = recipients.map(phone => ({
      type: 'sms', target: phone, sentAt: new Date(),
    }));
    await Report.updateOne(
      { _id: report._id },
      { $push: { sharedVia: { $each: shareEntries } } }
    );

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 이메일 발송
router.post('/:id/email', auth, async (req, res) => {
  try {
    const { recipients, attachPdf } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: '수신 이메일이 필요합니다' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: '리포트를 찾을 수 없습니다' });

    const reportUrl = `https://landbook.jworks.world/r/${report.token}`;
    const results = [];

    for (const email of recipients) {
      try {
        await sendEmail({
          to: email,
          subject: `[LANDBOOK] ${report.address} - ${report.title}`,
          reportUrl,
          reportTitle: report.title,
          address: report.address,
          pdfPath: report.pdfPath,
          attachPdf: !!attachPdf,
        });
        results.push({ email, success: true });
      } catch (err) {
        results.push({ email, success: false, error: err.message });
      }
    }

    // 공유 이력 저장
    const shareEntries = recipients.map(email => ({
      type: 'email', target: email, sentAt: new Date(),
    }));
    await Report.updateOne(
      { _id: report._id },
      { $push: { sharedVia: { $each: shareEntries } } }
    );

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 6: app.js에 share 라우트 마운트 경로 수정**

app.js의 share 라우트를:
```javascript
app.use('/api/share', require('./routes/share'));
```
→ 변경:
```javascript
app.use('/api/reports', require('./routes/share'));
```

(share 라우트가 `/api/reports/:id/sms`, `/api/reports/:id/email` 형태이므로)

- [ ] **Step 7: 커밋**

```bash
git add backend/routes/dashboard.js backend/routes/share.js backend/services/smsService.js backend/services/emailService.js backend/app.js backend/package.json backend/package-lock.json
git commit -m "$(cat <<'EOF'
[landbook] 대시보드 API + SMS/이메일 공유 서비스

- 대시보드 KPI: 총 리포트/조회수/다운로드/공유 + 7일 추이
- 알리고 API 기반 LMS 발송
- Nodemailer 이메일 발송 (프리미엄 HTML 템플릿, PDF 첨부 옵션)
- 공유 이력 sharedVia에 자동 기록

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Chunk 2: 뷰어 프론트엔드 (프리미엄 디자인)

### Task 10: 뷰어 Vue 프로젝트 초기화

**Files:**
- Create: `viewer/` 전체 Vite + Vue 3 + Tailwind 프로젝트

- [ ] **Step 1: Vite 프로젝트 생성**

```bash
cd /Users/jhkim/Desktop/workspace/landbook
npm create vite@latest viewer -- --template vue
cd viewer
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install vue-router@4 pinia axios
```

- [ ] **Step 2: vite.config.js 설정**

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5201,
    proxy: {
      '/api': 'http://localhost:8020',
      '/uploads': 'http://localhost:8020',
    },
    allowedHosts: true,
  },
});
```

- [ ] **Step 3: src/assets/styles.css 작성 (디자인 토큰)**

```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700&family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@300;400;500;700&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

:root {
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

  /* 여백 */
  --section-padding-y: clamp(80px, 12vh, 160px);
  --section-padding-x: clamp(24px, 8vw, 120px);
  --content-max-width: 1200px;
}

body {
  margin: 0;
  background: var(--bg-dark);
  font-family: 'Pretendard Variable', 'Pretendard', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: src/main.js 설정**

```javascript
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './assets/styles.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/ListPage.vue') },
    { path: '/r/:token', component: () => import('./views/ViewerPage.vue') },
    { path: '/r/:token/raw', component: () => import('./views/RawPage.vue') },
  ],
});

createApp(App).use(router).mount('#app');
```

- [ ] **Step 5: src/App.vue 작성**

```vue
<template>
  <router-view />
</template>
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/jhkim/Desktop/workspace/landbook
git add viewer/
git commit -m "$(cat <<'EOF'
[landbook] 뷰어 Vue 3 프로젝트 초기화

- Vite + Vue 3 + Tailwind CSS
- 디자인 토큰 CSS 변수 (컬러, 여백)
- Google Fonts + Pretendard CDN 폰트 로딩
- Vue Router 설정 (목록/뷰어/원본)
- API 프록시 → localhost:8020

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: 뷰어 공통 컴포넌트 (CopperLine, SectionNumber, Watermark, FloatingBar, ShareModal)

**Files:**
- Create: `viewer/src/components/CopperLine.vue`
- Create: `viewer/src/components/SectionNumber.vue`
- Create: `viewer/src/components/Watermark.vue`
- Create: `viewer/src/components/FloatingBar.vue`
- Create: `viewer/src/components/ShareModal.vue`
- Create: `viewer/src/composables/useScrollReveal.js`

- [ ] **Step 1: CopperLine.vue 작성**

목업 참고: `CopperLine({ width = 60, height = 1, vertical = false })`

```vue
<template>
  <span
    :style="{
      display: 'inline-block',
      width: vertical ? `${height}px` : `${width}px`,
      height: vertical ? `${width}px` : `${height}px`,
      background: 'var(--accent-copper)',
    }"
  />
</template>

<script setup>
defineProps({
  width: { type: Number, default: 60 },
  height: { type: Number, default: 1 },
  vertical: { type: Boolean, default: false },
});
</script>
```

- [ ] **Step 2: SectionNumber.vue 작성**

목업 참고: 좌측 넘버 칼럼 — Playfair Display, 56~84px, light weight + 수직 코퍼 라인 + "REPORT" 라벨

```vue
<template>
  <div class="flex flex-col gap-4 w-20 shrink-0">
    <div
      class="leading-none"
      :style="{
        fontFamily: '\'Playfair Display\', serif',
        fontSize: 'clamp(56px, 6vw, 84px)',
        fontWeight: 300,
        color: 'inherit',
      }"
    >
      {{ num }}
    </div>
    <CopperLine :width="40" vertical />
    <div
      :style="{
        fontFamily: '\'Cormorant Garamond\', serif',
        fontSize: '10px',
        letterSpacing: '0.25em',
        fontWeight: 600,
        color: 'inherit',
        opacity: 0.6,
      }"
    >
      {{ label }}
    </div>
  </div>
</template>

<script setup>
import CopperLine from './CopperLine.vue';

defineProps({
  num: { type: String, required: true },
  label: { type: String, default: 'REPORT' },
});
</script>
```

- [ ] **Step 3: Watermark.vue 작성**

```vue
<template>
  <div
    :style="{
      position: 'absolute',
      right: '-3%',
      top: '50%',
      transform: 'translateY(-50%)',
      fontFamily: '\'Playfair Display\', serif',
      fontSize: 'clamp(120px, 18vw, 220px)',
      fontWeight: 700,
      color: color,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      pointerEvents: 'none',
      zIndex: 0,
      whiteSpace: 'nowrap',
    }"
  >
    {{ text }}
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, required: true },
  color: { type: String, default: 'var(--watermark-on-dark)' },
});
</script>
```

- [ ] **Step 4: useScrollReveal.js 작성**

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useScrollReveal(options = {}) {
  const target = ref(null);
  const visible = ref(false);
  let observer = null;

  onMounted(() => {
    if (!target.value) return;
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) visible.value = true;
      },
      { threshold: options.threshold || 0.2 }
    );
    observer.observe(target.value);
  });

  onUnmounted(() => observer?.disconnect());

  return { target, visible };
}
```

- [ ] **Step 5: FloatingBar.vue 작성**

목업 참고: `FloatingBar({ onShare, onBack, onSwitch, view })` — rgba(28,28,30,0.9), backdrop-filter blur(20px), border-radius 16, 코퍼 보더

```vue
<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-7 z-50"
    :style="{
      background: 'rgba(28, 28, 30, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(196, 125, 74, 0.25)',
      borderRadius: '16px',
      padding: '12px 28px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    }"
  >
    <BarButton icon="M12 10v6m0 0l-3-3m3 3l3-3M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" label="PDF" @click="$emit('pdf')" />
    <BarButton icon="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" label="SHARE" @click="$emit('share')" />
    <BarButton
      :icon="view === 'scroll' ? 'M4 6h16M4 12h16M4 18h16' : 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'"
      :label="view === 'scroll' ? 'BOOK' : 'SCROLL'"
      @click="$emit('switch')"
    />
    <BarButton icon="M10 19l-7-7m0 0l7-7m-7 7h18" label="LIST" @click="$emit('back')" />
  </div>
</template>

<script setup>
defineProps({ view: { type: String, default: 'scroll' } });
defineEmits(['pdf', 'share', 'switch', 'back']);

const BarButton = {
  props: ['icon', 'label'],
  emits: ['click'],
  template: `
    <button
      @click="$emit('click')"
      class="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors duration-300 group"
      style="padding: 4px 8px;"
    >
      <svg class="text-[var(--accent-copper)] group-hover:scale-110 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path :d="icon" />
      </svg>
      <span
        style="font-family: 'Cormorant Garamond', serif; font-size: 9px; letter-spacing: 0.2em; font-weight: 600;"
        class="text-[var(--text-on-dark-primary)] group-hover:text-[var(--accent-copper)] transition-colors"
      >{{ label }}</span>
    </button>
  `,
};
</script>
```

- [ ] **Step 6: ShareModal.vue 작성**

목업 참고: `ShareModal({ open, onClose, report })` — 3버튼(카카오, 링크, PDF) + URL 표시 + 복사 버튼. SMS/이메일 없음 (관리자 전용).

```vue
<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center z-[100]"
      style="background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);"
      @click="$emit('close')"
    >
      <div
        class="relative"
        style="background: var(--bg-dark); border: 1px solid rgba(196,125,74,0.18); border-radius: 12px; padding: 48px; width: min(480px, 90%);"
        @click.stop
      >
        <!-- 헤딩 -->
        <div class="text-center">
          <div style="font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: 0.4em; color: var(--accent-copper); font-weight: 600;">
            S H A R E
          </div>
          <div class="mt-2" style="font-size: 14px; color: var(--text-on-dark-secondary);">
            이 리포트를 공유하기
          </div>
          <CopperLine class="mx-auto my-6" />
        </div>

        <!-- 버튼 3개 -->
        <div class="flex justify-between gap-3 my-6">
          <ShareButton label="KAKAO" @click="shareKakao">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </ShareButton>
          <ShareButton label="LINK" @click="copyLink">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </ShareButton>
          <ShareButton label="PDF" @click="$emit('pdf')">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
          </ShareButton>
        </div>

        <CopperLine class="mx-auto my-6" />

        <!-- URL -->
        <div
          class="mb-4 overflow-hidden text-ellipsis whitespace-nowrap"
          style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px 16px; font-family: 'DM Sans', monospace; font-size: 12px; color: var(--text-on-dark-secondary);"
        >
          {{ shareUrl }}
        </div>
        <button
          @click="copyLink"
          class="w-full cursor-pointer"
          style="background: var(--accent-copper); color: white; border: none; border-radius: 8px; padding: 14px; font-family: 'Cormorant Garamond', serif; font-size: 12px; letter-spacing: 0.3em; font-weight: 600;"
        >
          {{ copied ? '복사 완료!' : '전체 URL 복사' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import CopperLine from './CopperLine.vue';

const props = defineProps({
  open: Boolean,
  token: String,
});
const emit = defineEmits(['close', 'pdf']);

const copied = ref(false);
const shareUrl = computed(() => `https://landbook.jworks.world/r/${props.token}`);

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
  // 공유 카운트
  fetch(`/api/viewer/${props.token}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'link' }),
  }).catch(() => {});
}

function shareKakao() {
  if (window.Kakao?.Share) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: document.title,
        description: 'JWORKS 부동산 컨설팅 리포트',
        imageUrl: `https://landbook.jworks.world/api/viewer/${props.token}/og`,
        link: { webUrl: shareUrl.value, mobileWebUrl: shareUrl.value },
      },
      buttons: [{ title: '리포트 보기', link: { webUrl: shareUrl.value, mobileWebUrl: shareUrl.value } }],
    });
  }
  fetch(`/api/viewer/${props.token}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'kakao' }),
  }).catch(() => {});
}

// ShareButton 인라인 컴포넌트
const ShareButton = {
  props: ['label'],
  emits: ['click'],
  template: `
    <button
      @click="$emit('click')"
      class="flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 hover:border-[var(--accent-copper)] hover:bg-[rgba(196,125,74,0.05)]"
      style="width: 100px; height: 100px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: transparent; color: var(--accent-copper);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <slot />
      </svg>
      <span style="font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 0.2em; font-weight: 600; color: var(--text-on-dark-primary);">
        {{ label }}
      </span>
    </button>
  `,
};
</script>
```

- [ ] **Step 7: 커밋**

```bash
git add viewer/src/components/ viewer/src/composables/
git commit -m "$(cat <<'EOF'
[landbook] 뷰어 공통 컴포넌트 구현

- CopperLine: 코퍼 액센트 라인 (수평/수직)
- SectionNumber: 대형 넘버링 + 코퍼 라인 + 라벨
- Watermark: 배경 워터마크 텍스트
- FloatingBar: 하단 플로팅 액션 바 (PDF/공유/뷰전환/목록)
- ShareModal: 공유 모달 (카카오/링크/PDF, SMS 없음)
- useScrollReveal: Intersection Observer 스크롤 애니메이션

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: 리포트 목록 페이지 (ListPage.vue)

**Files:**
- Create: `viewer/src/views/ListPage.vue`

- [ ] **Step 1: ListPage.vue 작성**

목업 참고: `ReportSection` — 다크/라이트 교차, 호버 시 배경 #FFFFFF + 텍스트 반전, 썸네일 scale(1.02), 워터마크 배경

이 파일은 목업의 `ListPage` + `ReportSection` + `ReportThumb` 컴포넌트를 Vue 3로 변환한 것. 핵심 구조:

- 헤더 (LANDBOOK 브랜딩)
- ReportSection 반복 (다크/라이트 교차)
- 각 섹션: SectionNumber + 썸네일 이미지 + 주소/타이틀/날짜
- 호버: 전체 배경 #FFF, 텍스트 다크로 전환
- 클릭: `/r/{token}` 라우팅
- 푸터

전체 코드는 목업의 JSX를 Vue template으로 1:1 변환하되, Tailwind 유틸리티 클래스와 CSS 변수를 활용. 스크롤 진입 애니메이션은 `useScrollReveal` 사용.

(코드 길이 관계상 상세 구현은 Task 실행 시 목업 코드를 직접 참조하여 Vue로 변환)

- [ ] **Step 2: 브라우저에서 확인**

`cd viewer && npm run dev` → `http://localhost:5201/`
백엔드 서버도 실행 중이어야 API 데이터 로딩 가능.

- [ ] **Step 3: 커밋**

```bash
git add viewer/src/views/ListPage.vue
git commit -m "$(cat <<'EOF'
[landbook] 리포트 목록 페이지 구현

- 에디토리얼 섹션 레이아웃 (다크/라이트 교차)
- 대형 넘버링 + 코퍼 라인 + 워터마크
- 호버 인터랙션 (배경/텍스트 반전, 썸네일 스케일)
- 스크롤 진입 애니메이션 (순차 fade-in)
- 반응형 (모바일: 세로 레이아웃)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: 뷰어 페이지 (ViewerPage.vue — 표지 + 스크롤뷰 + 북뷰)

**Files:**
- Create: `viewer/src/views/ViewerPage.vue`
- Create: `viewer/src/components/PageSection.vue`
- Create: `viewer/src/components/BookViewer.vue`

- [ ] **Step 1: npm install st-page-flip**

```bash
cd /Users/jhkim/Desktop/workspace/landbook/viewer
npm install page-flip
```

(`page-flip`은 StPageFlip의 npm 패키지명)

- [ ] **Step 2: PageSection.vue 작성**

목업 참고: `PageSection({ page, idx })` — 다크/라이트 교차, 워터마크, 넘버+라벨+본문+통계+이미지 플레이스홀더

스크롤 뷰에서 각 페이지를 표현하는 섹션 컴포넌트.

- [ ] **Step 3: BookViewer.vue 작성**

목업 참고: `BookViewer({ report, onBack, onShare, onSwitchToScroll })` — 상단 바 + page-flip 책 + 인디케이터 + FloatingBar

StPageFlip(page-flip 패키지)을 Vue 3에서 사용:
```javascript
import { PageFlip } from 'page-flip';
```

- [ ] **Step 4: ViewerPage.vue 작성**

표지(ViewerCover) + 스크롤뷰/북뷰 전환 + FloatingBar + ShareModal 통합.
- 데스크톱(1200px+): 북 뷰 기본
- 모바일: 스크롤 뷰 기본
- 뷰 전환 버튼

- [ ] **Step 5: 커밋**

```bash
git add viewer/src/views/ViewerPage.vue viewer/src/components/PageSection.vue viewer/src/components/BookViewer.vue viewer/package.json viewer/package-lock.json
git commit -m "$(cat <<'EOF'
[landbook] 리포트 뷰어 페이지 구현

- 표지 랜딩 (풀스크린, 다크 오버레이, 코퍼 브랜딩)
- 스크롤 뷰: 다크/라이트 섹션 교차 + 애니메이션
- 북 뷰: page-flip 기반 책장 넘기기 (데스크톱 기본)
- FloatingBar + ShareModal 통합
- 반응형 뷰 모드 자동 전환

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: 원본 HTML 페이지 (RawPage.vue)

**Files:**
- Create: `viewer/src/views/RawPage.vue`

- [ ] **Step 1: RawPage.vue 작성**

```vue
<template>
  <div class="h-screen flex flex-col">
    <header
      class="flex items-center justify-between px-8 shrink-0"
      style="height: 48px; background: var(--bg-dark); border-bottom: 1px solid rgba(255,255,255,0.06);"
    >
      <span style="font-family: 'Cormorant Garamond', serif; font-size: 12px; letter-spacing: 0.15em; color: var(--text-on-dark-secondary); font-weight: 600;">
        원본 보기
      </span>
      <router-link
        :to="`/r/${$route.params.token}`"
        class="no-underline"
        style="font-family: 'Cormorant Garamond', serif; font-size: 12px; letter-spacing: 0.15em; color: var(--accent-copper); font-weight: 600;"
      >
        뷰어로 돌아가기 →
      </router-link>
    </header>
    <iframe
      :src="`/api/viewer/${$route.params.token}/raw`"
      class="flex-1 w-full border-none"
    />
  </div>
</template>
```

- [ ] **Step 2: 커밋**

```bash
git add viewer/src/views/RawPage.vue
git commit -m "$(cat <<'EOF'
[landbook] 원본 HTML 뷰어 페이지

- iframe 기반 원본 HTML 렌더링
- 상단 바: "원본 보기" + "뷰어로 돌아가기" 링크

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Chunk 3: 관리자 프론트엔드

### Task 15: 관리자 Vue 프로젝트 초기화

**Files:**
- Create: `admin/` 전체 Vite + Vue 3 + Tailwind 프로젝트

- [ ] **Step 1: 프로젝트 생성**

```bash
cd /Users/jhkim/Desktop/workspace/landbook
npm create vite@latest admin -- --template vue
cd admin
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install vue-router@4 pinia axios
```

- [ ] **Step 2: vite.config.js 설정**

포트 5200, API 프록시 → localhost:8020

- [ ] **Step 3: 스타일 + 라우터 + main.js 설정**

관리자 디자인 토큰(목업 `adminTokens` 참고):
- bg: #F5F4F0
- surface: #FFFFFF
- copper: #C47D4A
- text: #1C1C1E

라우트: `/login`, `/`, `/reports`, `/reports/:id`, `/reports/new`, `/settings`

- [ ] **Step 4: 커밋**

---

### Task 16: 관리자 레이아웃 (AdminShell.vue) + 로그인

**Files:**
- Create: `admin/src/components/AdminShell.vue`
- Create: `admin/src/views/LoginView.vue`
- Create: `admin/src/stores/auth.js`
- Create: `admin/src/api/index.js`

목업 참고: `AdminShell({ active, children, page })` — 좌측 사이드바(240px, 다크) + 상단 탑바 + 메인 콘텐츠

- [ ] **Step 1 ~ 4**: AdminShell, LoginView, auth 스토어, API 인스턴스 작성 후 커밋

---

### Task 17: 대시보드 (DashboardView.vue)

**Files:**
- Create: `admin/src/views/DashboardView.vue`
- Create: `admin/src/components/StatCard.vue`
- Create: `admin/src/components/MiniChart.vue`

목업 참고: `AdminDashboard` — 4개 StatCard + MiniChart + 최근 리포트 목록

- [ ] **Step 1 ~ 3**: 컴포넌트 작성 후 커밋

---

### Task 18: 리포트 목록 (ReportsView.vue)

**Files:**
- Create: `admin/src/views/ReportsView.vue`

목업 참고: `AdminReportsList` — 필터 바(검색, 상태, 정렬) + 테이블 + 활성 토글 + 삭제

- [ ] **Step 1 ~ 2**: 구현 후 커밋

---

### Task 19: 리포트 등록 (ReportNewView.vue)

**Files:**
- Create: `admin/src/views/ReportNewView.vue`

목업 참고: `AdminNewReport` — Step 1(드래그앤드롭 ZIP 업로드) → Step 2(메타 입력 + 페이지 미리보기) → Step 3(완료 + 공유 링크)

- [ ] **Step 1 ~ 2**: 3단계 위자드 구현 후 커밋

---

### Task 20: 리포트 상세 (ReportDetailView.vue)

**Files:**
- Create: `admin/src/views/ReportDetailView.vue`
- Create: `admin/src/components/SharePanel.vue`

목업 참고: `AdminReportDetail` — 메타 편집 + 공유 패널(SMS/이메일/카카오/링크) + 통계 + 공유 이력

- [ ] **Step 1 ~ 3**: 구현 후 커밋

---

### Task 21: 설정 (SettingsView.vue)

**Files:**
- Create: `admin/src/views/SettingsView.vue`

목업 참고: `AdminSettings` — 4개 섹션(알리고, SMTP, 카카오, 비밀번호)

- [ ] **Step 1 ~ 2**: 구현 후 커밋

---

## Chunk 4: 통합 + OG 메타 + 배포

### Task 22: OG 메타태그 서버 사이드 처리

**Files:**
- Modify: `backend/app.js`

뷰어 라우트(`/r/:token`) 요청 시:
1. 봇이면 → OG 메타 HTML 응답
2. 브라우저면 → Vue SPA index.html 서빙

- [ ] **Step 1**: ogDetector + Express 미들웨어로 라우트 분기 추가
- [ ] **Step 2**: 커밋

---

### Task 23: 프로덕션 빌드 + 정적 파일 서빙

**Files:**
- Modify: `backend/app.js`
- Create: `scripts/build.sh`

```bash
#!/bin/bash
cd viewer && npm run build
cd ../admin && npm run build
```

Express에서:
- `viewer/dist`를 `/` 경로로 서빙
- `admin/dist`를 `/admin` 경로로 서빙 (또는 별도 서브도메인)

- [ ] **Step 1 ~ 3**: 빌드 스크립트 + 정적 서빙 설정 후 커밋

---

### Task 24: Cloudflare Tunnel 설정 + 외부 접속

- [ ] **Step 1**: `/tunnel` 스킬로 landbook.jworks.world 터널 설정
- [ ] **Step 2**: EXTERNAL_ACCESS.md 업데이트

---

### Task 25: 문서 업데이트 + 최종 커밋 + 푸시

**Files:**
- Create: `README.md`
- Create: `PLANNING.md`
- Create: `HISTORY.md`
- Modify: `/Users/jhkim/Desktop/workspace/CLAUDE.md` (프로젝트 테이블에 LandBook 추가)

- [ ] **Step 1**: README.md 작성 (프로젝트 개요, 기술 스택, 실행 방법, 포트, 기능)
- [ ] **Step 2**: PLANNING.md 작성 (구현 계획 요약, 진행 상태)
- [ ] **Step 3**: HISTORY.md 작성 (초기 구현 기록)
- [ ] **Step 4**: CLAUDE.md에 LandBook 프로젝트 추가 (포트 8020/5200/5201)
- [ ] **Step 5**: 최종 커밋 + `git push -u origin main`
