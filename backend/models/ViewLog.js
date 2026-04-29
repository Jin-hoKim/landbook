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
