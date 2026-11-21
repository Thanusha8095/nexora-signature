import { defineTheme } from '@hyper-elements/react';
import { getThemeRadiusPx, resolveBrandTheme } from '../core/themes.ts';
import type { ReportInputData, ThemeSpec } from '../core/types.ts';

/**
 * Builds a genuine @hyper-elements/react Theme from NEXORA's resolved Brand DNA & ThemeSpec.
 * All roots (<Email>, <Page>, <Document>, <Canvas>) consume this theme so typography,
 * surface colors, borders, and design tokens stay synchronized across all outputs.
 */
export function buildHyperTheme(report: ReportInputData) {
  const spec: ThemeSpec = resolveBrandTheme(report);
  const c = spec.colors;
  const cardRadius = getThemeRadiusPx(spec, 'md');

  return {
    spec,
    theme: defineTheme({
      colors: {
        background: c.canvas,
        surface: c.surface,
        elevated: c.elevated,
        foreground: c.text,
        muted: c.textMuted,
        primary: c.accent,
        primaryInk: c.accentInk,
        primaryForeground: c.accentText,
        secondary: c.secondary,
        border: c.border,
        positive: c.positive,
        warning: c.warning,
        critical: c.critical,
        tableHeaderBg: c.tableHeaderBg,
        tableHeaderText: c.tableHeaderText,
        tableStripeBg: c.tableStripeBg,
        chartRevenue: c.chartRevenue,
        chartExpense: c.chartExpense,
        chartProfit: c.chartProfit,
      },
      fonts: {
        body: spec.typography.bodyFont,
        heading: spec.typography.headingFont,
        mono: spec.typography.monoFont,
      },
      fontSizes: {
        body: 14,
      },
      lineHeights: {
        body: 1.6,
      },
      radii: {
        card: cardRadius,
      },
      elements: {
        Heading: {
          fontFamily: '{fonts.heading}',
          color: '{colors.foreground}',
        },
        Divider: {
          borderTop: { width: 1, style: 'solid', color: '{colors.border}' },
        },
        Table: {
          cellPadding: [10, 12],
          rowBorder: { width: 1, style: 'solid', color: '{colors.border}' },
        },
      },
      styles: {
        card: {
          backgroundColor: '{colors.surface}',
          border: { width: 1, style: 'solid', color: '{colors.border}' },
          borderRadius: cardRadius,
          padding: 20,
          gap: 12,
        },
        elevatedCard: {
          backgroundColor: '{colors.elevated}',
          border: { width: 1, style: 'solid', color: '{colors.border}' },
          borderRadius: cardRadius,
          padding: 20,
          gap: 12,
        },
      },
    }),
  };
}
