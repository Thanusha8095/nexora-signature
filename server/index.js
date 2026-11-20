// NEXORA export server. Plain node:http, no framework.
//   POST /api/render/:format   (email | web | document)  -> { html }
//   POST /api/export/:kind     (email-html | email-text | web-html | pdf | png) -> file download
//   GET  /api/health
// In production it also serves the built dashboard from ./dist.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPORT_KINDS, exportFilename, validateReport } from '../shared/report.js';
import { renderEmailText, renderHtml } from './templates/report.jsx';
import { closeBrowser, htmlToPdf, htmlToPng } from './export.js';

const PORT = Number(process.env.PORT) || 3001;
const MAX_BODY = 1_000_000;
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const FORMATS = ['email', 'web', 'document'];
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('Request body is not valid JSON.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') return sendJson(res, 200, { ok: true });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Use POST.' });

  const [, , action, name] = pathname.split('/');
  const body = await readJson(req);
  const check = validateReport(body);
  if (!check.ok) return sendJson(res, 400, { error: 'The report has errors.', errors: check.errors });
  const report = check.value;

  if (action === 'render' && FORMATS.includes(name)) {
    return sendJson(res, 200, { html: renderHtml(report, name) });
  }

  if (action === 'export' && EXPORT_KINDS[name]) {
    const kind = EXPORT_KINDS[name];
    let data;
    if (name === 'email-html') data = renderHtml(report, 'email');
    else if (name === 'email-text') data = renderEmailText(report);
    else if (name === 'web-html') data = renderHtml(report, 'web');
    else if (name === 'pdf') data = await htmlToPdf(renderHtml(report, 'document'), report.footer.text || report.company.name);
    else data = await htmlToPng(renderHtml(report, 'web'));

    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    if (buf.length === 0) return sendJson(res, 500, { error: 'The export came out empty.' });
    const filename = exportFilename(report, name);
    return send(res, 200, buf, {
      'Content-Type': kind.mime,
      'Content-Length': buf.length,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
  }

  return sendJson(res, 404, { error: 'Unknown endpoint.' });
}

async function serveStatic(res, pathname) {
  if (!existsSync(DIST)) {
    return send(res, 404, 'Dashboard not built. Run "npm run build", or use "npm run dev".', { 'Content-Type': 'text/plain' });
  }
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST, safe === '/' || safe === '\\' ? 'index.html' : safe);
  if (!file.startsWith(DIST) || !existsSync(file)) file = path.join(DIST, 'index.html');
  const data = await readFile(file);
  return send(res, 200, data, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    return await serveStatic(res, pathname);
  } catch (err) {
    console.error(`[nexora] ${req.method} ${pathname} failed:`, err);
    if (res.headersSent) return res.end();
    const status = err.status || 500;
    const message = status === 500 ? 'The export failed on the server. Check the server log for details.' : err.message;
    return sendJson(res, status, { error: message });
  }
});

server.listen(PORT, () => console.log(`[nexora] export server listening on http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    server.close();
    await closeBrowser();
    process.exit(0);
  });
}
