const crypto = require('crypto');
const config = require('../config');

function generateAuthHeader(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function sendSms(recipients, message) {
  if (!config.solapi.apiKey || !config.solapi.apiSecret) {
    throw new Error('솔라피 API 키가 설정되지 않았습니다');
  }

  const auth = generateAuthHeader(config.solapi.apiKey, config.solapi.apiSecret);

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
        'Authorization': auth,
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
