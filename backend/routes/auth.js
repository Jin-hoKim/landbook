const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
  }
  const token = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
