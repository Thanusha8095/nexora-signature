import {
  render,
  validate,
  outline,
  type Diagnostic,
} from '@hyper-elements/react';
import { toDesign, type Design } from '@hyper-elements/react/builder';
import { getAudienceEdition } from '../core/audiences.ts';
import {
  computeReportMetrics,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../core/calculations.ts';
import {
  computeTrendAnalysis,
  filterTrendForAudience,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../core/intelligence.ts';
import { runWhatIfSimulation } from '../core/simulator.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type { ReportInputData } from '../core/types.ts';
import { buildNexoraReportTree, type NexoraRootMode } from './NexoraReportDocument.tsx';

function injectHeadMarkup(html: string, extraHead: string): string {
  if (!extraHead.trim()) return html;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${extraHead}\n</head>`);
  }
  return `${extraHead}\n${html}`;
}

function googleFontsHeadLink(report: ReportInputData): string {
  const theme = resolveBrandTheme(report);
  return `<link rel="stylesheet" href="${theme.typography.googleFontsUrl}" />`;
}

/**
 * 1. Email HTML (via @hyper-elements/react <Email> root + async render())
 */
export async function renderEmailHtml(report: ReportInputData): Promise<string> {
  const element = buildNexoraReportTree(report, 'email');
  const { html } = await render(element);
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs, css) => {
      const compactCss = String(css)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,])\s*/g, '$1')
        .trim();
      return `<style${attrs}>${compactCss}</style>`;
    })
    .replace(/>\s*\n\s*</g, '><')
    .replace(/\n[ \t]+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * 2. Plain-Text Email (via @hyper-elements/react async render().text + executive financial ledger)
 */
export async function renderPlainTextEmail(report: ReportInputData): Promise<string> {
  const element = buildNexoraReportTree(report, 'email');
  const { text: hyperText } = await render(element);
  const metrics = computeReportMetrics(report);
  const audience = getAudienceEdition(report.audienceEdition);
  const trend = filterTrendForAudience(
    computeTrendAnalysis(report, metrics),
    audience.redactInternalExpenses
  );
  const insights = generateExecutiveInsights(report, metrics);
  const recommendations = generateStrategicRecommendations(report, metrics, insights);
  const cur = report.currency;

  const lines: string[] = [
    '========================================================================',
    `${report.branding.companyName.toUpperCase()} — ${report.title}`,
    `${audience.name} | ${report.reportingPeriod} | Published ${report.reportDate} | ${report.branding.classification}`,
    ...(report.isIllustrative
      ? ['[ILLUSTRATIVE SAMPLE DATASET — FOR DEMONSTRATION PURPOSES]']
      : []),
    '========================================================================',
    '',
    'KEY FINANCIAL SNAPSHOT',
    '----------------------',
    `Revenue:          ${formatCurrency(report.currentPeriod.revenue, cur)} (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`,
    ...(!audience.redactInternalExpenses
      ? [
          `Expenses:         ${formatCurrency(report.currentPeriod.expenses, cur)} (${formatPercent(metrics.expenseGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`,
          `Net Profit:       ${formatCurrency(metrics.netProfit, cur)} (${formatPercent(metrics.profitGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`,
          `Profit Margin:    ${formatPercent(metrics.profitMarginPct)} (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift)`,
        ]
      : ['[Internal cost structure omitted in Client & Partner Edition]']),
    `Customers:        ${formatNumber(report.currentPeriod.customerCount)} (${formatPercent(metrics.customerGrowthPct, { signed: true })})`,
    `Business Health:  ${metrics.healthStatus}`,
    '',
    'EXECUTIVE SUMMARY',
    '-----------------',
    `Overview: ${report.narrative.overview}`,
    `Achievements: ${report.narrative.achievements}`,
    `Challenges: ${report.narrative.challenges}`,
    '',
    'MONTHLY PERFORMANCE',
    '-------------------',
    ...metrics.monthlyWithProfit.map((m) =>
      audience.redactInternalExpenses
        ? `  ${m.month.padEnd(12)} Rev: ${formatCurrency(m.revenue, cur).padStart(14)}`
        : `  ${m.month.padEnd(12)} Rev: ${formatCurrency(m.revenue, cur).padStart(14)} | Exp: ${formatCurrency(m.expenses, cur).padStart(14)} | Net: ${formatCurrency(m.netProfit, cur).padStart(13)} (${formatPercent(m.marginPct)})`
    ),
    '',
    'REVENUE MIX',
    '-----------',
    ...metrics.revenueCategoriesComputed.map(
      (c) => `  - ${c.name}: ${formatCurrency(c.amount, cur)} (${c.sharePct.toFixed(1)}%)`
    ),
    ...(!audience.redactInternalExpenses
      ? [
          '',
          'EXPENSE BREAKDOWN',
          '-----------------',
          ...metrics.expenseCategoriesComputed.map(
            (c) => `  - ${c.name}: ${formatCurrency(c.amount, cur)} (${c.sharePct.toFixed(1)}%)`
          ),
        ]
      : []),
    ...(audience.sectionOrder.includes('intelligence')
      ? [
          '',
          ...(trend.hasSufficientData
            ? [
                `TREND ANALYSIS (CURRENT VS. ROLLING ${trend.windowMonthsCount < 3 ? `${trend.windowMonthsCount}-MONTH` : '3-MONTH'} AVG)`,
                '----------------------------------------------',
                `Window: ${trend.windowPeriodLabel} | Overall Momentum: [${trend.overallSignal}]`,
                ...trend.metrics.map(
                  (tm) =>
                    `  - ${tm.label.padEnd(26)} ${trend.latestMonthLabel}: ${tm.currentMonthFormatted.padStart(12)} | Rolling Avg: ${tm.rolling3MoAvgFormatted.padStart(12)} | Delta: ${tm.deltaFormatted.padStart(8)} [${tm.signal}]`
                ),
                '',
              ]
            : []),
          'VERIFIED FINANCIAL OBSERVATIONS',
          '-------------------------------',
          ...insights.map(
            (ins, i) =>
              `  ${i + 1}. [${ins.category}] ${ins.headline} (${ins.supportingMetric})\n     ${ins.explanation}${ins.ruleTriggered ? `\n     Rule: ${ins.ruleTriggered}` : ''}`
          ),
          '',
          'ANALYTICAL RECOMMENDATIONS (Advisory)',
          '-------------------------------------',
          ...recommendations.map(
            (rec, i) =>
              `  ${i + 1}. [${rec.priority}] ${rec.title}\n     Action: ${rec.suggestedAction}`
          ),
        ]
      : []),
    '',
    'LEADERSHIP STRATEGIC PRIORITIES',
    '-------------------------------',
    ...report.strategicPriorities.map(
      (sp, i) => `  ${i + 1}. ${sp.title} (${sp.horizon} · Owner: ${sp.owner}) -> ${sp.targetImpact}`
    ),
    ...(report.simulation?.includeInReport && !audience.redactInternalExpenses
      ? (() => {
          const sim = runWhatIfSimulation(report, report.simulation!);
          return [
            '',
            'HYPOTHETICAL WHAT-IF PROJECTION (NON-ACTUAL SCENARIO)',
            '-----------------------------------------------------',
            `Scenario: ${sim.assumptions.scenarioName}`,
            `Projected Revenue:   ${formatCurrency(sim.projectedRevenue, cur)} (${formatCurrency(sim.revenueVariance, cur, { signed: true })} vs actual)`,
            `Projected Expenses:  ${formatCurrency(sim.projectedExpenses, cur)} (${formatCurrency(sim.expenseVariance, cur, { signed: true })} vs actual)`,
            `Projected Net Profit:${formatCurrency(sim.projectedNetProfit, cur)} (${formatCurrency(sim.netProfitVariance, cur, { signed: true })} vs actual)`,
            `Projected Margin:    ${formatPercent(sim.projectedMarginPct)} (${sim.marginVariancePts >= 0 ? '+' : ''}${sim.marginVariancePts.toFixed(1)} pts vs actual)`,
          ];
        })()
      : []),
    '',
    'CLOSING TAKEAWAY',
    '----------------',
    report.narrative.closingTakeaway,
    '',
    '------------------------------------------------------------------------',
    `${report.branding.companyName} | ${report.branding.preparedBy} | ${report.branding.contactEmail}`,
    ...(audience.showGovernanceDisclaimer ? [report.branding.disclaimer] : []),
  ];

  void hyperText;
  return lines.join('\n');
}

/**
 * 3. Responsive Web HTML (via @hyper-elements/react <Page> root + async render())
 */
export async function renderWebHtml(report: ReportInputData): Promise<string> {
  const element = buildNexoraReportTree(report, 'web');
  const { html } = await render(element);
  return injectHeadMarkup(html, googleFontsHeadLink(report));
}

/**
 * 4. Print-Ready Document HTML for Playwright A4 PDF & Browser Print Preview (via @hyper-elements/react <Document> + async render())
 */
export async function renderPrintDocumentHtml(report: ReportInputData): Promise<string> {
  const theme = resolveBrandTheme(report);
  const element = buildNexoraReportTree(report, 'document');
  const { html } = await render(element);

  const printCss = `
    ${googleFontsHeadLink(report)}
    <style>
      @page {
        size: A4 portrait;
        margin: 14mm 12mm 16mm 12mm;
      }
      html, body {
        background-color: ${theme.colors.canvas} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      table, tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    </style>
  `;

  return injectHeadMarkup(html, printCss);
}

/**
 * 5. Canvas Executive Card HTML preview (via @hyper-elements/react <Canvas> root)
 */
export async function renderCanvasHtml(report: ReportInputData): Promise<string> {
  const element = buildNexoraReportTree(report, 'canvas');
  const { html } = await render(element);
  return injectHeadMarkup(html, googleFontsHeadLink(report));
}

/**
 * 6. Builder DesignJSON & Async Render Parts & Validation Helpers (@hyper-elements/react/builder)
 */
export function renderReportDesignJson(
  report: ReportInputData,
  mode: Exclude<NexoraRootMode, 'canvas'> = 'web'
): Design {
  const element = buildNexoraReportTree(report, mode);
  return toDesign(element).design;
}

export async function renderReportHtmlParts(
  report: ReportInputData,
  mode: NexoraRootMode = 'web'
): Promise<{ head: string; body: string; bodyStyle: string; text: string; diagnostics: Diagnostic[] }> {
  const element = buildNexoraReportTree(report, mode);
  const res = await render(element);
  return {
    head: res.head,
    body: res.body,
    bodyStyle: res.bodyStyle,
    text: res.text,
    diagnostics: res.diagnostics,
  };
}

export function validateReportElements(
  report: ReportInputData,
  mode: NexoraRootMode = 'web'
) {
  const element = buildNexoraReportTree(report, mode);
  return validate(element);
}

export function outlineReportElements(
  report: ReportInputData,
  mode: NexoraRootMode = 'web'
): string {
  const element = buildNexoraReportTree(report, mode);
  return outline(element);
}
