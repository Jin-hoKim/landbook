const https = require('https');
const querystring = require('querystring');
const config = require('../config');

async function sendSms(recipients, message) {
  if (!config.aligo.apiKey) throw new Error('알리고 API 키가 설정되지 않았습니다');

  const results = [];
  for (const phone of recipients) {
    const data = querystring.stringify({
      key: config.aligo.apiKey,
      user_id: config.aligo.userId,
      sender: config.aligo.sender,
      receiver: phone.replace(/-/g, ''),
      msg: message,
      msg_type: 'LMS',
    });

    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'apis.aligo.in',
          path: '/send/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data),
          },
        }, res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({ result_code: -1, message: body }); }
          });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
      results.push({ phone, success: result.result_code === 1, result });
    } catch (err) {
      results.push({ phone, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = { sendSms };
