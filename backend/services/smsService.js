const crypto = require('crypto');
const config = require('../config');

function generateSignature(apiKey, apiSecret, timestamp) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(timestamp + apiKey)
    .digest('hex');
}

async function sendSms(recipients, message) {
  if (!config.solapi.apiKey) throw new Error('솔라피 API 키가 설정되지 않았습니다');

  const timestamp = new Date().toISOString();
  const signature = generateSignature(config.solapi.apiKey, config.solapi.apiSecret, timestamp);

  const messages = recipients.map(phone => ({
    to: phone.replace(/-/g, ''),
    from: config.solapi.sender,
    text: message,
    type: 'LMS',
  }));

  try {
    const res = await fetch('https://api.solapi.com/messages/v4/send-many', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${config.solapi.apiKey}, date=${timestamp}, signature=${signature}`,
      },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();

    if (!res.ok) {
      return recipients.map(phone => ({
        phone,
        success: false,
        error: data.errorMessage || data.message || '발송 실패',
      }));
    }

    return recipients.map(phone => ({
      phone,
      success: true,
      result: data,
    }));
  } catch (err) {
    return recipients.map(phone => ({
      phone,
      success: false,
      error: err.message,
    }));
  }
}

module.exports = { sendSms };
