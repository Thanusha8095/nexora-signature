// PDF and PNG generation with Playwright (Chromium).
// Hyper Elements only produces HTML; the browser turns that HTML into files.
import { chromium } from 'playwright';
import { escapeHtml } from '../shared/report.js';

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch().catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    browserPromise = null;
    if (b) await b.close();
  }
}

export async function htmlToPdf(html, footerText) {
  const browser = await getBrowser();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    const footer = `<div style="width:100%;font-size:9px;font-family:Arial,sans-serif;color:#667085;padding:0 12mm;display:flex;justify-content:space-between;">
<span>${escapeHtml(footerText)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: footer,
      margin: { top: '14mm', bottom: '18mm', left: '12mm', right: '12mm' },
    });
  } finally {
    await context.close();
  }
}

export async function htmlToPng(html) {
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: 960, height: 900 }, deviceScaleFactor: 2 });
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await page.screenshot({ fullPage: true, type: 'png' });
  } finally {
    await context.close();
  }
}
