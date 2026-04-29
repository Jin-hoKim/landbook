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

/**
 * 북뷰용 페이지별 PNG 스크린샷 생성
 * @param {string} reportDir - 리포트 디렉토리 경로
 * @param {number} pageCount - 총 페이지 수
 * @returns {Promise<string[]>} 생성된 이미지 경로 배열
 */
async function generatePageImages(reportDir, pageCount) {
  const imagesDir = path.join(reportDir, 'page-images');
  await fs.mkdir(imagesDir, { recursive: true });

  const b = await getBrowser();
  const imagePaths = [];

  for (let i = 1; i <= pageCount; i++) {
    const pagePath = path.join(reportDir, 'pages', `page-${i}.html`);
    const outputPath = path.join(imagesDir, `page-${i}.png`);

    try {
      const htmlContent = await fs.readFile(pagePath, 'utf-8');
      const page = await b.newPage();

      try {
        // A4 비율에 가까운 뷰포트 설정 (1200 x 1697)
        await page.setViewport({ width: 1200, height: 1697, deviceScaleFactor: 1.5 });

        // 이미지 경로를 절대경로로 치환한 HTML 생성
        const fixedHtml = htmlContent.replace(
          /src=["'](?:\.\/)?images\//g,
          `src="file://${path.join(reportDir, 'images')}/`
        );

        await page.setContent(fixedHtml, { waitUntil: 'networkidle0', timeout: 15000 });
        await page.screenshot({ path: outputPath, type: 'png', fullPage: true });

        imagePaths.push(outputPath);
      } finally {
        await page.close();
      }
    } catch (err) {
      console.error(`페이지 ${i} 이미지 생성 실패:`, err.message);
    }
  }

  return imagePaths;
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = { generatePageImages, closeBrowser };
