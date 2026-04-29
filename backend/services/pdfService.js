const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

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

async function generatePdf(reportDir) {
  const htmlPath = path.join(reportDir, 'index.html');
  const pdfPath = path.join(reportDir, 'report.pdf');

  const htmlContent = await fs.readFile(htmlPath, 'utf-8');
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // 이미지 경로를 절대경로로 치환
    await page.evaluate((imgDir) => {
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          img.src = `file://${imgDir}/${src.replace(/^(\.\/)?images\//, '')}`;
        }
      });
    }, path.join(reportDir, 'images'));

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    return pdfPath;
  } finally {
    await page.close();
  }
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = { generatePdf, closeBrowser };
