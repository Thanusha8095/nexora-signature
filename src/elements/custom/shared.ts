import { getAudienceEdition } from '../../core/audiences.ts';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../../core/calculations.ts';
import type {
  ComputedMetrics,
  ExecutiveInsight,
  LogoShape,
  MomentumSignal,
  ReportInputData,
  StrategicRecommendation,
  ThemeSpec,
  TrendAnalysisResult,
} from '../../core/types.ts';

export type HyperTarget = 'email' | 'web' | 'document' | 'canvas';

export interface SerializedReportPayload {
  report: ReportInputData;
  metrics: ComputedMetrics;
  trendAnalysis?: TrendAnalysisResult;
  insights: ExecutiveInsight[];
  recommendations: StrategicRecommendation[];
  accentOverride?: string;
}

export function parsePayload(raw: string): SerializedReportPayload | null {
  try {
    return JSON.parse(raw) as SerializedReportPayload;
  } catch {
    return null;
  }
}

export function getLogoRadiusPx(shape?: LogoShape): number {
  if (shape === 'circle') return 24;
  if (shape === 'square') return 2;
  return 8;
}

export function signalSymbol(signal: MomentumSignal): string {
  if (signal === 'Accelerating') return '▲';
  if (signal === 'Decelerating') return '▼';
  return '—';
}

export function signalHexColor(
  signal: MomentumSignal,
  c: ThemeSpec['colors'],
  metricId?: string
): string {
  if (metricId === 'expenses') {
    if (signal === 'Accelerating') return c.warning;
    if (signal === 'Decelerating') return c.positive;
    return c.textMuted;
  }
  if (signal === 'Accelerating') return c.positive;
  if (signal === 'Decelerating') return c.warning;
  return c.textMuted;
}

export function resolveHeroDetails(
  report: ReportInputData,
  metrics: ComputedMetrics
): {
  eyebrow: string;
  primaryFormatted: string;
  deltaFormatted: string;
  priorContext: string;
  secondaryLine: string;
  isPositive: boolean;
} {
  const audience = getAudienceEdition(report.audienceEdition);
  const cur = report.currency;

  if (audience.heroMetric === 'netProfit') {
    const delta = metrics.netProfit - metrics.previousNetProfit;
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatCurrency(metrics.netProfit, cur),
      deltaFormatted: formatPercent(metrics.profitGrowthPct, { signed: true }),
      priorContext: `${formatCurrency(delta, cur, { signed: true })} vs ${report.previousPeriodLabel} (${formatCurrency(metrics.previousNetProfit, cur)})`,
      secondaryLine: `Revenue: ${formatCurrency(report.currentPeriod.revenue, cur)} · Margin: ${formatPercent(metrics.profitMarginPct)}`,
      isPositive: (metrics.profitGrowthPct ?? 0) >= 0,
    };
  }

  if (audience.heroMetric === 'margin') {
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatPercent(metrics.profitMarginPct),
      deltaFormatted: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts`,
      priorContext: `vs ${formatPercent(metrics.previousProfitMarginPct)} in ${report.previousPeriodLabel}`,
      secondaryLine: `Revenue: ${formatCurrency(report.currentPeriod.revenue, cur)} · Net Profit: ${formatCurrency(metrics.netProfit, cur)}`,
      isPositive: metrics.marginDeltaPts >= 0,
    };
  }

  if (audience.heroMetric === 'customers') {
    const custDelta = report.currentPeriod.customerCount - report.previousPeriod.customerCount;
    const revStr = formatCurrency(report.currentPeriod.revenue, cur);
    const second = audience.redactInternalExpenses
      ? `Total Revenue: ${revStr} · Revenue Growth: ${formatPercent(metrics.revenueGrowthPct, { signed: true })}`
      : `Total Revenue: ${revStr} · Net Margin: ${formatPercent(metrics.profitMarginPct)}`;
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatNumber(report.currentPeriod.customerCount),
      deltaFormatted: formatPercent(metrics.customerGrowthPct, { signed: true }),
      priorContext: `${custDelta >= 0 ? '+' : ''}${formatNumber(custDelta)} vs ${report.previousPeriodLabel} (${formatNumber(report.previousPeriod.customerCount)})`,
      secondaryLine: second,
      isPositive: (metrics.customerGrowthPct ?? 0) >= 0,
    };
  }

  const revDelta = report.currentPeriod.revenue - report.previousPeriod.revenue;
  return {
    eyebrow: audience.heroLabel,
    primaryFormatted: formatCurrency(report.currentPeriod.revenue, cur),
    deltaFormatted: formatPercent(metrics.revenueGrowthPct, { signed: true }),
    priorContext: `${formatCurrency(revDelta, cur, { signed: true })} vs ${report.previousPeriodLabel} (${formatCurrency(report.previousPeriod.revenue, cur)})`,
    secondaryLine: audience.redactInternalExpenses
      ? `Customers: ${formatNumber(report.currentPeriod.customerCount)} · Status: ${metrics.healthStatus}`
      : `Net Profit: ${formatCurrency(metrics.netProfit, cur)} · Margin: ${formatPercent(metrics.profitMarginPct)}`,
    isPositive: (metrics.revenueGrowthPct ?? 0) >= 0,
  };
}
