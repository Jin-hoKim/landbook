const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const Report = require('../models/Report');
const ViewLog = require('../models/ViewLog');
const { shouldCount } = require('../middleware/viewCounter');
const { isBot } = require('../middleware/ogDetector');
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

    // 조회수 증가 (봇 제외)
    const userAgent = req.headers['user-agent'] || '';
    if (!isBot(userAgent)) {
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

    // 페이지 이미지 목록 (북뷰용)
    const pageImagesDir = path.join(report.filePath, 'page-images');
    let pageImages = [];
    try {
      const imgFiles = await fs.readdir(pageImagesDir);
      pageImages = imgFiles
        .filter(f => f.startsWith('page-') && f.endsWith('.png'))
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
      pageImages: pageImages.map((f, i) => ({ num: i + 1, url: `/uploads/${report.token}/page-images/${f}` })),
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
