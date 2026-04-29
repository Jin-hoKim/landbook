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
