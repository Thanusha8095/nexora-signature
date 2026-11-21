import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, type Browser } from 'playwright';
import { getAudienceEdition } from './src/core/audiences.ts';
import { sanitizeReportForAudience } from './src/core/redaction.ts';
import { escapeHtml, sanitizeFilename } from './src/core/security.ts';
import { resolveBrandTheme } from './src/core/themes.ts';
import type { ReportInputData } from './src/core/types.ts';
import { validateReportData } from './src/core/validation.ts';
import {
  renderEmailHtml,
  renderPlainTextEmail,
  renderPrintDocumentHtml,
  renderReportDesignJson,
  renderWebHtml,
} from './src/elements/renderers.ts';
import {
  renderNativeCanvasPng,
  renderNativeDocumentPdf,
} from './src/elements/serverRenderers.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

let browserPromise: Promise<Browser> | null = null;

function resolveChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && fs.existsSync(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const defaultExec = chromium.executablePath();
  if (defaultExec && fs.existsSync(defaultExec)) {
    return undefined;
  }
  const containerFallback = '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell';
  if (fs.existsSync(containerFallback)) {
    return containerFallback;
  }
  return undefined;
}

function launchChromium(): Promise<Browser> {
  const launchArgs =
    process.platform === 'linux'
      ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      : [];
  const executablePath = resolveChromiumExecutable();
  return chromium.launch({
    headless: true,
    args: launchArgs,
    ...(executablePath ? { executablePath } : {}),
  });
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchChromium().catch((err) => {
      browserPromise = null;
      throw new Error(
        `Playwright Chromium failed to launch (${err instanceof Error ? err.message : String(err)}). Run "npx playwright install chromium" and retry.`
      );
    });
  }
  const browser = await browserPromise;
  if (!browser.isConnected()) {
    browserPromise = launchChromium();
    return browserPromise;
  }
  return browser;
}

export async function generatePdfBuffer(report: ReportInputData): Promise<Buffer> {
  const { report: safeReport } = sanitizeReportForAudience(report);
  const audience = getAudienceEdition(safeReport.audienceEdition);
  const html = await renderPrintDocumentHtml(safeReport, { omitDomRunningChrome: true });
  const theme = resolveBrandTheme(safeReport);
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1024, height: 1448 },
    deviceScaleFactor: 2,
  });

  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page
      .evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ]);
        }
      })
      .catch(() => {});

    const companySafe = escapeHtml(safeReport.branding.companyName);
    const audienceSafe = escapeHtml(audience.shortLabel);
    const periodSafe = escapeHtml(safeReport.reportingPeriod);
    const themeSafe = escapeHtml(theme.name);

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: '16mm',
        right: '12mm',
        bottom: '16mm',
        left: '12mm',
      },
      headerTemplate: `<div style="width:100%;font-size:8px;font-family:sans-serif;color:${theme.colors.textMuted};padding:0 12mm;display:flex;justify-content:space-between;"><span>${companySafe} · ${audienceSafe} Edition</span><span>${periodSafe}</span></div>`,
      footerTemplate: `<div style="width:100%;font-size:8px;font-family:sans-serif;color:${theme.colors.textMuted};padding:0 12mm;display:flex;justify-content:space-between;"><span>NEXORA Signature · ${themeSafe}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    });

    return Buffer.from(pdfBytes);
  } finally {
    await context.close();
  }
}

export async function generatePngBuffer(
  report: ReportInputData,
  viewportWidth = 1080
): Promise<Buffer> {
  const html = await renderWebHtml(report);
  const browser = await getBrowser();
  const safeWidth = Math.min(1440, Math.max(390, Number(viewportWidth) || 1080));

  const context = await browser.newContext({
    viewport: { width: safeWidth, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page
      .evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ]);
        }
      })
      .catch(() => {});

    const pngBytes = await page.screenshot({
      fullPage: true,
      type: 'png',
    });

    return Buffer.from(pngBytes);
  } finally {
    await context.close();
  }
}

function parseAndValidateReport(req: Request, res: Response): ReportInputData | null {
  const report = req.body?.report as ReportInputData | undefined;
  if (!report || typeof report !== 'object') {
    res.status(400).json({ error: 'Request body must include a valid "report" object.' });
    return null;
  }
  const validation = validateReportData(report);
  if (!validation.valid) {
    res.status(422).json({
      error: 'Report validation failed.',
      errors: validation.errors,
    });
    return null;
  }
  return report;
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, engine: '@hyper-elements/react', renderer: 'playwright-chromium' });
  });

  app.post('/api/export/email-html', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-email`);
    const html = await renderEmailHtml(report);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
    res.send(html);
  });

  app.post('/api/export/plain-text', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-plain`);
    const text = await renderPlainTextEmail(report);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
    res.send(text);
  });

  app.post('/api/export/web-html', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-web`);
    const html = await renderWebHtml(report);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
    res.send(html);
  });

  app.post('/api/export/design-json', (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-design`);
    const json = renderReportDesignJson(report, req.body?.mode || 'web');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.send(JSON.stringify(json, null, 2));
  });

  app.post('/api/export/pdf', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-report`);
    try {
      const pdfBuffer = await generatePdfBuffer(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('PDF generation error:', err);
      res.status(500).json({ error: 'Failed to generate A4 PDF via Playwright Chromium.' });
    }
  });

  app.post('/api/export/native-pdf', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-native`);
    try {
      const { pdf } = await renderNativeDocumentPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(Buffer.from(pdf));
    } catch (err) {
      console.error('Native renderPdf error:', err);
      res.status(500).json({ error: 'Failed to generate native @hyper-elements/react/pdf output.' });
    }
  });

  app.post('/api/export/png', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-snapshot`);
    try {
      const pngBuffer = await generatePngBuffer(report, req.body?.viewportWidth);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.png"`);
      res.send(pngBuffer);
    } catch (err) {
      console.error('PNG generation error:', err);
      res.status(500).json({ error: 'Failed to capture PNG screenshot via Playwright Chromium.' });
    }
  });

  app.post('/api/export/canvas-png', async (req, res) => {
    const report = parseAndValidateReport(req, res);
    if (!report) return;
    const filename = sanitizeFilename(req.body?.filename || `${report.branding.companyName}-${report.reportingPeriod}-card`);
    try {
      const { image } = await renderNativeCanvasPng(report, { scale: 2, format: 'png' });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.png"`);
      res.send(Buffer.from(image));
    } catch (err) {
      console.error('Native renderImage error:', err);
      res.status(500).json({ error: 'Failed to render Canvas image via @hyper-elements/react/image.' });
    }
  });

  return app;
}

async function startServer() {
  const app = createApp();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORA Signature server listening on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    if (browserPromise) {
      const b = await browserPromise.catch(() => null);
      if (b) await b.close().catch(() => {});
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Only start listener if executed directly (cross-platform Windows/macOS/Linux)
const currentFilePath = path.normalize(fileURLToPath(import.meta.url));
const entryArgPath = process.argv[1] ? path.normalize(path.resolve(process.argv[1])) : '';
const isDirectRun =
  Boolean(entryArgPath) &&
  (process.platform === 'win32'
    ? entryArgPath.toLowerCase() === currentFilePath.toLowerCase()
    : entryArgPath === currentFilePath);

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start NEXORA Signature server:', err);
    process.exit(1);
  });
}
