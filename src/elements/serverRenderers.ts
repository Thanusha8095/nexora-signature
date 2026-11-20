import fs from 'node:fs';
import { buildNexoraReportTree } from './NexoraReportDocument.tsx';
import { resolveBrandTheme } from '../core/themes.ts';
import type { ReportInputData } from '../core/types.ts';

function loadFallbackFonts(report: ReportInputData) {
  const theme = resolveBrandTheme(report);
  const candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    'C:\\Windows\\Fonts\\arial.ttf',
  ];
  const boldCandidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    'C:\\Windows\\Fonts\\arialbd.ttf',
  ];

  const regularPath = candidates.find((p) => fs.existsSync(p));
  const boldPath = boldCandidates.find((p) => fs.existsSync(p)) ?? regularPath;

  const fonts: { family: string; src: Uint8Array; weight?: number }[] = [];
  if (!regularPath) return fonts;

  const regularBuf = fs.readFileSync(regularPath);
  const boldBuf = boldPath ? fs.readFileSync(boldPath) : regularBuf;

  const families = new Set<string>();
  for (const stack of [
    theme.typography.bodyFont,
    theme.typography.headingFont,
    theme.typography.monoFont,
  ]) {
    const primary = stack.split(',')[0]?.replace(/['"]/g, '').trim();
    if (primary) families.add(primary);
  }

  for (const family of families) {
    fonts.push({ family, src: regularBuf, weight: 400 });
    fonts.push({ family, src: regularBuf, weight: 500 });
    fonts.push({ family, src: boldBuf, weight: 600 });
    fonts.push({ family, src: boldBuf, weight: 700 });
  }
  return fonts;
}

/**
 * Node-only native @hyper-elements/react/pdf renderer for <Document>.
 */
export async function renderNativeDocumentPdf(report: ReportInputData) {
  const { renderPdf } = await import('@hyper-elements/react/pdf');
  const docElement = buildNexoraReportTree(report, 'document');
  const fonts = loadFallbackFonts(report);
  return renderPdf(docElement, { fonts });
}

/**
 * Node-only native @hyper-elements/react/image renderer for <Canvas>.
 */
export async function renderNativeCanvasPng(
  report: ReportInputData,
  options?: { scale?: number; format?: 'png' | 'svg' }
) {
  const { renderImage } = await import('@hyper-elements/react/image');
  const canvasElement = buildNexoraReportTree(report, 'canvas');
  const fonts = loadFallbackFonts(report);
  return renderImage(canvasElement, {
    fonts,
    scale: options?.scale ?? 2,
    format: options?.format ?? 'png',
  });
}
