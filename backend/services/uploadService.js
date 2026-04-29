const AdmZip = require('adm-zip');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs').promises;
const { nanoid } = require('nanoid');
const config = require('../config');

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_IMAGES = 50;

async function processZip(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // HTML 파일 찾기
  const htmlEntries = entries.filter(e =>
    !e.isDirectory && e.entryName.endsWith('.html')
  );
  if (htmlEntries.length === 0) {
    throw new Error('HTML 파일이 포함되어야 합니다');
  }
  if (htmlEntries.length > 1) {
    throw new Error('HTML 파일은 1개만 포함되어야 합니다');
  }

  // 이미지 파일 검증
  const imageEntries = entries.filter(e => {
    if (e.isDirectory) return false;
    const ext = path.extname(e.entryName).toLowerCase();
    return ALLOWED_IMAGE_EXTS.includes(ext);
  });
  if (imageEntries.length > MAX_IMAGES) {
    throw new Error(`이미지는 최대 ${MAX_IMAGES}개까지 허용됩니다`);
  }

  // 저장 디렉토리 생성
  const reportId = nanoid(12);
  const reportDir = path.join(config.uploadDir, reportId);
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(path.join(reportDir, 'images'), { recursive: true });
  await fs.mkdir(path.join(reportDir, 'pages'), { recursive: true });

  // 원본 ZIP 저장
  await fs.writeFile(path.join(reportDir, 'original.zip'), zipBuffer);

  // HTML 저장
  const htmlContent = htmlEntries[0].getData().toString('utf-8');
  await fs.writeFile(path.join(reportDir, 'index.html'), htmlContent);

  // 이미지 저장
  for (const entry of imageEntries) {
    const fileName = path.basename(entry.entryName);
    await fs.writeFile(path.join(reportDir, 'images', fileName), entry.getData());
  }

  // 페이지 분할
  const pages = splitPages(htmlContent);
  for (let i = 0; i < pages.length; i++) {
    await fs.writeFile(
      path.join(reportDir, 'pages', `page-${i + 1}.html`),
      pages[i]
    );
  }

  // 표지 이미지 추출 (첫 페이지의 첫 번째 img)
  const $ = cheerio.load(htmlContent);
  const firstImg = $('img').first().attr('src');
  const coverImage = firstImg
    ? path.join(reportDir, 'images', path.basename(firstImg))
    : '';

  return {
    reportId,
    reportDir,
    pageCount: pages.length,
    coverImage,
    htmlContent,
  };
}

function splitPages(html) {
  const $ = cheerio.load(html);
  const pageElements = $('.page');

  if (pageElements.length > 0) {
    // <div class="page"> 구분자 기반 분할
    return pageElements.map((_, el) => $.html(el)).get();
  }

  // page-break 주석 기반 분할
  const pageBreakPattern = /<!--\s*page-break\s*-->/gi;
  const parts = html.split(pageBreakPattern);
  if (parts.length > 1) {
    return parts.filter(p => p.trim());
  }

  // 구분자 없으면 전체를 1페이지로
  return [html];
}

module.exports = { processZip, splitPages };
