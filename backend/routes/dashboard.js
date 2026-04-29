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
