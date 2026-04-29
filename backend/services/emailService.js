const nodemailer = require('nodemailer');
const path = require('path');
const config = require('../config');

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

async function sendEmail({ to, subject, reportUrl, reportTitle, address, pdfPath, attachPdf }) {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:12px;letter-spacing:0.4em;color:#C47D4A;font-weight:600;">
        ── L A N D B O O K ──
      </div>
    </div>
    <div style="text-align:center;color:#F0EDE8;">
      <h1 style="font-size:28px;font-weight:500;margin:0 0 12px;">${address}</h1>
      <div style="width:60px;height:1px;background:#C47D4A;margin:0 auto 16px;"></div>
      <p style="color:#9A9A9E;font-size:16px;margin:0 0 40px;">${reportTitle}</p>
      <a href="${reportUrl}" style="display:inline-block;padding:16px 48px;border:1px solid #C47D4A;color:#C47D4A;text-decoration:none;font-size:12px;letter-spacing:0.3em;font-weight:600;">
        리포트 열람하기 →
      </a>
    </div>
    <div style="text-align:center;margin-top:60px;font-size:11px;color:#6B6B6F;">
      JWORKS 부동산 컨설팅
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: config.smtp.user,
    to,
    subject,
    html,
    attachments: attachPdf && pdfPath ? [{
      filename: `${reportTitle || 'report'}.pdf`,
      path: pdfPath,
    }] : [],
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
