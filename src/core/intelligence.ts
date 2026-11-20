import { calcGrowthPct, formatCurrency, formatNumber, formatPercent } from './calculations.ts';
import type {
  ComputedMetrics,
  ExecutiveInsight,
  MomentumSignal,
  ReportInputData,
  RollingMonthPoint,
  StrategicRecommendation,
  TrendAnalysisResult,
  TrendMetricComparison,
} from './types.ts';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function calcSafeDeltaPct(current: number, baseline: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

function classifyPctSignal(deltaPct: number | null, thresholdPct: number): MomentumSignal {
  if (deltaPct === null || !Number.isFinite(deltaPct)) return 'Steady';
  if (deltaPct >= thresholdPct) return 'Accelerating';
  if (deltaPct <= -thresholdPct) return 'Decelerating';
  return 'Steady';
}

function classifyPtsSignal(deltaPts: number, thresholdPts: number): MomentumSignal {
  if (!Number.isFinite(deltaPts)) return 'Steady';
  if (deltaPts >= thresholdPts) return 'Accelerating';
  if (deltaPts <= -thresholdPts) return 'Decelerating';
  return 'Steady';
}

function formatPtsDelta(pts: number): string {
  const safe = Number.isFinite(pts) ? pts : 0;
  return `${safe >= 0 ? '+' : ''}${safe.toFixed(1)} pts`;
}

export function computeTrendAnalysis(
  report: ReportInputData,
  metrics: ComputedMetrics
): TrendAnalysisResult {
  const series = metrics.monthlyWithProfit;
  const cur = report.currency;

  if (series.length === 0) {
    return {
      hasSufficientData: false,
      windowMonthsCount: 0,
      totalMonthsCount: 0,
      windowPeriodLabel: 'No monthly data',
      latestMonthLabel: report.reportingPeriod,
      overallSignal: 'Steady',
      summaryHeadline: 'Monthly Series Required for Rolling 3-Month Benchmark',
      summaryNarrative:
        'Add monthly figures in Report Editor to compute current-period momentum against a trailing 3-month rolling average.',
      metrics: [],
      rollingSeries: [],
    };
  }

  const rollingSeries: RollingMonthPoint[] = series.map((pt, idx) => {
    const sub = series.slice(Math.max(0, idx - 2), idx + 1);
    const rollingRev = mean(sub.map((m) => m.revenue));
    const rollingExp = mean(sub.map((m) => m.expenses));
    const rollingProfit = mean(sub.map((m) => m.netProfit));
    const rollingMargin =
      rollingRev > 0 ? (rollingProfit / rollingRev) * 100 : mean(sub.map((m) => m.marginPct));

    return {
      month: pt.month,
      revenue: pt.revenue,
      expenses: pt.expenses,
      netProfit: pt.netProfit,
      marginPct: pt.marginPct,
      customers: pt.customers,
      rolling3MoRevenueAvg: rollingRev,
      rolling3MoExpensesAvg: rollingExp,
      rolling3MoProfitAvg: rollingProfit,
      rolling3MoMarginAvg: rollingMargin,
      revenueVsRollingPct: calcGrowthPct(pt.revenue, rollingRev),
    };
  });

  const windowSlice = series.slice(-3);
  const windowMonthsCount = windowSlice.length;
  const latestMonth = series[series.length - 1];
  const windowPeriodLabel =
    windowSlice.length === 1
      ? windowSlice[0].month
      : `${windowSlice[0].month} – ${windowSlice[windowSlice.length - 1].month}`;
  const windowTag = windowMonthsCount < 3 ? `${windowMonthsCount}M` : '3M';

  // 1. Revenue Momentum
  const rollRevAvg = mean(windowSlice.map((m) => m.revenue));
  const revPeriodPace = report.currentPeriod.revenue / series.length;
  const revLatestDeltaPct = calcGrowthPct(latestMonth.revenue, rollRevAvg);
  const revPaceDeltaPct = calcGrowthPct(revPeriodPace, rollRevAvg);
  const revSignal = classifyPctSignal(revLatestDeltaPct, 1.5);
  const revPaceSignal = classifyPctSignal(revPaceDeltaPct, 1.5);

  const revenueComparison: TrendMetricComparison = {
    id: 'revenue',
    label: 'Monthly Revenue Run-Rate',
    sensitive: false,
    unit: 'currency',
    currentMonthValue: latestMonth.revenue,
    currentMonthFormatted: formatCurrency(latestMonth.revenue, cur),
    periodPaceValue: revPeriodPace,
    periodPaceFormatted: formatCurrency(revPeriodPace, cur),
    rolling3MoAvg: rollRevAvg,
    rolling3MoAvgFormatted: formatCurrency(rollRevAvg, cur),
    deltaValue: latestMonth.revenue - rollRevAvg,
    deltaPct: revLatestDeltaPct,
    deltaFormatted: formatPercent(revLatestDeltaPct, { signed: true }),
    periodPaceDeltaPct: revPaceDeltaPct,
    periodPaceDeltaFormatted: formatPercent(revPaceDeltaPct, { signed: true }),
    signal: revSignal,
    periodPaceSignal: revPaceSignal,
    signalReason:
      revSignal === 'Accelerating'
        ? `${latestMonth.month} revenue is running ${formatPercent(revLatestDeltaPct, { signed: true })} ahead of the ${windowTag} rolling average.`
        : revSignal === 'Decelerating'
          ? `${latestMonth.month} revenue cooled ${formatPercent(revLatestDeltaPct, { signed: true })} below the ${windowTag} rolling average.`
          : `${latestMonth.month} revenue tracked within ±1.5% of the ${windowTag} rolling average.`,
    formulaTrace: `${latestMonth.month} (${formatCurrency(latestMonth.revenue, cur, { compact: true })}) vs ${windowTag} Avg (${formatCurrency(rollRevAvg, cur, { compact: true })}) = ${formatPercent(revLatestDeltaPct, { signed: true })}`,
    periodPaceFormulaTrace: `Period Monthly Pace (${formatCurrency(revPeriodPace, cur, { compact: true })}) vs ${windowTag} Avg (${formatCurrency(rollRevAvg, cur, { compact: true })}) = ${formatPercent(revPaceDeltaPct, { signed: true })}`,
  };

  // 2. Operating Expenses Momentum (sensitive)
  const rollExpAvg = mean(windowSlice.map((m) => m.expenses));
  const expPeriodPace = report.currentPeriod.expenses / series.length;
  const expLatestDeltaPct = calcGrowthPct(latestMonth.expenses, rollExpAvg);
  const expPaceDeltaPct = calcGrowthPct(expPeriodPace, rollExpAvg);
  const expSignal = classifyPctSignal(expLatestDeltaPct, 1.5);
  const expPaceSignal = classifyPctSignal(expPaceDeltaPct, 1.5);

  const expenseComparison: TrendMetricComparison = {
    id: 'expenses',
    label: 'Monthly Operating Expenses',
    sensitive: true,
    unit: 'currency',
    currentMonthValue: latestMonth.expenses,
    currentMonthFormatted: formatCurrency(latestMonth.expenses, cur),
    periodPaceValue: expPeriodPace,
    periodPaceFormatted: formatCurrency(expPeriodPace, cur),
    rolling3MoAvg: rollExpAvg,
    rolling3MoAvgFormatted: formatCurrency(rollExpAvg, cur),
    deltaValue: latestMonth.expenses - rollExpAvg,
    deltaPct: expLatestDeltaPct,
    deltaFormatted: formatPercent(expLatestDeltaPct, { signed: true }),
    periodPaceDeltaPct: expPaceDeltaPct,
    periodPaceDeltaFormatted: formatPercent(expPaceDeltaPct, { signed: true }),
    signal: expSignal,
    periodPaceSignal: expPaceSignal,
    signalReason:
      expSignal === 'Accelerating'
        ? `Operating spend stepped up ${formatPercent(expLatestDeltaPct, { signed: true })} over the ${windowTag} average.`
        : expSignal === 'Decelerating'
          ? `Operating spend moderated ${formatPercent(expLatestDeltaPct, { signed: true })} below the ${windowTag} average.`
          : `Expense run-rate held steady near the ${windowTag} rolling baseline.`,
    formulaTrace: `${latestMonth.month} (${formatCurrency(latestMonth.expenses, cur, { compact: true })}) vs ${windowTag} Avg (${formatCurrency(rollExpAvg, cur, { compact: true })}) = ${formatPercent(expLatestDeltaPct, { signed: true })}`,
    periodPaceFormulaTrace: `Period Monthly Pace (${formatCurrency(expPeriodPace, cur, { compact: true })}) vs ${windowTag} Avg (${formatCurrency(rollExpAvg, cur, { compact: true })}) = ${formatPercent(expPaceDeltaPct, { signed: true })}`,
  };

  // 3. Net Profit Momentum (sensitive)
  const rollProfitAvg = mean(windowSlice.map((m) => m.netProfit));
  const profitPeriodPace = metrics.netProfit / series.length;
  const profitLatestDeltaPct = calcSafeDeltaPct(latestMonth.netProfit, rollProfitAvg);
  const profitPaceDeltaPct = calcSafeDeltaPct(profitPeriodPace, rollProfitAvg);
  const profitSignal = classifyPctSignal(profitLatestDeltaPct, 2.5);
  const profitPaceSignal = classifyPctSignal(profitPaceDeltaPct, 2.5);

  const profitComparison: TrendMetricComparison = {
    id: 'net-profit',
    label: 'Monthly Net Profit',
    sensitive: true,
    unit: 'currency',
    currentMonthValue: latestMonth.netProfit,
    currentMonthFormatted: formatCurrency(latestMonth.netProfit, cur),
    periodPaceValue: profitPeriodPace,
    periodPaceFormatted: formatCurrency(profitPeriodPace, cur),
    rolling3MoAvg: rollProfitAvg,
    rolling3MoAvgFormatted: formatCurrency(rollProfitAvg, cur),
    deltaValue: latestMonth.netProfit - rollProfitAvg,
    deltaPct: profitLatestDeltaPct,
    deltaFormatted: formatPercent(profitLatestDeltaPct, { signed: true }),
    periodPaceDeltaPct: profitPaceDeltaPct,
    periodPaceDeltaFormatted: formatPercent(profitPaceDeltaPct, { signed: true }),
    signal: profitSignal,
    periodPaceSignal: profitPaceSignal,
    signalReason:
      profitSignal === 'Accelerating'
        ? `Bottom-line profit velocity rose ${formatPercent(profitLatestDeltaPct, { signed: true })} over the ${windowTag} rolling average.`
        : profitSignal === 'Decelerating'
          ? `Net earnings trailed the ${windowTag} average by ${formatPercent(profitLatestDeltaPct, { signed: true })}.`
          : `Monthly earnings remained aligned with the ${windowTag} rolling average.`,
    formulaTrace: `${latestMonth.month} (${formatCurrency(latestMonth.netProfit, cur, { compact: true })}) vs ${windowTag} Avg (${formatCurrency(rollProfitAvg, cur, { compact: true })}) = ${formatPercent(profitLatestDeltaPct, { signed: true })}`,
    periodPaceFormulaTrace: `Period Monthly Pace (${formatCurrency(profitPeriodPace, cur, { compact: true })}) vs ${windowTag} Avg (${formatCurrency(rollProfitAvg, cur, { compact: true })}) = ${formatPercent(profitPaceDeltaPct, { signed: true })}`,
  };

  // 4. Net Margin Momentum (sensitive)
  const rollMarginAvg =
    rollRevAvg > 0
      ? (rollProfitAvg / rollRevAvg) * 100
      : mean(windowSlice.map((m) => m.marginPct));
  const marginLatestPts = latestMonth.marginPct - rollMarginAvg;
  const marginPacePts = metrics.profitMarginPct - rollMarginAvg;
  const marginSignal = classifyPtsSignal(marginLatestPts, 0.5);
  const marginPaceSignal = classifyPtsSignal(marginPacePts, 0.5);

  const marginComparison: TrendMetricComparison = {
    id: 'net-margin',
    label: 'Net Profit Margin',
    sensitive: true,
    unit: 'percent',
    currentMonthValue: latestMonth.marginPct,
    currentMonthFormatted: formatPercent(latestMonth.marginPct),
    periodPaceValue: metrics.profitMarginPct,
    periodPaceFormatted: formatPercent(metrics.profitMarginPct),
    rolling3MoAvg: rollMarginAvg,
    rolling3MoAvgFormatted: formatPercent(rollMarginAvg),
    deltaValue: marginLatestPts,
    deltaPct: marginLatestPts,
    deltaFormatted: formatPtsDelta(marginLatestPts),
    periodPaceDeltaPct: marginPacePts,
    periodPaceDeltaFormatted: formatPtsDelta(marginPacePts),
    signal: marginSignal,
    periodPaceSignal: marginPaceSignal,
    signalReason:
      marginSignal === 'Accelerating'
        ? `Margin widened ${formatPtsDelta(marginLatestPts)} above the ${windowTag} rolling baseline.`
        : marginSignal === 'Decelerating'
          ? `Margin softened ${formatPtsDelta(marginLatestPts)} relative to the ${windowTag} baseline.`
          : `Net margin held steady within ±0.5 pts of the ${windowTag} average.`,
    formulaTrace: `${latestMonth.month} (${formatPercent(latestMonth.marginPct)}) - ${windowTag} Avg (${formatPercent(rollMarginAvg)}) = ${formatPtsDelta(marginLatestPts)}`,
    periodPaceFormulaTrace: `Period Margin (${formatPercent(metrics.profitMarginPct)}) - ${windowTag} Avg (${formatPercent(rollMarginAvg)}) = ${formatPtsDelta(marginPacePts)}`,
  };

  const comparisons: TrendMetricComparison[] = [
    revenueComparison,
    expenseComparison,
    profitComparison,
    marginComparison,
  ];

  // 5. Active Customers Momentum (optional if monthly customer counts are provided)
  const custWindow = windowSlice.filter(
    (m) => typeof m.customers === 'number' && Number.isFinite(m.customers)
  );
  if (typeof latestMonth.customers === 'number' && custWindow.length > 0) {
    const rollCustAvg = mean(custWindow.map((m) => m.customers as number));
    const custLatestDeltaPct = calcGrowthPct(latestMonth.customers, rollCustAvg);
    const custPaceDeltaPct = calcGrowthPct(report.currentPeriod.customerCount, rollCustAvg);
    const custSignal = classifyPctSignal(custLatestDeltaPct, 1.5);
    const custPaceSignal = classifyPctSignal(custPaceDeltaPct, 1.5);

    comparisons.push({
      id: 'customers',
      label: 'Active Customers',
      sensitive: false,
      unit: 'count',
      currentMonthValue: latestMonth.customers,
      currentMonthFormatted: formatNumber(latestMonth.customers),
      periodPaceValue: report.currentPeriod.customerCount,
      periodPaceFormatted: formatNumber(report.currentPeriod.customerCount),
      rolling3MoAvg: rollCustAvg,
      rolling3MoAvgFormatted: formatNumber(Math.round(rollCustAvg)),
      deltaValue: latestMonth.customers - rollCustAvg,
      deltaPct: custLatestDeltaPct,
      deltaFormatted: formatPercent(custLatestDeltaPct, { signed: true }),
      periodPaceDeltaPct: custPaceDeltaPct,
      periodPaceDeltaFormatted: formatPercent(custPaceDeltaPct, { signed: true }),
      signal: custSignal,
      periodPaceSignal: custPaceSignal,
      signalReason:
        custSignal === 'Accelerating'
          ? `Active customer base expanded ${formatPercent(custLatestDeltaPct, { signed: true })} over the ${windowTag} rolling average.`
          : custSignal === 'Decelerating'
            ? `Active customer count slipped ${formatPercent(custLatestDeltaPct, { signed: true })} below the ${windowTag} average.`
            : `Active customer volume tracked steadily against the ${windowTag} baseline.`,
      formulaTrace: `${latestMonth.month} (${formatNumber(latestMonth.customers)}) vs ${windowTag} Avg (${formatNumber(Math.round(rollCustAvg))}) = ${formatPercent(custLatestDeltaPct, { signed: true })}`,
      periodPaceFormulaTrace: `Period End (${formatNumber(report.currentPeriod.customerCount)}) vs ${windowTag} Avg (${formatNumber(Math.round(rollCustAvg))}) = ${formatPercent(custPaceDeltaPct, { signed: true })}`,
    });
  }

  // Overall composite momentum signal
  let overallSignal: MomentumSignal = 'Steady';
  if (
    revSignal === 'Accelerating' &&
    (profitSignal === 'Accelerating' || profitSignal === 'Steady') &&
    marginSignal !== 'Decelerating'
  ) {
    overallSignal = 'Accelerating';
  } else if (
    revSignal === 'Decelerating' ||
    (profitSignal === 'Decelerating' && marginSignal === 'Decelerating')
  ) {
    overallSignal = 'Decelerating';
  } else if (profitSignal === 'Accelerating' && marginSignal === 'Accelerating') {
    overallSignal = 'Accelerating';
  }

  const summaryHeadline =
    overallSignal === 'Accelerating'
      ? `Positive Momentum: ${latestMonth.month} Outpaces Rolling ${windowTag} Average`
      : overallSignal === 'Decelerating'
        ? `Momentum Watch: ${latestMonth.month} Trails Rolling ${windowTag} Average`
        : `Steady Trajectory: ${latestMonth.month} Tracks Rolling ${windowTag} Average`;

  const summaryNarrative =
    overallSignal === 'Accelerating'
      ? `Revenue (${revenueComparison.deltaFormatted}) and net earnings (${profitComparison.deltaFormatted}) are compounding above the ${windowPeriodLabel} rolling baseline.`
      : overallSignal === 'Decelerating'
        ? `Latest-month performance softened versus the ${windowPeriodLabel} rolling baseline (revenue ${revenueComparison.deltaFormatted}, profit ${profitComparison.deltaFormatted}).`
        : `Core financial velocity remains balanced within expected tolerance of the ${windowPeriodLabel} rolling baseline.`;

  return {
    hasSufficientData: true,
    windowMonthsCount,
    totalMonthsCount: series.length,
    windowPeriodLabel,
    latestMonthLabel: latestMonth.month,
    overallSignal,
    summaryHeadline,
    summaryNarrative,
    metrics: comparisons,
    rollingSeries,
  };
}

export function filterTrendForAudience(
  trend: TrendAnalysisResult,
  redactInternalExpenses: boolean
): TrendAnalysisResult {
  if (!redactInternalExpenses || !trend.hasSufficientData) return trend;

  const publicMetrics = trend.metrics.filter((m) => !m.sensitive);
  const revMetric = publicMetrics.find((m) => m.id === 'revenue');
  const custMetric = publicMetrics.find((m) => m.id === 'customers');

  let overallSignal: MomentumSignal = revMetric?.signal ?? 'Steady';
  if (revMetric?.signal === 'Steady' && custMetric?.signal === 'Accelerating') {
    overallSignal = 'Accelerating';
  }

  const windowTag = trend.windowMonthsCount < 3 ? `${trend.windowMonthsCount}M` : '3M';
  const summaryHeadline =
    overallSignal === 'Accelerating'
      ? `Positive Scale Momentum: ${trend.latestMonthLabel} Outpaces Rolling ${windowTag} Average`
      : overallSignal === 'Decelerating'
        ? `Top-Line Pace Note: ${trend.latestMonthLabel} Below Rolling ${windowTag} Average`
        : `Steady Scale Trajectory: ${trend.latestMonthLabel} Tracks Rolling ${windowTag} Average`;

  const summaryNarrative = revMetric
    ? `External scale metrics (${revMetric.label} ${revMetric.deltaFormatted}${custMetric ? `, ${custMetric.label} ${custMetric.deltaFormatted}` : ''}) benchmarked against ${trend.windowPeriodLabel}.`
    : trend.summaryNarrative;

  return {
    ...trend,
    overallSignal,
    summaryHeadline,
    summaryNarrative,
    metrics: publicMetrics,
  };
}

export function filterInsightsForAudience(
  insights: ExecutiveInsight[],
  filteredTrend: TrendAnalysisResult,
  redactInternalExpenses: boolean
): ExecutiveInsight[] {
  if (!redactInternalExpenses) return insights;

  return insights
    .filter((ins) => ins.category !== 'Efficiency' && ins.category !== 'Profitability')
    .map((ins) =>
      ins.id === 'rolling-3m-momentum'
        ? {
            ...ins,
            headline: filteredTrend.summaryHeadline,
            explanation: filteredTrend.summaryNarrative,
          }
        : ins
    );
}

export function filterRecommendationsForAudience(
  recommendations: StrategicRecommendation[],
  redactInternalExpenses: boolean
): StrategicRecommendation[] {
  if (!redactInternalExpenses) return recommendations;

  return recommendations.filter(
    (rec) =>
      rec.id !== 'rec-cost-discipline' &&
      rec.id !== 'rec-cadence' &&
      rec.id !== 'rec-capital-reinvest'
  );
}

export function generateExecutiveInsights(
  report: ReportInputData,
  metrics: ComputedMetrics
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];
  const cur = report.currency;

  // 1. Revenue trajectory
  if (metrics.revenueGrowthPct !== null) {
    const revDelta = report.currentPeriod.revenue - report.previousPeriod.revenue;
    const revTrace = `(${formatCurrency(report.currentPeriod.revenue, cur)} - ${formatCurrency(report.previousPeriod.revenue, cur)}) / ${formatCurrency(report.previousPeriod.revenue, cur)} = ${formatPercent(metrics.revenueGrowthPct, { signed: true })}`;
    if (metrics.revenueGrowthPct >= 15) {
      insights.push({
        id: 'rev-surge',
        headline: 'Strong Top-Line Acceleration',
        explanation: `Revenue rose ${formatPercent(metrics.revenueGrowthPct, { signed: true })} compared with ${report.previousPeriodLabel}, reaching ${formatCurrency(report.currentPeriod.revenue, cur)}.`,
        severity: 'positive',
        supportingMetric: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} period-over-period`,
        category: 'Growth',
        ruleTriggered: 'IF revenueGrowthPct >= +15.0% THEN Top-Line Acceleration',
        formulaTrace: revTrace,
      });
    } else if (metrics.revenueGrowthPct > 0) {
      insights.push({
        id: 'rev-steady',
        headline: 'Positive Revenue Expansion',
        explanation: `Total revenue increased ${formatPercent(metrics.revenueGrowthPct, { signed: true })} over ${report.previousPeriodLabel}, adding ${formatCurrency(revDelta, cur)} in top-line volume.`,
        severity: 'positive',
        supportingMetric: formatCurrency(revDelta, cur, { signed: true }),
        category: 'Growth',
        ruleTriggered: 'IF 0% < revenueGrowthPct < +15.0% THEN Positive Expansion',
        formulaTrace: revTrace,
      });
    } else if (metrics.revenueGrowthPct < 0) {
      insights.push({
        id: 'rev-decline',
        headline: 'Top-Line Revenue Contraction',
        explanation: `Revenue declined ${formatPercent(metrics.revenueGrowthPct, { signed: true })} relative to ${report.previousPeriodLabel}, signaling demand or pricing headwinds.`,
        severity: 'critical',
        supportingMetric: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior period`,
        category: 'Growth',
        ruleTriggered: 'IF revenueGrowthPct < 0% THEN Revenue Contraction Alert',
        formulaTrace: revTrace,
      });
    } else {
      insights.push({
        id: 'rev-flat',
        headline: 'Flat Period-Over-Period Revenue',
        explanation: `Revenue held unchanged versus ${report.previousPeriodLabel} at ${formatCurrency(report.currentPeriod.revenue, cur)}.`,
        severity: 'neutral',
        supportingMetric: formatCurrency(report.currentPeriod.revenue, cur),
        category: 'Growth',
        ruleTriggered: 'IF revenueGrowthPct == 0% THEN Flat Trajectory',
        formulaTrace: revTrace,
      });
    }
  }

  // 2. Operating leverage: Expenses vs Revenue growth
  if (metrics.expenseGrowthPct !== null && metrics.revenueGrowthPct !== null) {
    const spread = metrics.expenseGrowthPct - metrics.revenueGrowthPct;
    const spreadTrace = `Expense Growth (${formatPercent(metrics.expenseGrowthPct, { signed: true })}) - Revenue Growth (${formatPercent(metrics.revenueGrowthPct, { signed: true })}) = ${spread >= 0 ? '+' : ''}${spread.toFixed(1)} pts`;
    if (spread > 3) {
      insights.push({
        id: 'op-leverage-neg',
        headline: 'Expenses Outpaced Revenue Growth',
        explanation: `Operating costs expanded ${formatPercent(metrics.expenseGrowthPct, { signed: true })} while revenue grew ${formatPercent(metrics.revenueGrowthPct, { signed: true })}, creating a ${spread.toFixed(1)} percentage-point cost drag.`,
        severity: 'warning',
        supportingMetric: `Cost growth +${spread.toFixed(1)} pts above revenue`,
        category: 'Efficiency',
        ruleTriggered: 'IF (expenseGrowthPct - revenueGrowthPct) > +3.0 pts THEN Cost Drag Warning',
        formulaTrace: spreadTrace,
      });
    } else if (spread < -2) {
      insights.push({
        id: 'op-leverage-pos',
        headline: 'Favorable Operating Leverage Captured',
        explanation: `Revenue growth (${formatPercent(metrics.revenueGrowthPct, { signed: true })}) outpaced expense growth (${formatPercent(metrics.expenseGrowthPct, { signed: true })}), expanding unit profitability.`,
        severity: 'positive',
        supportingMetric: `Operating ratio ${metrics.operatingExpenseRatioPct.toFixed(1)}%`,
        category: 'Efficiency',
        ruleTriggered: 'IF (expenseGrowthPct - revenueGrowthPct) < -2.0 pts THEN Positive Operating Leverage',
        formulaTrace: spreadTrace,
      });
    }
  }

  // 3. Profit margin movement
  const marginTrace = `Current Margin ${formatPercent(metrics.profitMarginPct)} vs Prior ${formatPercent(metrics.previousProfitMarginPct)} (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts)`;
  if (metrics.netProfit < 0) {
    insights.push({
      id: 'net-loss',
      headline: 'Operating Deficit Recorded',
      explanation: `Expenses exceeded revenue by ${formatCurrency(Math.abs(metrics.netProfit), cur)}, resulting in a ${formatPercent(metrics.profitMarginPct)} net margin.`,
      severity: 'critical',
      supportingMetric: formatCurrency(metrics.netProfit, cur, { signed: true }),
      category: 'Profitability',
      ruleTriggered: 'IF netProfit < 0 THEN Operating Deficit Critical Alert',
      formulaTrace: `${formatCurrency(report.currentPeriod.revenue, cur)} - ${formatCurrency(report.currentPeriod.expenses, cur)} = ${formatCurrency(metrics.netProfit, cur)}`,
    });
  } else if (metrics.marginDeltaPts <= -2) {
    insights.push({
      id: 'margin-compressed',
      headline: 'Profit Margin Compressed',
      explanation: `Net margin contracted by ${Math.abs(metrics.marginDeltaPts).toFixed(1)} percentage points from ${formatPercent(metrics.previousProfitMarginPct)} to ${formatPercent(metrics.profitMarginPct)}.`,
      severity: 'warning',
      supportingMetric: `${metrics.marginDeltaPts.toFixed(1)} pts margin shift`,
      category: 'Profitability',
      ruleTriggered: 'IF marginDeltaPts <= -2.0 pts THEN Margin Compression Warning',
      formulaTrace: marginTrace,
    });
  } else if (metrics.marginDeltaPts >= 1.5) {
    insights.push({
      id: 'margin-expanded',
      headline: 'Net Margin Expansion Achieved',
      explanation: `Profit margin improved by +${metrics.marginDeltaPts.toFixed(1)} percentage points to ${formatPercent(metrics.profitMarginPct)}, yielding ${formatCurrency(metrics.netProfit, cur)} in net profit.`,
      severity: 'positive',
      supportingMetric: `${formatPercent(metrics.profitMarginPct)} net margin`,
      category: 'Profitability',
      ruleTriggered: 'IF marginDeltaPts >= +1.5 pts THEN Margin Expansion Positive',
      formulaTrace: marginTrace,
    });
  }

  // 4. Customer momentum & ARPU
  if (metrics.customerGrowthPct !== null) {
    const custTrace = `${formatNumber(report.currentPeriod.customerCount)} vs ${formatNumber(report.previousPeriod.customerCount)} (${formatPercent(metrics.customerGrowthPct, { signed: true })})`;
    if (metrics.customerGrowthPct >= 10) {
      insights.push({
        id: 'cust-accel',
        headline: 'Customer Acquisition Momentum Accelerated',
        explanation: `Active customer count expanded ${formatPercent(metrics.customerGrowthPct, { signed: true })} to ${formatNumber(report.currentPeriod.customerCount)} accounts${metrics.revenuePerCustomer !== null ? ` with ${formatCurrency(metrics.revenuePerCustomer, cur)} average revenue per customer` : ''}.`,
        severity: 'positive',
        supportingMetric: `${formatNumber(report.currentPeriod.customerCount)} total customers`,
        category: 'Customers',
        ruleTriggered: 'IF customerGrowthPct >= +10.0% THEN Acquisition Momentum',
        formulaTrace: custTrace,
      });
    } else if (metrics.customerGrowthPct < 0) {
      insights.push({
        id: 'cust-churn',
        headline: 'Customer Base Contraction Observed',
        explanation: `Active customers decreased ${formatPercent(metrics.customerGrowthPct, { signed: true })} compared with ${report.previousPeriodLabel}.`,
        severity: 'warning',
        supportingMetric: `${formatPercent(metrics.customerGrowthPct, { signed: true })} customer change`,
        category: 'Customers',
        ruleTriggered: 'IF customerGrowthPct < 0% THEN Customer Contraction Warning',
        formulaTrace: custTrace,
      });
    }
  }

  // 5. Category concentration
  const sortedRevCats = [...metrics.revenueCategoriesComputed].sort((a, b) => b.sharePct - a.sharePct);
  if (sortedRevCats.length > 1 && sortedRevCats[0].sharePct >= 52) {
    insights.push({
      id: 'rev-concentration',
      headline: `Revenue Concentrated in ${sortedRevCats[0].name}`,
      explanation: `${sortedRevCats[0].name} generates ${sortedRevCats[0].sharePct.toFixed(1)}% (${formatCurrency(sortedRevCats[0].amount, cur)}) of category revenue, elevating single-stream dependency.`,
      severity: sortedRevCats[0].sharePct >= 65 ? 'warning' : 'neutral',
      supportingMetric: `${sortedRevCats[0].sharePct.toFixed(1)}% revenue share`,
      category: 'Concentration',
      ruleTriggered: 'IF topRevenueCategoryShare >= 52.0% THEN Concentration Observation',
      formulaTrace: `${formatCurrency(sortedRevCats[0].amount, cur)} / ${formatCurrency(metrics.revenueCategoryTotal, cur)} = ${sortedRevCats[0].sharePct.toFixed(1)}%`,
    });
  }

  // 6. Largest expense driver
  const sortedExpCats = [...metrics.expenseCategoriesComputed].sort((a, b) => b.sharePct - a.sharePct);
  if (sortedExpCats.length > 0 && sortedExpCats[0].sharePct >= 40) {
    insights.push({
      id: 'exp-driver',
      headline: `Primary Cost Driver: ${sortedExpCats[0].name}`,
      explanation: `${sortedExpCats[0].name} represents ${sortedExpCats[0].sharePct.toFixed(1)}% (${formatCurrency(sortedExpCats[0].amount, cur)}) of total operating expenditure.`,
      severity: 'neutral',
      supportingMetric: `${sortedExpCats[0].sharePct.toFixed(1)}% of expenses`,
      category: 'Efficiency',
      ruleTriggered: 'IF topExpenseCategoryShare >= 40.0% THEN Primary Cost Driver',
      formulaTrace: `${formatCurrency(sortedExpCats[0].amount, cur)} / ${formatCurrency(metrics.expenseCategoryTotal, cur)} = ${sortedExpCats[0].sharePct.toFixed(1)}%`,
    });
  }

  // 7. Rolling 3-Month Momentum Signal
  const trend = computeTrendAnalysis(report, metrics);
  if (trend.hasSufficientData) {
    const revComp = trend.metrics.find((m) => m.id === 'revenue');
    if (revComp) {
      insights.push({
        id: 'rolling-3m-momentum',
        headline: `Rolling 3-Month Momentum: ${trend.overallSignal}`,
        explanation: trend.summaryNarrative,
        severity:
          trend.overallSignal === 'Accelerating'
            ? 'positive'
            : trend.overallSignal === 'Decelerating'
              ? 'warning'
              : 'neutral',
        supportingMetric: `${revComp.deltaFormatted} rev vs ${trend.windowMonthsCount}M avg`,
        category: 'Momentum',
        ruleTriggered: `IF latestMonth vs Rolling ${trend.windowMonthsCount}M Avg >= +1.5% / <= -1.5% THEN Momentum Signal (${trend.overallSignal})`,
        formulaTrace: revComp.formulaTrace,
      });
    }
  }

  return insights.slice(0, 6);
}

export function generateStrategicRecommendations(
  report: ReportInputData,
  metrics: ComputedMetrics,
  insights: ExecutiveInsight[]
): StrategicRecommendation[] {
  const recs: StrategicRecommendation[] = [];
  const cur = report.currency;

  const hasCostDrag = insights.some((i) => i.id === 'op-leverage-neg' || i.id === 'margin-compressed');
  const hasConcentration = insights.some((i) => i.id === 'rev-concentration');
  const hasCustDecline = insights.some((i) => i.id === 'cust-churn');

  if (hasCostDrag) {
    const topExpense = [...metrics.expenseCategoriesComputed].sort((a, b) => b.amount - a.amount)[0];
    recs.push({
      id: 'rec-cost-discipline',
      title: `Rebalance Cost Structure Around ${topExpense ? topExpense.name : 'Primary OpEx'}`,
      basis: 'Derived from Financial Facts',
      rationale: `Expense growth (${formatPercent(metrics.expenseGrowthPct, { signed: true })}) and margin shift (${metrics.marginDeltaPts.toFixed(1)} pts) indicate operating cost absorption pressure.`,
      suggestedAction: `Conduct a line-item variance review on ${topExpense ? topExpense.name : 'top expense categories'} (${topExpense ? formatCurrency(topExpense.amount, cur) : ''}) to restore >=150 bps of operating leverage next period.`,
      priority: 'High',
    });
  }

  if (hasConcentration) {
    const topRev = [...metrics.revenueCategoriesComputed].sort((a, b) => b.sharePct - a.sharePct)[0];
    const secondRev = [...metrics.revenueCategoriesComputed].sort((a, b) => b.sharePct - a.sharePct)[1];
    recs.push({
      id: 'rec-diversify',
      title: `Accelerate Secondary Stream: ${secondRev ? secondRev.name : 'Adjacent Offerings'}`,
      basis: 'Derived from Financial Facts',
      rationale: `${topRev.name} contributes ${topRev.sharePct.toFixed(1)}% of revenue, creating sensitivity to demand fluctuations in a single stream.`,
      suggestedAction: `Allocate commercial incentives toward ${secondRev ? secondRev.name : 'secondary lines'} to lift non-primary revenue share by 4–6 percentage points.`,
      priority: 'Medium',
    });
  }

  if (hasCustDecline) {
    recs.push({
      id: 'rec-retention',
      title: 'Deploy Executive Account Retention Intervention',
      basis: 'Derived from Financial Facts',
      rationale: `Active customer volume contracted ${formatPercent(metrics.customerGrowthPct, { signed: true })} versus ${report.previousPeriodLabel}.`,
      suggestedAction: 'Audit top-decile churn drivers and implement 90-day onboarding and renewal milestones to stabilize net logo retention.',
      priority: 'High',
    });
  } else if (metrics.arpuGrowthPct !== null && metrics.arpuGrowthPct > 3) {
    recs.push({
      id: 'rec-arpu-expansion',
      title: 'Scale High-Yield Account Expansion Playbook',
      basis: 'Derived from Financial Facts',
      rationale: `Revenue per customer rose ${formatPercent(metrics.arpuGrowthPct, { signed: true })} to ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'current levels'}.`,
      suggestedAction: 'Replicate multi-product packaging across mid-tier cohorts showing similar utilization patterns.',
      priority: 'Medium',
    });
  }

  if (metrics.bestMonth && metrics.worstMonth && metrics.bestMonth.month !== metrics.worstMonth.month) {
    recs.push({
      id: 'rec-cadence',
      title: 'Smooth Intra-Period Revenue & Cash Cadence',
      basis: 'Derived from Financial Facts',
      rationale: `Net profit ranged from ${formatCurrency(metrics.worstMonth.netProfit, cur)} (${metrics.worstMonth.month}) to ${formatCurrency(metrics.bestMonth.netProfit, cur)} (${metrics.bestMonth.month}).`,
      suggestedAction: 'Align milestone billing and discretionary campaign spend evenly across months to reduce working-capital volatility.',
      priority: 'Medium',
    });
  }

  if (recs.length < 3) {
    recs.push({
      id: 'rec-capital-reinvest',
      title: 'Reinvest Surplus Margin Into High-Growth Segments',
      basis: 'Derived from Financial Facts',
      rationale: `Current net profit margin stands at ${formatPercent(metrics.profitMarginPct)} with ${formatCurrency(metrics.netProfit, cur)} generated in net earnings.`,
      suggestedAction: 'Direct incremental capital toward segments delivering above-average revenue growth and gross margin resilience.',
      priority: 'Medium',
    });
  }

  return recs.slice(0, 4);
}
