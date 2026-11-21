import { sanitizeCssColor } from './security.ts';
import type {
  BrandFontPreset,
  ReportInputData,
  ReportThemeId,
  ThemeSpec,
} from './types.ts';

function parseHexRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function relativeLum([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function computeHexContrast(hexA: string, hexB: string): number {
  const rgbA = parseHexRgb(hexA);
  const rgbB = parseHexRgb(hexB);
  if (!rgbA || !rgbB) return 1;
  const l1 = relativeLum(rgbA);
  const l2 = relativeLum(rgbB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Adjusts a custom accent color when rendered as small text against canvas/surface/elevated
 * so it achieves at least targetRatio (default 4.5:1 WCAG AA).
 */
export function ensureAccessibleAccentInk(
  accentHex: string,
  backgrounds: string[],
  fallbackInk: string,
  targetRatio = 4.5
): string {
  const rgb = parseHexRgb(accentHex);
  if (!rgb) return fallbackInk;

  const minRatio = (candidate: string) =>
    Math.min(...backgrounds.map((bg) => computeHexContrast(candidate, bg)));

  if (minRatio(accentHex) >= targetRatio) {
    return accentHex.toUpperCase();
  }

  // Determine whether backgrounds are predominantly dark or light
  const avgBgLum =
    backgrounds.reduce((sum, bg) => {
      const bgRgb = parseHexRgb(bg);
      return sum + (bgRgb ? relativeLum(bgRgb) : 0.5);
    }, 0) / Math.max(1, backgrounds.length);

  const isDarkBg = avgBgLum < 0.25;
  const targetRgb: [number, number, number] = isDarkBg ? [255, 255, 255] : [11, 17, 32];

  // Binary / stepped mix toward light or dark until >= targetRatio
  for (let step = 5; step <= 100; step += 5) {
    const t = step / 100;
    const mixed: [number, number, number] = [
      rgb[0] + (targetRgb[0] - rgb[0]) * t,
      rgb[1] + (targetRgb[1] - rgb[1]) * t,
      rgb[2] + (targetRgb[2] - rgb[2]) * t,
    ];
    const hex = rgbToHex(mixed);
    if (minRatio(hex) >= targetRatio) {
      return hex;
    }
  }

  return fallbackInk;
}

export const REPORT_THEMES: Record<ReportThemeId, ThemeSpec> = {
  'midnight-luxe': {
    id: 'midnight-luxe',
    name: 'Midnight Luxe',
    subtitle: 'Architectural Dark Vault · Electric Lime',
    description:
      'Deep midnight navy canvas paired with warm ivory editorial serif typography, hairline vault borders, and high-contrast electric lime signal accents.',
    layoutStyle: 'architectural-dark',
    colors: {
      canvas: '#0B1120',
      surface: '#111A2E',
      elevated: '#17223B',
      text: '#F8F6F0',
      textMuted: '#94A3B8',
      accent: '#D4FF33',
      accentInk: '#D4FF33',
      accentText: '#0B1120',
      secondary: '#38BDF8',
      border: '#23304C',
      tableHeaderBg: '#17223B',
      tableHeaderText: '#D4FF33',
      tableStripeBg: '#0E1629',
      positive: '#D4FF33',
      positiveBg: '#1B2A1E',
      warning: '#FBBF24',
      warningBg: '#2B2314',
      critical: '#FB7185',
      criticalBg: '#2E1621',
      chartRevenue: '#D4FF33',
      chartExpense: '#0891B2',
      chartProfit: '#F8F6F0',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      monoFont: "'JetBrains Mono', ui-monospace, monospace",
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
    },
  },
  'editorial-ivory': {
    id: 'editorial-ivory',
    name: 'Editorial Ivory',
    subtitle: 'Broadsheet Annual Letter · Muted Gold',
    description:
      'Warm archival ivory paper with classic black editorial serifs, double-rule masthead framing, Roman-chapter hierarchy, and muted brass accents.',
    layoutStyle: 'editorial-broadsheet',
    colors: {
      canvas: '#F8F6F0',
      surface: '#FFFFFF',
      elevated: '#F1EDE3',
      text: '#141413',
      textMuted: '#57534E',
      accent: '#9A7B2C',
      accentInk: '#735814',
      accentText: '#FFFFFF',
      secondary: '#141413',
      border: '#DED7C8',
      tableHeaderBg: '#141413',
      tableHeaderText: '#F8F6F0',
      tableStripeBg: '#FAF8F3',
      positive: '#166534',
      positiveBg: '#ECFDF5',
      warning: '#92400E',
      warningBg: '#FEF3C7',
      critical: '#991B1B',
      criticalBg: '#FEE2E2',
      chartRevenue: '#141413',
      chartExpense: '#9A7B2C',
      chartProfit: '#0B6179',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      monoFont: "'JetBrains Mono', ui-monospace, monospace",
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..600&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap',
    },
  },
  'modern-signal': {
    id: 'modern-signal',
    name: 'Modern Signal',
    subtitle: 'Swiss Precision Grid · Cyan & Violet',
    description:
      'Crisp white surface architecture with deep executive navy headers, geometric sans typography, muted cyan telemetry, and violet analytical markers.',
    layoutStyle: 'swiss-precision',
    colors: {
      canvas: '#FFFFFF',
      surface: '#F8FAFC',
      elevated: '#EFF6FF',
      text: '#0F172A',
      textMuted: '#475569',
      accent: '#0891B2',
      accentInk: '#0B6179',
      accentText: '#FFFFFF',
      secondary: '#5B21B6',
      border: '#E2E8F0',
      tableHeaderBg: '#0B1120',
      tableHeaderText: '#FFFFFF',
      tableStripeBg: '#F8FAFC',
      positive: '#0F6B64',
      positiveBg: '#F0FDFA',
      warning: '#9A4407',
      warningBg: '#FFFBEB',
      critical: '#BE123C',
      criticalBg: '#FFF1F2',
      chartRevenue: '#0891B2',
      chartExpense: '#5B21B6',
      chartProfit: '#0B1120',
    },
    typography: {
      headingFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      bodyFont: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      monoFont: "'JetBrains Mono', ui-monospace, monospace",
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..600&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap',
    },
  },
};

export const BRAND_FONT_PRESETS: Record<
  Exclude<BrandFontPreset, 'theme-default'>,
  {
    id: Exclude<BrandFontPreset, 'theme-default'>;
    label: string;
    description: string;
    headingFont: string;
    bodyFont: string;
    googleFontsUrl: string;
  }
> = {
  'editorial-serif': {
    id: 'editorial-serif',
    label: 'Editorial Serif (Playfair + Plus Jakarta)',
    description: 'High-contrast executive serif headings paired with modern geometric body.',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  },
  'swiss-sans': {
    id: 'swiss-sans',
    label: 'Swiss Precision (Plus Jakarta + DM Sans)',
    description: 'Clean contemporary sans-serif hierarchy tailored for technology & SaaS.',
    headingFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFont: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..600&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap',
  },
  'classic-broadsheet': {
    id: 'classic-broadsheet',
    label: 'Classic Broadsheet (Playfair + DM Sans)',
    description: 'Shareholder-letter poise with crisp sans-serif financial prose.',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..600&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap',
  },
  'executive-mono': {
    id: 'executive-mono',
    label: 'Quantitative Ledger (Plus Jakarta + JetBrains)',
    description: 'Precision analytical aesthetic emphasizing tabular clarity.',
    headingFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  },
};

export const THEME_LIST: ThemeSpec[] = [
  REPORT_THEMES['midnight-luxe'],
  REPORT_THEMES['editorial-ivory'],
  REPORT_THEMES['modern-signal'],
];

export function applyThemePresetToReport(
  report: ReportInputData,
  themeId: ReportThemeId
): ReportInputData {
  const t = REPORT_THEMES[themeId] ?? REPORT_THEMES['midnight-luxe'];
  return {
    ...report,
    theme: themeId,
    branding: {
      ...report.branding,
      primaryColor: t.colors.canvas,
      accentColor: t.colors.accent,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function getThemeRadiusPx(theme: ThemeSpec, size: 'sm' | 'md' | 'lg' = 'md'): number {
  if (theme.layoutStyle === 'editorial-broadsheet') {
    return size === 'sm' ? 2 : 2;
  }
  if (theme.layoutStyle === 'swiss-precision') {
    return size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
  }
  return size === 'sm' ? 4 : size === 'lg' ? 10 : 8;
}

export function resolveBrandTheme(report: ReportInputData): ThemeSpec {
  const base = REPORT_THEMES[report.theme] ?? REPORT_THEMES['midnight-luxe'];
  const fontPreset = report.branding.fontPreset;
  const coverOverride = report.branding.coverStyle;
  const safeAccent = sanitizeCssColor(report.branding.accentColor, base.colors.accent);
  const resolvedAccentInk =
    safeAccent.toLowerCase() === base.colors.accent.toLowerCase()
      ? base.colors.accentInk
      : ensureAccessibleAccentInk(
          safeAccent,
          [base.colors.canvas, base.colors.surface, base.colors.elevated],
          base.colors.accentInk,
          4.5
        );

  const fontMeta =
    fontPreset && fontPreset !== 'theme-default' ? BRAND_FONT_PRESETS[fontPreset] : null;

  return {
    ...base,
    layoutStyle:
      coverOverride && coverOverride !== 'theme-default' ? coverOverride : base.layoutStyle,
    colors: {
      ...base.colors,
      accent: safeAccent,
      accentInk: resolvedAccentInk,
    },
    typography: fontMeta
      ? {
          ...base.typography,
          headingFont: fontMeta.headingFont,
          bodyFont: fontMeta.bodyFont,
          googleFontsUrl: fontMeta.googleFontsUrl,
        }
      : base.typography,
  };
}
