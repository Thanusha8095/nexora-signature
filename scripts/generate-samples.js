// Renders every sample report to all formats into samples/rendered/<id>/.
// Run after `npm install`:  npm run samples
import { mkdir, writeFile } from 'node:fs/promises';
import { SAMPLE_REPORTS, validateReport, exportFilename } from '../shared/report.js';
import { renderEmailText, renderHtml } from '../server/templates/report.jsx';
import { closeBrowser, htmlToPdf, htmlToPng } from '../server/export.js';

try {
  for (const s of SAMPLE_REPORTS) {
    const check = validateReport(s.data);
    if (!check.ok) throw new Error(`Sample ${s.id} is invalid: ${JSON.stringify(check.errors)}`);
    const r = check.value;
    const dir = `samples/rendered/${s.id}`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/${exportFilename(r, 'email-html')}`, renderHtml(r, 'email'));
    await writeFile(`${dir}/${exportFilename(r, 'email-text')}`, renderEmailText(r));
    await writeFile(`${dir}/${exportFilename(r, 'web-html')}`, renderHtml(r, 'web'));
    await writeFile(`${dir}/${exportFilename(r, 'pdf')}`, await htmlToPdf(renderHtml(r, 'document'), r.footer.text));
    await writeFile(`${dir}/${exportFilename(r, 'png')}`, await htmlToPng(renderHtml(r, 'web')));
    console.log(`Rendered ${s.id} -> ${dir}`);
  }
} finally {
  await closeBrowser();
}
