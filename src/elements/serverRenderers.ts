import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { buildNexoraReportTree } from './NexoraReportDocument.tsx';
import { validateSafeImageDataUrl } from '../core/security.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type { ReportInputData } from '../core/types.ts';

interface FontFaceEntry {
  family: string;
  src: Uint8Array;
  weight?: number;
  style?: 'normal' | 'italic';
}

function readFirstExisting(paths: string[]): Uint8Array | null {
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  }
  return null;
}

export function loadDistinctThemeFonts(report: ReportInputData): FontFaceEntry[] {
  const theme = resolveBrandTheme(report);
  const fonts: FontFaceEntry[] = [];

  const sansRegular = readFirstExisting([
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'C:\\Windows\\Fonts\\arial.ttf',
  ]);
  const sansBold =
    readFirstExisting([
      '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      'C:\\Windows\\Fonts\\arialbd.ttf',
    ]) ?? sansRegular;

  const serifRegular =
    readFirstExisting([
      '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
      'C:\\Windows\\Fonts\\times.ttf',
    ]) ?? sansRegular;
  const serifBold =
    readFirstExisting([
      '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
      'C:\\Windows\\Fonts\\timesbd.ttf',
    ]) ?? serifRegular;

  const monoRegular =
    readFirstExisting([
      '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
    ]) ?? sansRegular;
  const monoBold =
    readFirstExisting([
      '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf',
      '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-SemiBold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf',
    ]) ?? monoRegular;

  const registerRole = (stack: string, reg: Uint8Array | null, bold: Uint8Array | null) => {
    const primary = stack.split(',')[0]?.replace(/['"]/g, '').trim();
    if (!primary || !reg) return;
    const b = bold ?? reg;
    fonts.push({ family: primary, src: reg, weight: 400, style: 'normal' });
    fonts.push({ family: primary, src: reg, weight: 500, style: 'normal' });
    fonts.push({ family: primary, src: b, weight: 600, style: 'normal' });
    fonts.push({ family: primary, src: b, weight: 700, style: 'normal' });
  };

  const headingIsSerif = /playfair|serif|georgia|broadsheet/i.test(theme.typography.headingFont);
  registerRole(
    theme.typography.headingFont,
    headingIsSerif ? serifRegular : sansRegular,
    headingIsSerif ? serifBold : sansBold
  );
  registerRole(theme.typography.bodyFont, sansRegular, sansBold);
  registerRole(theme.typography.monoFont, monoRegular, monoBold);

  return fonts;
}

function decodeSvgDataUrl(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:image\/svg\+xml(;charset=[^;,]+)?(;base64)?,(.*)$/i);
  if (!match) return null;
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? '';
  try {
    return isBase64
      ? Buffer.from(payload, 'base64').toString('utf8')
      : decodeURIComponent(payload);
  } catch {
    return null;
  }
}

export function rasterizeSvgLogoForNativeRender(report: ReportInputData): ReportInputData {
  const logoUrl = report.branding.logoDataUrl?.trim();
  if (!logoUrl || !/^data:image\/svg\+xml/i.test(logoUrl)) {
    return report;
  }
  const safety = validateSafeImageDataUrl(logoUrl);
  if (!safety.valid) {
    return {
      ...report,
      branding: { ...report.branding, logoDataUrl: '' },
    };
  }
  const svgMarkup = decodeSvgDataUrl(logoUrl);
  if (!svgMarkup) return report;

  try {
    const resvg = new Resvg(svgMarkup, {
      fitTo: { mode: 'width', value: 192 },
    });
    const rendered = resvg.render();
    const pngBase64 = rendered.asPng().toString('base64');
    return {
      ...report,
      branding: {
        ...report.branding,
        logoDataUrl: `data:image/png;base64,${pngBase64}`,
      },
    };
  } catch {
    return report;
  }
}

/**
 * Node-only native @hyper-elements/react/pdf renderer for <Document>.
 */
export async function renderNativeDocumentPdf(report: ReportInputData) {
  const { renderPdf } = await import('@hyper-elements/react/pdf');
  const prepared = rasterizeSvgLogoForNativeRender(report);
  const docElement = buildNexoraReportTree(prepared, 'document');
  const fonts = loadDistinctThemeFonts(prepared);
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
  const prepared = rasterizeSvgLogoForNativeRender(report);
  const canvasElement = buildNexoraReportTree(prepared, 'canvas');
  const fonts = loadDistinctThemeFonts(prepared);
  return renderImage(canvasElement, {
    fonts,
    scale: options?.scale ?? 2,
    format: options?.format ?? 'png',
  });
}
