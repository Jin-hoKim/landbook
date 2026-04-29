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
