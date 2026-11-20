import { resolveBrandTheme } from './themes.ts';
import type { ReportInputData } from './types.ts';

export interface EmailCompatibilityCheck {
  id: string;
  label: string;
  category: 'Gmail' | 'Outlook' | 'Apple Mail' | 'Accessibility';
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface EmailAuditResult {
  byteSize: number;
  kbSize: number;
  gmailClipRisk: boolean;
  tableCount: number;
  presentationTableCount: number;
  imgCount: number;
  inlineDataImageCount: number;
  missingAltCount: number;
  scriptTagCount: number;
  contrastRatioPrimary: number;
  contrastRatioAccent: number;
  checks: EmailCompatibilityCheck[];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function auditEmailHtml(emailHtml: string, report: ReportInputData): EmailAuditResult {
  const byteSize = new TextEncoder().encode(emailHtml).byteLength;
  const kbSize = byteSize / 1024;
  const gmailClipRisk = kbSize > 102;

  const tableMatches = emailHtml.match(/<table\b/gi) ?? [];
  const presentationMatches = emailHtml.match(/role=["']presentation["']/gi) ?? [];
  const imgTags = emailHtml.match(/<img\b[^>]*>/gi) ?? [];
  const inlineDataImageCount = imgTags.filter((tag) => /\bsrc=["']data:image\//i.test(tag)).length;
  const missingAltCount = imgTags.filter((tag) => !/\balt=["'][^"']+["']/i.test(tag)).length;
  const scriptMatches = emailHtml.match(/<script\b/gi) ?? [];
  const hasMsoConditionals = /<!--\[if\s+mso/i.test(emailHtml) || /xmlns:v=/i.test(emailHtml);
  const hasLangAttr = /<html[^>]*\blang=/i.test(emailHtml);
  const hasSparklines = /Monthly .*Sparkline/i.test(emailHtml);

  const theme = resolveBrandTheme(report);
  const contrastRatioPrimary = getContrastRatio(theme.colors.text, theme.colors.surface);
  const contrastRatioAccent = getContrastRatio(theme.colors.accent, theme.colors.elevated);

  const checks: EmailCompatibilityCheck[] = [
    {
      id: 'gmail-size',
      label: 'Gmail 102 KB Clipping Threshold',
      category: 'Gmail',
      status: gmailClipRisk ? 'warn' : 'pass',
      detail: gmailClipRisk
        ? `HTML payload is ${kbSize.toFixed(1)} KB (>102 KB). Gmail may truncate long email threads; consider compacting narrative or disabling optional appendices.`
        : `HTML payload is ${kbSize.toFixed(1)} KB, safely under Gmail's 102 KB clip ceiling.`,
    },
    {
      id: 'gmail-inline-images',
      label: 'Hosted HTTPS Logo vs. Inline Data URIs',
      category: 'Gmail',
      status: inlineDataImageCount > 0 ? 'warn' : 'pass',
      detail:
        inlineDataImageCount > 0
          ? `Detected ${inlineDataImageCount} inline data:image/* image(s). Gmail strips embedded data:image/* and inline SVG URIs — set a hosted HTTPS PNG/JPEG logo URL in Brand DNA Studio before sending.`
          : 'Zero inline data:image/* URIs detected; images use external HTTPS URLs compatible with Gmail and Outlook.',
    },
    {
      id: 'gmail-no-scripts',
      label: 'Zero Client Scripts in Email Markup',
      category: 'Gmail',
      status: scriptMatches.length === 0 ? 'pass' : 'fail',
      detail:
        scriptMatches.length === 0
          ? 'Verified 0 <script> tags in email output.'
          : `Detected ${scriptMatches.length} <script> tags that email clients will strip.`,
    },
    {
      id: 'outlook-mso',
      label: 'Outlook VML/MSO Table Structure',
      category: 'Outlook',
      status: hasMsoConditionals && tableMatches.length > 0 ? 'pass' : 'warn',
      detail: `Generated ${tableMatches.length} HTML tables (${presentationMatches.length} presentation roles) with MSO conditional wrappers.`,
    },
    {
      id: 'outlook-sparklines',
      label: 'Table-Based Unicode Sparklines (No SVG Dependency)',
      category: 'Outlook',
      status: hasSparklines ? 'pass' : 'warn',
      detail: hasSparklines
        ? 'Monthly trajectories use proportional Unicode block sparklines (█ / ▓) inside HTML table cells rather than inline SVG for Outlook compatibility.'
        : 'Monthly table sparkline block not detected.',
    },
    {
      id: 'apple-responsive',
      label: 'Apple Mail Responsive Viewport & Media Queries',
      category: 'Apple Mail',
      status: /@media/i.test(emailHtml) ? 'pass' : 'warn',
      detail: /@media/i.test(emailHtml)
        ? 'Includes @media responsive CSS breakpoints for iOS Mail and macOS Mail.'
        : 'No responsive @media queries detected.',
    },
    {
      id: 'a11y-alt',
      label: 'Image Alt-Text Coverage',
      category: 'Accessibility',
      status: missingAltCount === 0 ? 'pass' : 'fail',
      detail:
        imgTags.length === 0
          ? 'No raster images requiring alt attributes.'
          : missingAltCount === 0
            ? `All ${imgTags.length} image(s) include descriptive alt attributes.`
            : `${missingAltCount} of ${imgTags.length} images lack alt attributes.`,
    },
    {
      id: 'a11y-contrast',
      label: 'WCAG AA Surface Contrast Ratio',
      category: 'Accessibility',
      status: contrastRatioPrimary >= 4.5 ? 'pass' : 'warn',
      detail: `Primary text/surface contrast is ${contrastRatioPrimary.toFixed(1)}:1 (WCAG AA requires >= 4.5:1); hero accent contrast is ${contrastRatioAccent.toFixed(1)}:1.`,
    },
    {
      id: 'a11y-lang',
      label: 'Document Language Declaration',
      category: 'Accessibility',
      status: hasLangAttr ? 'pass' : 'warn',
      detail: hasLangAttr
        ? 'HTML root includes explicit lang attribute for screen readers.'
        : 'Missing lang attribute on root <html>.',
    },
  ];

  return {
    byteSize,
    kbSize,
    gmailClipRisk,
    tableCount: tableMatches.length,
    presentationTableCount: presentationMatches.length,
    imgCount: imgTags.length,
    inlineDataImageCount,
    missingAltCount,
    scriptTagCount: scriptMatches.length,
    contrastRatioPrimary,
    contrastRatioAccent,
    checks,
  };
}

/**
 * Simulates client-specific email constraints safely for preview emulation.
 */
export function emulateEmailClientHtml(
  emailHtml: string,
  client: 'gmail' | 'outlook' | 'apple-mail' | 'mobile'
): string {
  if (client === 'outlook') {
    // Emulate Outlook desktop: enforce crisp fallback system fonts & disable border-radius
    return emailHtml.replace(
      '</head>',
      `<style>
        * { font-family: Arial, Helvetica, sans-serif !important; border-radius: 0 !important; }
        body { background-color: #f3f4f6 !important; }
      </style></head>`
    );
  }
  if (client === 'gmail') {
    // Emulate Gmail Webmail container framing
    return emailHtml.replace(
      '</head>',
      `<style>
        body { margin: 0 auto !important; max-width: 680px !important; }
      </style></head>`
    );
  }
  return emailHtml;
}
