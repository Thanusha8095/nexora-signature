import type {
  BusinessHealthStatus,
  ClientTrajectoryStatus,
  ComputedCategoryItem,
  ComputedMetrics,
  ComputedMonthlyPoint,
  ComputedSegmentItem,
  CurrencyCode,
  ReportInputData,
} from './types.ts';

const CURRENCY_LOCALES: Record<CurrencyCode, { locale: string; symbol: string; decimals: number }> = {
  USD: { locale: 'en-US', symbol: '$', decimals: 0 },
  EUR: { locale: 'en-IE', symbol: '€', decimals: 0 },
  GBP: { locale: 'en-GB', symbol: '£', decimals: 0 },
  JPY: { locale: 'ja-JP', symbol: '¥', decimals: 0 },
  CAD: { locale: 'en-CA', symbol: 'CA$', decimals: 0 },
  AUD: { locale: 'en-AU', symbol: 'A$', decimals: 0 },
  INR: { locale: 'en-IN', symbol: '₹', decimals: 0 },
  SGD: { locale: 'en-SG', symbol: 'S$', decimals: 0 },
};

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'CA$' },
  { code: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
  { code: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
];

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  options?: { compact?: boolean; decimals?: number; signed?: boolean }
): string {
  const safeVal = Number.isFinite(amount) ? amount : 0;
  const meta = CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES.USD;
  const compact = options?.compact ?? false;
  const signed = options?.signed ?? false;

  if (compact && Math.abs(safeVal) >= 1_000_000) {
    const num = safeVal / 1_000_000;
    const prefix = signed && safeVal > 0 ? '+' : safeVal < 0 ? '-' : '';
    return `${prefix}${meta.symbol}${Math.abs(num).toFixed(2)}M`;
  }
  if (compact && Math.abs(safeVal) >= 10_000) {
    const num = safeVal / 1_000;
    const prefix = signed && safeVal > 0 ? '+' : safeVal < 0 ? '-' : '';
    return `${prefix}${meta.symbol}${Math.abs(num).toFixed(1)}K`;
  }

  try {
    const formatted = new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: options?.decimals ?? meta.decimals,
      minimumFractionDigits: options?.decimals ?? meta.decimals,
    }).format(Math.abs(safeVal));

    if (safeVal < 0) return `-${formatted}`;
    if (signed && safeVal > 0) return `+${formatted}`;
    return formatted;
  } catch {
    const prefix = safeVal < 0 ? '-' : signed && safeVal > 0 ? '+' : '';
    return `${prefix}${meta.symbol}${Math.abs(safeVal).toLocaleString('en-US')}`;
  }
}

export function formatPercent(value: number | null, options?: { signed?: boolean; decimals?: number }): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  const decimals = options?.decimals ?? 1;
  const signed = options?.signed ?? false;
  const absFormatted = Math.abs(value).toFixed(decimals);
  if (value < 0) return `-${absFormatted}%`;
  if (signed && value > 0) return `+${absFormatted}%`;
  return `${absFormatted}%`;
}

export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function calcGrowthPct(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function determineHealthStatus(
  netProfit: number,
  profitMarginPct: number,
  revenueGrowthPct: number | null,
  marginDeltaPts: number
): BusinessHealthStatus {
  if (netProfit < 0 || (revenueGrowthPct !== null && revenueGrowthPct < -5)) {
    return 'Contraction Watch';
  }
  if (
    revenueGrowthPct !== null &&
    revenueGrowthPct >= 8 &&
    profitMarginPct >= 15 &&
    marginDeltaPts >= -1.5
  ) {
    return 'Strong Expansion';
  }
  if (marginDeltaPts < -3 || profitMarginPct < 8) {
    return 'Margin Pressure';
  }
  return 'Healthy & Stable';
}

export function determineClientSafeTrajectory(
  revenueGrowthPct: number | null,
  customerGrowthPct: number | null,
  retentionRatePct?: number,
  npsScore?: number
): ClientTrajectoryStatus {
  if (
    (revenueGrowthPct !== null && revenueGrowthPct < -5) ||
    (retentionRatePct !== undefined && retentionRatePct < 75)
  ) {
    return 'Retention Focus';
  }
  if (
    revenueGrowthPct !== null &&
    revenueGrowthPct >= 10 &&
    (customerGrowthPct === null || customerGrowthPct >= 5) &&
    (retentionRatePct === undefined || retentionRatePct >= 80) &&
    (npsScore === undefined || npsScore >= 40)
  ) {
    return 'Strong Partner Momentum';
  }
  if (revenueGrowthPct !== null && revenueGrowthPct < 0) {
    return 'Scale Moderation';
  }
  return 'Steady Expansion';
}

export function computeReportMetrics(report: ReportInputData): ComputedMetrics {
  const currRev = Number.isFinite(report.currentPeriod.revenue) ? report.currentPeriod.revenue : 0;
  const currExp = Number.isFinite(report.currentPeriod.expenses) ? report.currentPeriod.expenses : 0;
  const currCust = Number.isFinite(report.currentPeriod.customerCount)
    ? report.currentPeriod.customerCount
    : 0;

  const prevRev = Number.isFinite(report.previousPeriod.revenue) ? report.previousPeriod.revenue : 0;
  const prevExp = Number.isFinite(report.previousPeriod.expenses) ? report.previousPeriod.expenses : 0;
  const prevCust = Number.isFinite(report.previousPeriod.customerCount)
    ? report.previousPeriod.customerCount
    : 0;

  const netProfit = currRev - currExp;
  const previousNetProfit = prevRev - prevExp;

  const profitMarginPct = currRev > 0 ? (netProfit / currRev) * 100 : 0;
  const previousProfitMarginPct = prevRev > 0 ? (previousNetProfit / prevRev) * 100 : 0;
  const marginDeltaPts = profitMarginPct - previousProfitMarginPct;

  const revenueGrowthPct = calcGrowthPct(currRev, prevRev);
  const expenseGrowthPct = calcGrowthPct(currExp, prevExp);
  const profitGrowthPct = calcGrowthPct(netProfit, previousNetProfit);
  const customerGrowthPct = calcGrowthPct(currCust, prevCust);

  const revenuePerCustomer = currCust > 0 ? currRev / currCust : null;
  const previousRevenuePerCustomer = prevCust > 0 ? prevRev / prevCust : null;
  const arpuGrowthPct =
    revenuePerCustomer !== null && previousRevenuePerCustomer !== null
      ? calcGrowthPct(revenuePerCustomer, previousRevenuePerCustomer)
      : null;

  const operatingExpenseRatioPct = currRev > 0 ? (currExp / currRev) * 100 : 0;

  const monthlyWithProfit: ComputedMonthlyPoint[] = report.monthlySeries.map((pt) => {
    const rev = Number.isFinite(pt.revenue) ? pt.revenue : 0;
    const exp = Number.isFinite(pt.expenses) ? pt.expenses : 0;
    const profit = rev - exp;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;
    return {
      ...pt,
      revenue: rev,
      expenses: exp,
      netProfit: profit,
      marginPct: margin,
    };
  });

  const monthsInPeriod =
    monthlyWithProfit.length >= 1 && monthlyWithProfit.length <= 12 ? monthlyWithProfit.length : 3;
  const annualizedRevenueEstimate = currRev * (12 / monthsInPeriod);

  const revenueCategoryTotal = report.revenueCategories.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0
  );
  const revenueCategoriesComputed: ComputedCategoryItem[] = report.revenueCategories.map((item) => {
    const amt = Number.isFinite(item.amount) ? item.amount : 0;
    return {
      ...item,
      amount: amt,
      sharePct: revenueCategoryTotal > 0 ? (amt / revenueCategoryTotal) * 100 : 0,
    };
  });

  const expenseCategoryTotal = report.expenseCategories.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0
  );
  const expenseCategoriesComputed: ComputedCategoryItem[] = report.expenseCategories.map((item) => {
    const amt = Number.isFinite(item.amount) ? item.amount : 0;
    return {
      ...item,
      amount: amt,
      sharePct: expenseCategoryTotal > 0 ? (amt / expenseCategoryTotal) * 100 : 0,
    };
  });

  const segmentTotal = report.segments.reduce(
    (sum, item) => sum + (Number.isFinite(item.revenue) ? item.revenue : 0),
    0
  );
  const segmentsComputed: ComputedSegmentItem[] = report.segments.map((seg) => {
    const rev = Number.isFinite(seg.revenue) ? seg.revenue : 0;
    return {
      ...seg,
      revenue: rev,
      sharePct: segmentTotal > 0 ? (rev / segmentTotal) * 100 : 0,
    };
  });

  const averageMonthlyRevenue =
    monthlyWithProfit.length > 0
      ? monthlyWithProfit.reduce((acc, m) => acc + m.revenue, 0) / monthlyWithProfit.length
      : 0;
  const averageMonthlyProfit =
    monthlyWithProfit.length > 0
      ? monthlyWithProfit.reduce((acc, m) => acc + m.netProfit, 0) / monthlyWithProfit.length
      : 0;

  let bestMonth: ComputedMonthlyPoint | null = null;
  let worstMonth: ComputedMonthlyPoint | null = null;
  let bestRevenueMonth: ComputedMonthlyPoint | null = null;
  let worstRevenueMonth: ComputedMonthlyPoint | null = null;

  for (const m of monthlyWithProfit) {
    if (!bestMonth || m.netProfit > bestMonth.netProfit) bestMonth = m;
    if (!worstMonth || m.netProfit < worstMonth.netProfit) worstMonth = m;
    if (!bestRevenueMonth || m.revenue > bestRevenueMonth.revenue) bestRevenueMonth = m;
    if (!worstRevenueMonth || m.revenue < worstRevenueMonth.revenue) worstRevenueMonth = m;
  }

  const healthStatus = determineHealthStatus(
    netProfit,
    profitMarginPct,
    revenueGrowthPct,
    marginDeltaPts
  );

  const clientSafeTrajectory = determineClientSafeTrajectory(
    revenueGrowthPct,
    customerGrowthPct,
    report.currentPeriod.retentionRatePct,
    report.currentPeriod.npsScore
  );

  return {
    netProfit,
    previousNetProfit,
    profitMarginPct,
    previousProfitMarginPct,
    marginDeltaPts,
    revenueGrowthPct,
    expenseGrowthPct,
    profitGrowthPct,
    customerGrowthPct,
    revenuePerCustomer,
    previousRevenuePerCustomer,
    arpuGrowthPct,
    operatingExpenseRatioPct,
    annualizedRevenueEstimate,
    monthlyWithProfit,
    revenueCategoriesComputed,
    expenseCategoriesComputed,
    segmentsComputed,
    revenueCategoryTotal,
    expenseCategoryTotal,
    segmentTotal,
    averageMonthlyRevenue,
    averageMonthlyProfit,
    bestMonth,
    worstMonth,
    bestRevenueMonth,
    worstRevenueMonth,
    healthStatus,
    clientSafeTrajectory,
  };
}
