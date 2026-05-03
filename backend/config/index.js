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
  solapi: {
    apiKey: process.env.SOLAPI_API_KEY,
    apiSecret: process.env.SOLAPI_API_SECRET,
    sender: process.env.SOLAPI_SENDER,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  kakaoJsKey: process.env.KAKAO_JS_KEY,
};
