const puppeteer = require('puppeteer');
const path = require('path');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function generateOgImage(reportDir, { title, address }) {
  const ogPath = path.join(reportDir, 'og-image.png');
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

    const html = `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Pretendard:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px;
      background: linear-gradient(135deg, #1a1a1d 0%, #0c0c0e 50%, #1a1a1d 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Pretendard', sans-serif;
      color: white;
      overflow: hidden;
      position: relative;
    }
    .watermark {
      position: absolute; right: -30px; top: 50%; transform: translateY(-50%);
      font-family: 'Playfair Display', serif; font-size: 200px; font-weight: 700;
      color: rgba(255,255,255,0.03); line-height: 1;
    }
    .content { position: relative; text-align: center; z-index: 1; }
    .brand { font-family: 'Cormorant Garamond', serif; font-size: 14px;
      letter-spacing: 0.4em; color: #C47D4A; font-weight: 600; margin-bottom: 32px; }
    .address { font-family: 'Cormorant Garamond', serif; font-size: 42px;
      font-weight: 500; line-height: 1.3; margin-bottom: 16px; }
    .line { width: 60px; height: 1px; background: #C47D4A; margin: 0 auto 20px; }
    .title { font-size: 18px; color: #9A9A9E; }
    .footer { position: absolute; bottom: 32px; left: 0; right: 0;
      text-align: center; font-size: 12px; color: #6B6B6F; letter-spacing: 0.15em; }
  </style>
</head>
<body>
  <div class="watermark">LANDBOOK</div>
  <div class="content">
    <div class="brand">── L A N D B O O K ──</div>
    <div class="address">${address}</div>
    <div class="line"></div>
    <div class="title">${title}</div>
  </div>
  <div class="footer">JWORKS 부동산 컨설팅</div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: ogPath, type: 'png' });

    return ogPath;
  } finally {
    await page.close();
  }
}

module.exports = { generateOgImage };
