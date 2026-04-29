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
