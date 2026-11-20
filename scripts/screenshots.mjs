// Takes real screenshots of the running dashboard into docs/screenshots/.
// 1) npm run dev   2) in another terminal: npm run screenshots
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.NEXORA_URL || 'http://localhost:5173';
const OUT = 'docs/screenshots';

async function main() {
  const health = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!health || !health.ok) {
    console.error(`Could not reach the app at ${BASE}. Start it with "npm run dev" first.`);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Load a sample report' }).click();
    await page.getByRole('tab', { name: 'Email' }).click();
    await page.waitForFunction(() => document.querySelector('.preview-status')?.textContent === 'Up to date');
    await page.screenshot({ path: `${OUT}/studio-email.png` });
    await page.getByRole('tab', { name: 'Web page' }).click();
    await page.waitForFunction(() => document.querySelector('.preview-status')?.textContent === 'Up to date');
    await page.screenshot({ path: `${OUT}/studio-web.png` });
    await page.getByRole('tab', { name: 'PDF layout' }).click();
    await page.waitForFunction(() => document.querySelector('.preview-status')?.textContent === 'Up to date');
    await page.screenshot({ path: `${OUT}/studio-pdf.png` });
    await page.getByRole('button', { name: 'Templates' }).click();
    await page.screenshot({ path: `${OUT}/templates.png` });
    await page.getByRole('button', { name: 'Overview' }).click();
    await page.screenshot({ path: `${OUT}/overview.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Report studio' }).click();
    await page.screenshot({ path: `${OUT}/studio-mobile.png`, fullPage: false });
    console.log(`Saved screenshots to ${OUT}/`);
  } finally {
    await browser.close();
  }
}
main();
