import { sanitizeCssColor } from './security.ts';
import type {
  BrandFontPreset,
  ReportInputData,
  ReportThemeId,
  ThemeSpec,
} from './types.ts';

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
      accentText: '#0B1120',
      secondary: '#0891B2',
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
      chartProfit: '#0891B2',
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
      accentText: '#FFFFFF',
      secondary: '#5B21B6',
      border: '#E2E8F0',
      tableHeaderBg: '#0B1120',
      tableHeaderText: '#FFFFFF',
      tableStripeBg: '#F8FAFC',
      positive: '#0F766E',
      positiveBg: '#F0FDFA',
      warning: '#B45309',
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

export function resolveBrandTheme(report: ReportInputData): ThemeSpec {
  const base = REPORT_THEMES[report.theme] ?? REPORT_THEMES['midnight-luxe'];
  const fontPreset = report.branding.fontPreset;
  const coverOverride = report.branding.coverStyle;
  const safeAccent = sanitizeCssColor(report.branding.accentColor, base.colors.accent);

  const fontMeta =
    fontPreset && fontPreset !== 'theme-default' ? BRAND_FONT_PRESETS[fontPreset] : null;

  return {
    ...base,
    layoutStyle:
      coverOverride && coverOverride !== 'theme-default' ? coverOverride : base.layoutStyle,
    colors: {
      ...base.colors,
      accent: safeAccent,
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
