const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { isBot } = require('./middleware/ogDetector');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 이미지/PDF)
app.use('/uploads', express.static(config.uploadDir));

// API 라우트 마운트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/viewer', require('./routes/viewer'));

// 대시보드 KPI + 공유(SMS/이메일) 라우트
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/share'));

// OG 이미지 서빙 (토큰 기반)
const Report = require('./models/Report');
app.get('/og/:token.png', async (req, res) => {
  try {
    const report = await Report.findOne({ token: req.params.token }).lean();
    if (!report || !report.ogImagePath) return res.status(404).end();
    res.sendFile(report.ogImagePath);
  } catch {
    res.status(404).end();
  }
});

// 헬스체크
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── OG 메타태그 서버 사이드 처리 (/r/:token) ───
app.get('/r/:token', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  if (isBot(ua)) {
    // 봇 → OG 메타 HTML 응답
    try {
      const report = await Report.findOne({ token: req.params.token }).lean();
      if (!report) return res.status(404).send('Not Found');

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const ogImage = report.ogImagePath
        ? `${baseUrl}/og/${report.token}.png`
        : '';
      const viewerUrl = `${baseUrl}/r/${report.token}`;

      return res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>${report.title} — LandBook</title>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${report.title}"/>
  <meta property="og:description" content="${report.description || report.address}"/>
  <meta property="og:url" content="${viewerUrl}"/>
  ${ogImage ? `<meta property="og:image" content="${ogImage}"/>` : ''}
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${report.title}"/>
  <meta name="twitter:description" content="${report.description || report.address}"/>
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}"/>` : ''}
</head>
<body></body>
</html>`);
    } catch {
      return res.status(500).send('Error');
    }
  }

  // 브라우저 → 정적 파일 서빙으로 폴백
  next();
});

// ─── 프로덕션 정적 서빙 ───
const viewerDist = path.join(__dirname, '..', 'viewer', 'dist');
const adminDist = path.join(__dirname, '..', 'admin', 'dist');

// 관리자 SPA
app.use('/admin', express.static(adminDist));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// 뷰어 SPA (가장 마지막에 마운트)
app.use(express.static(viewerDist));
app.get('*', (req, res) => {
  // API나 이미 처리된 경로는 건너뛰기
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/og/')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(viewerDist, 'index.html'));
});

module.exports = app;
