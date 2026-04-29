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
