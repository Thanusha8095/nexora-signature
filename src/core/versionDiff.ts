import { computeReportMetrics, formatCurrency, formatNumber, formatPercent } from './calculations.ts';
import type { ReportInputData } from './types.ts';

export interface MetricDiffRow {
  metric: string;
  baselineValue: string;
  targetValue: string;
  deltaFormatted: string;
  direction: 'up' | 'down' | 'unchanged';
}

export interface CategoryDiffRow {
  name: string;
  kind: 'Revenue' | 'Expense' | 'Segment';
  baselineAmount: number;
  targetAmount: number;
  deltaAmount: number;
  status: 'Added' | 'Removed' | 'Modified' | 'Unchanged';
}

export interface MetadataDiffItem {
  field: string;
  before: string;
  after: string;
}

export interface ReportVersionDiff {
  baselineLabel: string;
  targetLabel: string;
  kpiDiffs: MetricDiffRow[];
  categoryDiffs: CategoryDiffRow[];
  metadataDiffs: MetadataDiffItem[];
  narrativeChanged: boolean;
  prioritiesChanged: boolean;
  totalSignificantChanges: number;
}

export function compareReportVersions(
  baseline: ReportInputData,
  target: ReportInputData,
  labels?: { baselineLabel?: string; targetLabel?: string }
): ReportVersionDiff {
  const mBase = computeReportMetrics(baseline);
  const mTarget = computeReportMetrics(target);
  const cur = target.currency;

  const numDiff = (
    metric: string,
    a: number,
    b: number,
    fmt: (v: number) => string,
    deltaFmt: (d: number) => string
  ): MetricDiffRow => {
    const delta = b - a;
    return {
      metric,
      baselineValue: fmt(a),
      targetValue: fmt(b),
      deltaFormatted: Math.abs(delta) < 0.001 ? 'No change' : deltaFmt(delta),
      direction: delta > 0.001 ? 'up' : delta < -0.001 ? 'down' : 'unchanged',
    };
  };

  const kpiDiffs: MetricDiffRow[] = [
    numDiff(
      'Period Revenue',
      baseline.currentPeriod.revenue,
      target.currentPeriod.revenue,
      (v) => formatCurrency(v, baseline.currency),
      (d) => formatCurrency(d, cur, { signed: true })
    ),
    numDiff(
      'Operating Expenses',
      baseline.currentPeriod.expenses,
      target.currentPeriod.expenses,
      (v) => formatCurrency(v, baseline.currency),
      (d) => formatCurrency(d, cur, { signed: true })
    ),
    numDiff(
      'Net Profit',
      mBase.netProfit,
      mTarget.netProfit,
      (v) => formatCurrency(v, baseline.currency),
      (d) => formatCurrency(d, cur, { signed: true })
    ),
    numDiff(
      'Net Profit Margin',
      mBase.profitMarginPct,
      mTarget.profitMarginPct,
      (v) => formatPercent(v),
      (d) => `${d >= 0 ? '+' : ''}${d.toFixed(1)} pts`
    ),
    numDiff(
      'Active Customers',
      baseline.currentPeriod.customerCount,
      target.currentPeriod.customerCount,
      (v) => formatNumber(v),
      (d) => `${d >= 0 ? '+' : ''}${formatNumber(d)}`
    ),
  ];

  const categoryDiffs: CategoryDiffRow[] = [];
  const diffList = (
    kind: CategoryDiffRow['kind'],
    listA: { name: string; amount: number }[],
    listB: { name: string; amount: number }[]
  ) => {
    const mapA = new Map(listA.map((x) => [x.name, x.amount]));
    const mapB = new Map(listB.map((x) => [x.name, x.amount]));
    const allNames = new Set([...mapA.keys(), ...mapB.keys()]);
    for (const name of allNames) {
      const a = mapA.get(name);
      const b = mapB.get(name);
      if (a === undefined && b !== undefined) {
        categoryDiffs.push({
          name,
          kind,
          baselineAmount: 0,
          targetAmount: b,
          deltaAmount: b,
          status: 'Added',
        });
      } else if (a !== undefined && b === undefined) {
        categoryDiffs.push({
          name,
          kind,
          baselineAmount: a,
          targetAmount: 0,
          deltaAmount: -a,
          status: 'Removed',
        });
      } else if (a !== undefined && b !== undefined) {
        const delta = b - a;
        categoryDiffs.push({
          name,
          kind,
          baselineAmount: a,
          targetAmount: b,
          deltaAmount: delta,
          status: Math.abs(delta) > 0.01 ? 'Modified' : 'Unchanged',
        });
      }
    }
  };

  diffList('Revenue', baseline.revenueCategories, target.revenueCategories);
  diffList('Expense', baseline.expenseCategories, target.expenseCategories);
  diffList(
    'Segment',
    baseline.segments.map((s) => ({ name: s.name, amount: s.revenue })),
    target.segments.map((s) => ({ name: s.name, amount: s.revenue }))
  );

  const metadataDiffs: MetadataDiffItem[] = [];
  const checkMeta = (field: string, before: string, after: string) => {
    if (before !== after) {
      metadataDiffs.push({ field, before, after });
    }
  };
  checkMeta('Company Name', baseline.branding.companyName, target.branding.companyName);
  checkMeta('Report Title', baseline.title, target.title);
  checkMeta('Reporting Period', baseline.reportingPeriod, target.reportingPeriod);
  checkMeta('Theme', baseline.theme, target.theme);
  checkMeta('Currency', baseline.currency, target.currency);
  checkMeta(
    'Audience Edition',
    baseline.audienceEdition ?? 'board',
    target.audienceEdition ?? 'board'
  );

  const narrativeChanged =
    JSON.stringify(baseline.narrative) !== JSON.stringify(target.narrative);
  const prioritiesChanged =
    JSON.stringify(baseline.strategicPriorities) !== JSON.stringify(target.strategicPriorities);

  const totalSignificantChanges =
    kpiDiffs.filter((k) => k.direction !== 'unchanged').length +
    categoryDiffs.filter((c) => c.status !== 'Unchanged').length +
    metadataDiffs.length +
    (narrativeChanged ? 1 : 0) +
    (prioritiesChanged ? 1 : 0);

  return {
    baselineLabel:
      labels?.baselineLabel || `${baseline.branding.companyName} (${baseline.reportingPeriod})`,
    targetLabel:
      labels?.targetLabel || `${target.branding.companyName} (${target.reportingPeriod})`,
    kpiDiffs,
    categoryDiffs,
    metadataDiffs,
    narrativeChanged,
    prioritiesChanged,
    totalSignificantChanges,
  };
}
