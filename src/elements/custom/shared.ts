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

export interface KpiStripCard {
  label: string;
  val: string;
  sub: string;
  positive: boolean;
}

export interface StoryArcChapter {
  step: string;
  body: string;
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
    const revG = metrics.revenueGrowthPct;
    const expG = metrics.expenseGrowthPct;
    const spreadTxt =
      revG !== null && expG !== null
        ? `Op Leverage: ${(revG - expG >= 0 ? '+' : '') + (revG - expG).toFixed(1)} pts`
        : `Margin: ${formatPercent(metrics.profitMarginPct)}`;
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatCurrency(metrics.netProfit, cur),
      deltaFormatted: formatPercent(metrics.profitGrowthPct, { signed: true }),
      priorContext: `${formatCurrency(delta, cur, { signed: true })} vs ${report.previousPeriodLabel} (${formatCurrency(metrics.previousNetProfit, cur)})`,
      secondaryLine: `Revenue: ${formatCurrency(report.currentPeriod.revenue, cur)} · ${spreadTxt}`,
      isPositive: (metrics.profitGrowthPct ?? 0) >= 0,
    };
  }

  if (audience.heroMetric === 'margin') {
    const annStr = formatCurrency(metrics.annualizedRevenueEstimate, cur, { compact: true });
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatPercent(metrics.profitMarginPct),
      deltaFormatted: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts`,
      priorContext: `vs ${formatPercent(metrics.previousProfitMarginPct)} in ${report.previousPeriodLabel}`,
      secondaryLine: `Run-Rate: ${annStr} · ARPU: ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'}`,
      isPositive: metrics.marginDeltaPts >= 0,
    };
  }

  if (audience.heroMetric === 'customers') {
    const custDelta = report.currentPeriod.customerCount - report.previousPeriod.customerCount;
    const revStr = formatCurrency(report.currentPeriod.revenue, cur, { compact: audience.redactInternalExpenses });
    const retStr =
      report.currentPeriod.retentionRatePct !== undefined
        ? ` · Retention: ${report.currentPeriod.retentionRatePct.toFixed(0)}%`
        : '';
    const npsStr =
      report.currentPeriod.npsScore !== undefined
        ? ` · NPS: ${report.currentPeriod.npsScore}`
        : '';
    const second = audience.redactInternalExpenses
      ? `Scale: ${revStr}${retStr || ` · Rev Growth: ${formatPercent(metrics.revenueGrowthPct, { signed: true })}`}${npsStr}`
      : `Revenue: ${revStr} · ${report.strategicPriorities.length} Active Initiatives${retStr}`;
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
      ? `Customers: ${formatNumber(report.currentPeriod.customerCount)} · Trajectory: ${metrics.clientSafeTrajectory}`
      : `Net Profit: ${formatCurrency(metrics.netProfit, cur)} · Margin: ${formatPercent(metrics.profitMarginPct)}`,
    isPositive: (metrics.revenueGrowthPct ?? 0) >= 0,
  };
}

export function resolveKpiStripCards(
  report: ReportInputData,
  metrics: ComputedMetrics,
  compactMoney: boolean
): KpiStripCard[] {
  const audience = getAudienceEdition(report.audienceEdition);
  const cur = report.currency;
  const edition = audience.id;

  if (audience.redactInternalExpenses || edition === 'client') {
    const thirdCard: KpiStripCard =
      report.currentPeriod.retentionRatePct !== undefined
        ? {
            label: 'Client Retention',
            val: `${report.currentPeriod.retentionRatePct.toFixed(1)}%`,
            sub:
              report.previousPeriod.retentionRatePct !== undefined
                ? `${(report.currentPeriod.retentionRatePct - report.previousPeriod.retentionRatePct >= 0 ? '+' : '') + (report.currentPeriod.retentionRatePct - report.previousPeriod.retentionRatePct).toFixed(1)} pts shift`
                : 'Verified partner retention',
            positive: report.currentPeriod.retentionRatePct >= 80,
          }
        : {
            label: 'Delivered Value / Account',
            val:
              metrics.revenuePerCustomer !== null
                ? formatCurrency(metrics.revenuePerCustomer, cur)
                : 'N/A',
            sub: `${formatPercent(metrics.arpuGrowthPct, { signed: true })} expansion`,
            positive: (metrics.arpuGrowthPct ?? 0) >= 0,
          };

    return [
      {
        label: 'Platform Revenue',
        val: formatCurrency(report.currentPeriod.revenue, cur, { compact: compactMoney }),
        sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
        positive: (metrics.revenueGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Active Partners',
        val: formatNumber(report.currentPeriod.customerCount),
        sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
        positive: (metrics.customerGrowthPct ?? 0) >= 0,
      },
      thirdCard,
      {
        label: 'Partner Trajectory',
        val: metrics.clientSafeTrajectory,
        sub:
          report.currentPeriod.npsScore !== undefined
            ? `Partner NPS ${report.currentPeriod.npsScore}`
            : report.reportingPeriod,
        positive:
          metrics.clientSafeTrajectory !== 'Retention Focus' &&
          metrics.clientSafeTrajectory !== 'Scale Moderation',
      },
    ];
  }

  if (edition === 'ceo') {
    const spread =
      metrics.revenueGrowthPct !== null && metrics.expenseGrowthPct !== null
        ? metrics.revenueGrowthPct - metrics.expenseGrowthPct
        : null;
    return [
      {
        label: compactMoney ? 'Net Profit' : 'Net Operating Profit',
        val: formatCurrency(metrics.netProfit, cur, { compact: compactMoney }),
        sub: `${formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior`,
        positive: metrics.netProfit >= 0 && (metrics.profitGrowthPct ?? 0) >= 0,
      },
      {
        label: compactMoney ? 'Revenue' : 'Top-Line Revenue',
        val: formatCurrency(report.currentPeriod.revenue, cur, { compact: compactMoney }),
        sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} momentum`,
        positive: (metrics.revenueGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Op Leverage Spread',
        val: spread !== null ? `${spread >= 0 ? '+' : ''}${spread.toFixed(1)} pts` : formatPercent(metrics.profitMarginPct),
        sub:
          spread !== null
            ? spread >= 0
              ? 'Revenue outpacing OpEx'
              : 'OpEx outpacing revenue'
            : `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts margin`,
        positive: (spread ?? metrics.marginDeltaPts) >= 0,
      },
      {
        label: 'OpEx Ratio',
        val: `${metrics.operatingExpenseRatioPct.toFixed(1)}%`,
        sub: `${formatPercent(metrics.expenseGrowthPct, { signed: true })} cost shift`,
        positive: (metrics.expenseGrowthPct ?? 0) <= (metrics.revenueGrowthPct ?? 0),
      },
      {
        label: compactMoney ? 'Customers' : 'Active Customers',
        val: formatNumber(report.currentPeriod.customerCount),
        sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
        positive: (metrics.customerGrowthPct ?? 0) >= 0,
      },
    ];
  }

  if (edition === 'investor') {
    const qualityCard: KpiStripCard =
      report.currentPeriod.retentionRatePct !== undefined
        ? {
            label: 'Retention Rate',
            val: `${report.currentPeriod.retentionRatePct.toFixed(1)}%`,
            sub:
              report.currentPeriod.npsScore !== undefined
                ? `NPS ${report.currentPeriod.npsScore}`
                : 'Cohort durability',
            positive: report.currentPeriod.retentionRatePct >= 80,
          }
        : report.currentPeriod.npsScore !== undefined
          ? {
              label: 'Customer NPS',
              val: `${report.currentPeriod.npsScore}`,
              sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} accounts`,
              positive: report.currentPeriod.npsScore >= 30,
            }
          : {
              label: compactMoney ? 'Customers' : 'Customer Base',
              val: formatNumber(report.currentPeriod.customerCount),
              sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} YoP`,
              positive: (metrics.customerGrowthPct ?? 0) >= 0,
            };

    return [
      {
        label: compactMoney ? 'Annual Run-Rate' : 'Annualized Run-Rate',
        val: formatCurrency(metrics.annualizedRevenueEstimate, cur, { compact: true }),
        sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
        positive: (metrics.revenueGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Unit ARPU',
        val:
          metrics.revenuePerCustomer !== null
            ? formatCurrency(metrics.revenuePerCustomer, cur)
            : 'N/A',
        sub: `${formatPercent(metrics.arpuGrowthPct, { signed: true })} yield`,
        positive: (metrics.arpuGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Net Margin',
        val: formatPercent(metrics.profitMarginPct),
        sub: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift`,
        positive: metrics.marginDeltaPts >= 0,
      },
      qualityCard,
      {
        label: 'Net Profit',
        val: formatCurrency(metrics.netProfit, cur, { compact: compactMoney }),
        sub: `${formatPercent(metrics.profitGrowthPct, { signed: true })} earnings`,
        positive: metrics.netProfit >= 0 && (metrics.profitGrowthPct ?? 0) >= 0,
      },
    ];
  }

  if (edition === 'team') {
    const topSegment = [...metrics.segmentsComputed].sort((a, b) => b.growthPct - a.growthPct)[0];
    return [
      {
        label: compactMoney ? 'Customers' : 'Customers Served',
        val: formatNumber(report.currentPeriod.customerCount),
        sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
        positive: (metrics.customerGrowthPct ?? 0) >= 0,
      },
      {
        label: compactMoney ? 'Revenue' : 'Team Revenue Delivered',
        val: formatCurrency(report.currentPeriod.revenue, cur, { compact: compactMoney }),
        sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
        positive: (metrics.revenueGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Fastest Segment',
        val: topSegment ? topSegment.name.split(' ')[0] : 'Core Ops',
        sub: topSegment ? `${formatPercent(topSegment.growthPct, { signed: true })} growth` : 'All teams',
        positive: (topSegment?.growthPct ?? 0) >= 0,
      },
      {
        label:
          report.currentPeriod.retentionRatePct !== undefined
            ? 'Customer Retention'
            : report.currentPeriod.npsScore !== undefined
              ? 'Customer NPS'
              : 'Net Profit',
        val:
          report.currentPeriod.retentionRatePct !== undefined
            ? `${report.currentPeriod.retentionRatePct.toFixed(0)}%`
            : report.currentPeriod.npsScore !== undefined
              ? `${report.currentPeriod.npsScore}`
              : formatCurrency(metrics.netProfit, cur, { compact: compactMoney }),
        sub:
          report.currentPeriod.retentionRatePct !== undefined
            ? report.currentPeriod.npsScore !== undefined
              ? `NPS ${report.currentPeriod.npsScore}`
              : 'Service durability'
            : `${formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior`,
        positive: true,
      },
      {
        label: 'Execution Initiatives',
        val: `${report.strategicPriorities.length} Active`,
        sub: report.strategicPriorities[0]?.horizon ?? report.reportingPeriod,
        positive: report.strategicPriorities.length > 0,
      },
    ];
  }

  // Board Governance default (Fiduciary variance view)
  return [
    {
      label: compactMoney ? 'Revenue' : 'Total Revenue',
      val: formatCurrency(report.currentPeriod.revenue, cur, { compact: compactMoney }),
      sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
      positive: (metrics.revenueGrowthPct ?? 0) >= 0,
    },
    {
      label: compactMoney ? 'Expenses' : 'Operating Expenses',
      val: formatCurrency(report.currentPeriod.expenses, cur, { compact: compactMoney }),
      sub: `${formatPercent(metrics.expenseGrowthPct, { signed: true })} vs prior`,
      positive: (metrics.expenseGrowthPct ?? 0) <= (metrics.revenueGrowthPct ?? 0),
    },
    {
      label: 'Net Profit',
      val: formatCurrency(metrics.netProfit, cur, { compact: compactMoney }),
      sub: `${formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior`,
      positive: metrics.netProfit >= 0 && (metrics.profitGrowthPct ?? 0) >= 0,
    },
    {
      label: 'Profit Margin',
      val: formatPercent(metrics.profitMarginPct),
      sub: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift`,
      positive: metrics.marginDeltaPts >= 0,
    },
    {
      label: compactMoney ? 'Customers' : 'Active Customers',
      val: formatNumber(report.currentPeriod.customerCount),
      sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
      positive: (metrics.customerGrowthPct ?? 0) >= 0,
    },
  ];
}

export function resolveStoryArcChapters(
  report: ReportInputData,
  metrics: ComputedMetrics,
  trend: TrendAnalysisResult
): StoryArcChapter[] {
  const audience = getAudienceEdition(report.audienceEdition);
  const edition = audience.id;
  const cur = report.currency;
  const revTrend = trend.metrics.find((m) => m.id === 'revenue');

  const revPeak = metrics.bestRevenueMonth ?? metrics.bestMonth;
  const revLow = metrics.worstRevenueMonth ?? metrics.worstMonth;
  const revSpreadText =
    revPeak && revLow && revPeak.month !== revLow.month
      ? ` Monthly revenue ranged from ${formatCurrency(revLow.revenue, cur, { compact: true })} (${revLow.month}) to ${formatCurrency(revPeak.revenue, cur, { compact: true })} (${revPeak.month}).`
      : '';

  if (audience.redactInternalExpenses || edition === 'client') {
    return [
      {
        step: '01 · Ecosystem Scale',
        body: `${report.branding.companyName} delivered ${formatCurrency(report.currentPeriod.revenue, cur, { compact: true })} in platform value (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) for ${formatNumber(report.currentPeriod.customerCount)} partners.`,
      },
      {
        step: `02 · Delivery Pace (${trend.windowMonthsCount || 3}M)`,
        body:
          trend.hasSufficientData && revTrend
            ? `${trend.overallSignal} cadence: ${trend.latestMonthLabel} (${revTrend.currentMonthFormatted}) tracked ${revTrend.deltaFormatted} vs the ${revTrend.rolling3MoAvgFormatted} trailing baseline.${revSpreadText}`
            : `Peak monthly delivery reached ${formatCurrency(revPeak?.revenue ?? 0, cur, { compact: true })} in ${revPeak?.month ?? 'the period'}.`,
      },
      {
        step: '03 · Partner Outcomes',
        body: `${metrics.clientSafeTrajectory}: retention ${report.currentPeriod.retentionRatePct !== undefined ? `${report.currentPeriod.retentionRatePct.toFixed(0)}%` : 'stable'}${report.currentPeriod.npsScore !== undefined ? `, partner NPS ${report.currentPeriod.npsScore}` : ''}, and ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'} average engagement scale.`,
      },
      {
        step: '04 · Shared Roadmap',
        body: report.strategicPriorities[0]
          ? `${report.strategicPriorities[0].title} (${report.strategicPriorities[0].horizon}) — ${report.strategicPriorities[0].targetImpact}.`
          : report.narrative.closingTakeaway,
      },
    ];
  }

  if (edition === 'ceo') {
    const revG = metrics.revenueGrowthPct;
    const expG = metrics.expenseGrowthPct;
    const spread = revG !== null && expG !== null ? revG - expG : null;
    return [
      {
        step: '01 · Command Earnings',
        body: `Net operating profit settled at ${formatCurrency(metrics.netProfit, cur, { compact: true })} (${formatPercent(metrics.profitGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) on ${formatCurrency(report.currentPeriod.revenue, cur, { compact: true })} top-line revenue.`,
      },
      {
        step: '02 · Operating Leverage',
        body:
          spread !== null
            ? `Operating leverage spread registered ${spread >= 0 ? '+' : ''}${spread.toFixed(1)} pts (revenue ${formatPercent(revG, { signed: true })} vs OpEx ${formatPercent(expG, { signed: true })}); OpEx ratio stands at ${metrics.operatingExpenseRatioPct.toFixed(1)}%.`
            : `Operating expense ratio stands at ${metrics.operatingExpenseRatioPct.toFixed(1)}% with a ${formatPercent(metrics.profitMarginPct)} net margin.`,
      },
      {
        step: `03 · Rolling ${trend.windowMonthsCount || 3}M Pace`,
        body:
          trend.hasSufficientData && revTrend
            ? `${trend.overallSignal}: ${trend.latestMonthLabel} (${revTrend.currentMonthFormatted}) moved ${revTrend.deltaFormatted} vs the ${trend.windowMonthsCount}M trailing baseline.${revSpreadText}`
            : `Peak profit month was ${metrics.bestMonth?.month ?? 'period'} at ${formatCurrency(metrics.bestMonth?.netProfit ?? 0, cur, { compact: true })}.`,
      },
      {
        step: '04 · Executive Mandate',
        body: report.strategicPriorities[0]
          ? `Action owner ${report.strategicPriorities[0].owner}: ${report.strategicPriorities[0].title} (${report.strategicPriorities[0].targetImpact}).`
          : report.narrative.closingTakeaway,
      },
    ];
  }

  if (edition === 'investor') {
    return [
      {
        step: '01 · Annualized Run-Rate',
        body: `${formatCurrency(metrics.annualizedRevenueEstimate, cur, { compact: true })} annualized revenue trajectory based on ${report.reportingPeriod} actuals (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}).`,
      },
      {
        step: '02 · Unit Economics & ARPU',
        body: `Average account yield reached ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'} (${formatPercent(metrics.arpuGrowthPct, { signed: true })} YoP) across ${formatNumber(report.currentPeriod.customerCount)} customers.`,
      },
      {
        step: '03 · Margin & Quality',
        body: `Net margin closed at ${formatPercent(metrics.profitMarginPct)} (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts YoP)${report.currentPeriod.retentionRatePct !== undefined ? `; retention ${report.currentPeriod.retentionRatePct.toFixed(0)}%` : ''}${report.currentPeriod.npsScore !== undefined ? `, NPS ${report.currentPeriod.npsScore}` : ''}.`,
      },
      {
        step: '04 · Capital Catalyst',
        body: report.strategicPriorities[0]
          ? `Lead catalyst (${report.strategicPriorities[0].horizon}): ${report.strategicPriorities[0].title} — targeting ${report.strategicPriorities[0].targetImpact}.`
          : report.narrative.closingTakeaway,
      },
    ];
  }

  if (edition === 'team') {
    const topSeg = [...metrics.segmentsComputed].sort((a, b) => b.growthPct - a.growthPct)[0];
    return [
      {
        step: '01 · Customers Impacted',
        body: `Our teams served ${formatNumber(report.currentPeriod.customerCount)} active customers (${formatPercent(metrics.customerGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) and delivered ${formatCurrency(report.currentPeriod.revenue, cur, { compact: true })} in revenue.`,
      },
      {
        step: '02 · Segment Breakout',
        body: topSeg
          ? `${topSeg.name} led company growth at ${formatPercent(topSeg.growthPct, { signed: true })} (${topSeg.sharePct.toFixed(1)}% revenue mix share).`
          : `All core product lines contributed across ${report.revenueCategories.length} revenue streams.`,
      },
      {
        step: '03 · Quality & Execution Pace',
        body: `${metrics.healthStatus}: ${trend.hasSufficientData && revTrend ? `${trend.latestMonthLabel} closed ${revTrend.deltaFormatted} vs trailing average` : `Peak revenue month in ${revPeak?.month ?? 'period'}`}${report.currentPeriod.npsScore !== undefined ? ` with customer NPS ${report.currentPeriod.npsScore}` : ''}.`,
      },
      {
        step: '04 · Owner Accountability',
        body: report.strategicPriorities[0]
          ? `Lead focus (${report.strategicPriorities[0].owner} · ${report.strategicPriorities[0].horizon}): ${report.strategicPriorities[0].title}.`
          : report.narrative.closingTakeaway,
      },
    ];
  }

  // Board Governance default
  return [
    {
      step: '01 · Scale & Demand',
      body: `${report.branding.companyName} recorded ${formatCurrency(report.currentPeriod.revenue, cur)} in revenue (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) across ${formatNumber(report.currentPeriod.customerCount)} accounts.`,
    },
    {
      step: '02 · Rolling 3M Momentum',
      body:
        trend.hasSufficientData && revTrend
          ? `${trend.overallSignal} trajectory: ${trend.latestMonthLabel} (${revTrend.currentMonthFormatted}) tracked ${revTrend.deltaFormatted} against the ${revTrend.rolling3MoAvgFormatted} trailing baseline.${revSpreadText}`
          : `Peak monthly revenue velocity occurred in ${revPeak?.month ?? 'the period'} at ${formatCurrency(revPeak?.revenue ?? 0, cur)}.`,
    },
    {
      step: '03 · Operating Leverage',
      body: `Audited operating discipline yielded ${formatCurrency(metrics.netProfit, cur)} net profit at a ${formatPercent(metrics.profitMarginPct)} margin (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift; OpEx ratio ${metrics.operatingExpenseRatioPct.toFixed(1)}%).`,
    },
    {
      step: '04 · Forward Mandate',
      body: report.strategicPriorities[0]
        ? `${report.strategicPriorities[0].title} (${report.strategicPriorities[0].owner} · ${report.strategicPriorities[0].horizon}) — targeting ${report.strategicPriorities[0].targetImpact}.`
        : report.narrative.closingTakeaway,
    },
  ];
}
