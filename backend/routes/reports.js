const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const { processZip } = require('../services/uploadService');
const { generatePdf } = require('../services/pdfService');
const { generateOgImage } = require('../services/ogService');
const { generatePageImages } = require('../services/pageImageService');
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

    // 페이지별 PNG 스크린샷 생성 (비동기, 북뷰용)
    generatePageImages(reportDir, pageCount)
      .catch(err => console.error('페이지 이미지 생성 실패:', err));

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
