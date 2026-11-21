import {
  computeReportMetrics,
  formatCurrency,
  formatNumber,
  formatPercent,
} from './calculations.ts';
import type {
  AudienceEditionId,
  ComputedMetrics,
  ReportInputData,
  StrategicPriority,
} from './types.ts';

const CONFIDENTIAL_KEYWORD_REGEX =
  /\b(operating\s+expenses?|operating\s+costs?|operating\s+expenditure|opex|net\s+profit|profit\s+margin|net\s+margin|operating\s+margin|gross\s+margin|contribution\s+margin|net\s+operating\s+margin|net\s+operating\s+profit|ebitda|net\s+earnings|operating\s+deficit|operating\s+leverage|cost\s+of\s+goods|cogs|unit\s+cost|cost\s+savings|cost\s+structure|cost\s+drivers?|cost\s+absorption|cost\s+discipline|operating\s+ratio|overhead|reagent\s+savings|parcel\s+shipping\s+cost|fulfillment\s+costs?|logistics\s+costs?|compliance\s+spend|margin\s+(?:lift|expansion|pressure|recovery|compression|resilience|velocity|watch|shift|delta)|profitability|bps\s+(?:of\s+)?(?:gross\s+|net\s+)?margin|hypothetical\s+what-if|expenses?\s+(?:up|down|rose|grew|increased|climbed|spiked|exceeded|outpaced|fell|moderated)|spend\s+(?:stepped|scaled|rose|moderated|outpaced)|internal\s+cost\s+structure|earnings\s+visibility)\b/i;

const CONFIDENTIAL_CLAUSE_PATTERNS: RegExp[] = [
  /,?\s*\bwhile\s+(?:expanding|compressing|maintaining)\s+(?:net\s+)?(?:operating\s+)?margin[^.,;]*/gi,
  /,?\s*\b(?:and\s+)?(?:achieved|recorded|delivered|lifting\s+net\s+profit\s+to)\s+[^\s,;.]+\s+in\s+net\s+profit[^.,;]*/gi,
  /,?\s*\bcompressing\s+(?:net\s+)?margin[^.,;]*/gi,
  /,?\s*\breduced\s+[^\s,;.]*\s*unit\s+cost[^.,;]*/gi,
  /,?\s*\band\s+expanding\s+net\s+margin[^.,;]*/gi,
  /,?\s*\bmaintaining\s+(?:an?\s+)?[\d.]+%\s+operating\s+margin[^.,;]*/gi,
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectSafeRevenueTokens(report: ReportInputData): Set<string> {
  const cur = report.currency;
  const safe = new Set<string>();
  const addNum = (val: number) => {
    if (!Number.isFinite(val) || val === 0) return;
    safe.add(formatCurrency(val, cur));
    safe.add(formatCurrency(val, cur, { compact: true }));
  };
  addNum(report.currentPeriod.revenue);
  addNum(report.previousPeriod.revenue);
  for (const m of report.monthlySeries) addNum(m.revenue);
  for (const c of report.revenueCategories) addNum(c.amount);
  for (const s of report.segments) addNum(s.revenue);
  return safe;
}

export function collectConfidentialNumericTokens(
  report: ReportInputData,
  rawMetrics: ComputedMetrics
): string[] {
  const cur = report.currency;
  const safeRevTokens = collectSafeRevenueTokens(report);
  const tokens = new Set<string>();

  const addMoneyIfConfidential = (amount: number) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    const full = formatCurrency(amount, cur);
    const compact = formatCurrency(amount, cur, { compact: true });
    if (!safeRevTokens.has(full) && Math.abs(amount) >= 100) {
      tokens.add(full);
    }
    if (!safeRevTokens.has(compact) && Math.abs(amount) >= 10_000) {
      tokens.add(compact);
    }
  };

  addMoneyIfConfidential(report.currentPeriod.expenses);
  addMoneyIfConfidential(report.previousPeriod.expenses);
  addMoneyIfConfidential(rawMetrics.netProfit);
  addMoneyIfConfidential(rawMetrics.previousNetProfit);
  for (const expCat of report.expenseCategories) {
    addMoneyIfConfidential(expCat.amount);
  }

  // Exact net profit margin percentages (e.g., "29.3%" or "14.3%") when distinct from revenue growth
  const marginRounded = `${rawMetrics.profitMarginPct.toFixed(1)}%`;
  const prevMarginRounded = `${rawMetrics.previousProfitMarginPct.toFixed(1)}%`;
  const revGrowthRounded =
    rawMetrics.revenueGrowthPct !== null ? `${Math.abs(rawMetrics.revenueGrowthPct).toFixed(1)}%` : '';
  const custGrowthRounded =
    rawMetrics.customerGrowthPct !== null ? `${Math.abs(rawMetrics.customerGrowthPct).toFixed(1)}%` : '';
  const safeCategoryShares = new Set(
    rawMetrics.revenueCategoriesComputed.map((c) => `${c.sharePct.toFixed(1)}%`)
  );

  for (const mStr of [marginRounded, prevMarginRounded]) {
    if (
      rawMetrics.profitMarginPct !== 0 &&
      mStr !== revGrowthRounded &&
      mStr !== custGrowthRounded &&
      !safeCategoryShares.has(mStr)
    ) {
      tokens.add(mStr);
    }
  }

  return Array.from(tokens).filter((t) => t.length >= 4);
}

export function containsConfidentialFinancialReference(
  text: string,
  report?: ReportInputData,
  rawMetrics?: ComputedMetrics
): boolean {
  if (!text || !text.trim()) return false;
  if (CONFIDENTIAL_KEYWORD_REGEX.test(text)) {
    return true;
  }
  if (/\b\d+\+?\s*bps\b/i.test(text)) {
    return true;
  }
  if (report && rawMetrics) {
    const tokens = collectConfidentialNumericTokens(report, rawMetrics);
    for (const token of tokens) {
      const pattern = new RegExp(`(^|[^\\dA-Za-z.])${escapeRegex(token)}($|[^\\dA-Za-z])`);
      if (pattern.test(text)) {
        return true;
      }
    }
  }
  return false;
}

function buildClientSafeFallbackNarrative(
  field: 'overview' | 'achievements' | 'challenges' | 'closingTakeaway',
  report: ReportInputData,
  rawMetrics: ComputedMetrics
): string {
  const cur = report.currency;
  const rev = formatCurrency(report.currentPeriod.revenue, cur, { compact: true });
  const revGrowth =
    rawMetrics.revenueGrowthPct !== null
      ? ` (${formatPercent(rawMetrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`
      : '';
  const cust = formatNumber(report.currentPeriod.customerCount);
  const custGrowth =
    rawMetrics.customerGrowthPct !== null
      ? ` (${formatPercent(rawMetrics.customerGrowthPct, { signed: true })})`
      : '';
  const topSegment = [...rawMetrics.segmentsComputed].sort((a, b) => b.revenue - a.revenue)[0];
  const fastestSegment = [...rawMetrics.segmentsComputed].sort((a, b) => b.growthPct - a.growthPct)[0];

  if (field === 'overview') {
    const retentionClause =
      report.currentPeriod.retentionRatePct !== undefined
        ? ` Client retention reached ${report.currentPeriod.retentionRatePct.toFixed(0)}%.`
        : '';
    return `${report.branding.companyName} delivered ${rev} in ${report.reportingPeriod} platform revenue${revGrowth}, serving ${cust} active accounts${custGrowth}.${retentionClause}`.trim();
  }

  if (field === 'achievements') {
    const npsClause =
      report.currentPeriod.npsScore !== undefined
        ? ` Client satisfaction reached NPS ${report.currentPeriod.npsScore}.`
        : '';
    const segClause = fastestSegment
      ? ` ${fastestSegment.name} led partner adoption at ${formatPercent(fastestSegment.growthPct, { signed: true })} period growth.`
      : '';
    return `Expanded active partner ecosystem to ${cust} customers across ${report.revenueCategories.length} core solution lines.${segClause}${npsClause}`.trim();
  }

  if (field === 'challenges') {
    return topSegment
      ? `Continuing to broaden multi-product adoption and onboarding velocity across ${topSegment.name} and emerging partner segments during ${report.reportingPeriod}.`
      : `Focused on streamlining partner onboarding cycles and expanding multi-line product adoption across key customer cohorts.`;
  }

  return `Entering the next reporting cycle, ${report.branding.companyName} remains focused on measurable partner value, high-reliability service delivery, and shared ecosystem growth.`;
}

function stripConfidentialClauses(sentence: string): string {
  let cleaned = sentence.trim();
  for (const re of CONFIDENTIAL_CLAUSE_PATTERNS) {
    cleaned = cleaned.replace(re, '');
  }
  return cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .replace(/,\s*\./g, '.')
    .trim();
}

export function sanitizeTextForClient(
  text: string,
  field: 'overview' | 'achievements' | 'challenges' | 'closingTakeaway',
  report: ReportInputData,
  rawMetrics: ComputedMetrics
): string {
  if (field === 'overview' && report.narrative.clientSummary?.trim()) {
    const candidate = report.narrative.clientSummary.trim();
    if (!containsConfidentialFinancialReference(candidate, report, rawMetrics)) {
      return candidate;
    }
  }

  if (!text || !text.trim()) {
    return buildClientSafeFallbackNarrative(field, report, rawMetrics);
  }

  const rawSentences = text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 0);
  const kept: string[] = [];

  for (const sentence of rawSentences) {
    if (!containsConfidentialFinancialReference(sentence, report, rawMetrics)) {
      kept.push(sentence.trim());
      continue;
    }
    const stripped = stripConfidentialClauses(sentence);
    if (
      stripped.length >= 24 &&
      !containsConfidentialFinancialReference(stripped, report, rawMetrics)
    ) {
      kept.push(stripped.endsWith('.') || stripped.endsWith('!') ? stripped : `${stripped}.`);
    }
  }

  if (kept.length === 0) {
    return buildClientSafeFallbackNarrative(field, report, rawMetrics);
  }

  return kept.join(' ');
}

function sanitizePriorityForClient(
  sp: StrategicPriority,
  report: ReportInputData,
  rawMetrics: ComputedMetrics
): StrategicPriority {
  const safeTitle = containsConfidentialFinancialReference(sp.title, report, rawMetrics)
    ? sp.title
        .replace(/\b(cost|expense|opex|margin)\b/gi, 'delivery')
        .replace(/\s{2,}/g, ' ')
        .trim()
    : sp.title;

  const safeRationale = containsConfidentialFinancialReference(sp.rationale, report, rawMetrics)
    ? 'Aligned to accelerate partner adoption, delivery reliability, and customer value outcomes.'
    : sp.rationale;

  const safeImpact = containsConfidentialFinancialReference(sp.targetImpact, report, rawMetrics)
    ? 'Measured partner delivery & experience improvement'
    : sp.targetImpact;

  return {
    ...sp,
    title: safeTitle,
    owner: 'Partner Delivery Team',
    rationale: safeRationale,
    targetImpact: safeImpact,
  };
}

export interface SanitizedAudienceBundle {
  report: ReportInputData;
  metrics: ComputedMetrics;
  rawMetrics: ComputedMetrics;
  isRedacted: boolean;
}

export function sanitizeReportForAudience(
  report: ReportInputData,
  audienceOverride?: AudienceEditionId
): SanitizedAudienceBundle {
  const effectiveEdition = audienceOverride ?? report.audienceEdition ?? 'board';
  const rawMetrics = computeReportMetrics(report);
  const isRedacted = effectiveEdition === 'client';

  if (!isRedacted) {
    return {
      report,
      metrics: rawMetrics,
      rawMetrics,
      isRedacted: false,
    };
  }

  const safeClassification = report.isIllustrative
    ? 'Client & Partner Distribution · Illustrative Sample'
    : 'Client & Partner Distribution';

  const safeTitle = containsConfidentialFinancialReference(report.title, report, rawMetrics)
    ? `${report.reportingPeriod} Client & Partner Impact Review`
    : report.title;

  const safeSubtitle = containsConfidentialFinancialReference(report.subtitle, report, rawMetrics)
    ? `Partner Scale, Product Adoption & Service Outcomes${report.isIllustrative ? ' (Illustrative Dataset)' : ''}`
    : report.subtitle;

  const safeReport: ReportInputData = {
    ...report,
    audienceEdition: effectiveEdition,
    title: safeTitle,
    subtitle: safeSubtitle,
    branding: {
      ...report.branding,
      classification: safeClassification,
      preparedBy: 'Partner Success & Delivery Office',
    },
    currentPeriod: {
      ...report.currentPeriod,
      expenses: 0,
    },
    previousPeriod: {
      ...report.previousPeriod,
      expenses: 0,
    },
    monthlySeries: report.monthlySeries.map((m) => ({
      ...m,
      expenses: 0,
    })),
    expenseCategories: [],
    segments: report.segments.map((s) => ({
      ...s,
      marginPct: 0,
    })),
    narrative: {
      ...report.narrative,
      overview: sanitizeTextForClient(report.narrative.overview, 'overview', report, rawMetrics),
      achievements: sanitizeTextForClient(
        report.narrative.achievements,
        'achievements',
        report,
        rawMetrics
      ),
      challenges: sanitizeTextForClient(
        report.narrative.challenges,
        'challenges',
        report,
        rawMetrics
      ),
      closingTakeaway: sanitizeTextForClient(
        report.narrative.closingTakeaway,
        'closingTakeaway',
        report,
        rawMetrics
      ),
    },
    strategicPriorities: report.strategicPriorities.map((sp) =>
      sanitizePriorityForClient(sp, report, rawMetrics)
    ),
    simulation: undefined,
  };

  const safeMetrics: ComputedMetrics = {
    ...rawMetrics,
    netProfit: 0,
    previousNetProfit: 0,
    profitMarginPct: 0,
    previousProfitMarginPct: 0,
    marginDeltaPts: 0,
    expenseGrowthPct: null,
    profitGrowthPct: null,
    operatingExpenseRatioPct: 0,
    averageMonthlyProfit: 0,
    monthlyWithProfit: rawMetrics.monthlyWithProfit.map((m) => ({
      ...m,
      expenses: 0,
      netProfit: 0,
      marginPct: 0,
    })),
    expenseCategoriesComputed: [],
    expenseCategoryTotal: 0,
    segmentsComputed: rawMetrics.segmentsComputed.map((s) => ({
      ...s,
      marginPct: 0,
    })),
    bestMonth: rawMetrics.bestRevenueMonth
      ? { ...rawMetrics.bestRevenueMonth, expenses: 0, netProfit: 0, marginPct: 0 }
      : null,
    worstMonth: rawMetrics.worstRevenueMonth
      ? { ...rawMetrics.worstRevenueMonth, expenses: 0, netProfit: 0, marginPct: 0 }
      : null,
    bestRevenueMonth: rawMetrics.bestRevenueMonth
      ? { ...rawMetrics.bestRevenueMonth, expenses: 0, netProfit: 0, marginPct: 0 }
      : null,
    worstRevenueMonth: rawMetrics.worstRevenueMonth
      ? { ...rawMetrics.worstRevenueMonth, expenses: 0, netProfit: 0, marginPct: 0 }
      : null,
    healthStatus: 'Healthy & Stable',
  };

  return {
    report: safeReport,
    metrics: safeMetrics,
    rawMetrics,
    isRedacted: true,
  };
}

/**
 * Strips script/style/URL noise before inspecting rendered HTML or JSON for confidential data leaks.
 */
function normalizeTextForLeakAudit(rawContent: string): string {
  return rawContent
    .replace(/\[Internal cost structure omitted in Client & Partner Edition\]/gi, ' ')
    .replace(/data:image\/[^"'\s)]+/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function auditOutputForConfidentialLeaks(
  content: string,
  originalReport: ReportInputData,
  rawMetrics: ComputedMetrics
): string[] {
  const findings = new Set<string>();
  const normalized = normalizeTextForLeakAudit(content);

  const leakTerms: { label: string; regex: RegExp }[] = [
    { label: 'Operating Expenses / Cost Drivers', regex: /\b(?:operating\s+expenses?|operating\s+cost\s+drivers?|cost\s+drivers?|cost\s+structure)\b/i },
    { label: 'Net Profit / Earnings', regex: /\b(?:net\s+profit|net\s+earnings|net\s+operating\s+profit|operating\s+deficit)\b/i },
    { label: 'Profit / Net / Gross Margin', regex: /\b(?:profit\s+margin|net\s+margin|operating\s+margin|gross\s+margin|contribution\s+margin|net\s+operating\s+margin|bps\s+(?:of\s+)?(?:gross\s+)?margin)\b/i },
    { label: 'Margin Pressure Status', regex: /\b(?:margin\s+pressure|contraction\s+watch)\b/i },
    { label: 'Internal Cost Savings', regex: /\b(?:cost\s+savings|reagent\s+savings|parcel\s+shipping\s+cost|total\s+operating\s+cost)\b/i },
    { label: 'What-If Projection Appendix', regex: /\bhypothetical\s+what-if\s+projection\b/i },
    { label: 'Internal Executive Owners', regex: /\b(?:chief\s+revenue\s+officer|chief\s+compliance\s+officer|chief\s+medical\s+officer|vp\s+infrastructure|vp\s+supply\s+chain|vp\s+clinical\s+procurement)\b/i },
  ];

  for (const item of leakTerms) {
    if (item.regex.test(normalized)) {
      findings.add(item.label);
    }
  }

  for (const token of collectConfidentialNumericTokens(originalReport, rawMetrics)) {
    const tokenRe = new RegExp(`(^|[^\\dA-Za-z.])${escapeRegex(token)}($|[^\\dA-Za-z])`);
    if (tokenRe.test(normalized)) {
      findings.add(`Confidential amount/ratio (${token})`);
    }
  }

  // Also check raw unstripped JSON payloads inside HTML or DesignJSON for non-zero expense numbers
  if (originalReport.currentPeriod.expenses > 0) {
    const rawExpenseStr = String(originalReport.currentPeriod.expenses);
    if (
      originalReport.currentPeriod.expenses !== originalReport.currentPeriod.revenue &&
      content.includes(`"expenses":${rawExpenseStr}`)
    ) {
      findings.add('Serialized expenses JSON property');
    }
  }
  if (rawMetrics.netProfit !== 0) {
    const rawProfitStr = String(rawMetrics.netProfit);
    if (
      rawMetrics.netProfit !== originalReport.currentPeriod.revenue &&
      content.includes(`"netProfit":${rawProfitStr}`)
    ) {
      findings.add('Serialized netProfit JSON property');
    }
  }

  return Array.from(findings);
}
