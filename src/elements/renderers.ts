import {
  renderToHtml,
  renderToHtmlParts,
  renderToJson,
  renderToPlainText,
  type DesignJSON,
  type HtmlParts,
} from '@unlayer/react-elements';
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
import { buildNexoraReportTree, type UnlayerRootMode } from './NexoraReportDocument.tsx';

function getThemeFonts(report: ReportInputData) {
  const theme = resolveBrandTheme(report);
  return [{ url: theme.typography.googleFontsUrl }];
}

/**
 * 1. Email HTML (via @unlayer/react-elements <Email> root + renderToHtml)
 */
export function renderEmailHtml(report: ReportInputData): string {
  const element = buildNexoraReportTree(report, 'email');
  const html = renderToHtml(element, {
    mode: 'email',
    title: `${report.branding.companyName} — ${report.title}`,
    fonts: getThemeFonts(report),
    lang: 'en',
  });
  // Email clients disallow client scripts; remove Unlayer tool head.js blocks and safely trim CSS/inter-tag whitespace to stay well below Gmail's 102 KB clip ceiling
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
 * 2. Plain-Text Email (via @unlayer/react-elements renderToPlainText + structured executive ledger)
 */
export function renderPlainTextEmail(report: ReportInputData): string {
  const element = buildNexoraReportTree(report, 'email');
  const unlayerText = renderToPlainText(element, { mode: 'email' });
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

  void unlayerText;
  return lines.join('\n');
}

/**
 * 3. Responsive Web HTML (via @unlayer/react-elements <Page> root + renderToHtml)
 */
export function renderWebHtml(report: ReportInputData): string {
  const element = buildNexoraReportTree(report, 'web');
  return renderToHtml(element, {
    mode: 'web',
    title: `${report.branding.companyName} — ${report.title}`,
    fonts: getThemeFonts(report),
    lang: 'en',
  });
}

/**
 * 4. Print-Ready Document HTML for Playwright A4 PDF (via @unlayer/react-elements <Document> root + renderToHtml)
 */
export function renderPrintDocumentHtml(report: ReportInputData): string {
  const theme = resolveBrandTheme(report);
  const element = buildNexoraReportTree(report, 'document');
  const rawHtml = renderToHtml(element, {
    mode: 'document',
    title: `${report.branding.companyName} — ${report.title}`,
    fonts: getThemeFonts(report),
    lang: 'en',
  });

  const printCss = `
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
      table, section, tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .nexora-tooltip-bar {
        display: none !important;
      }
    </style>
  `;

  return rawHtml.replace('</head>', `${printCss}</head>`);
}

/**
 * 5. Unlayer DesignJSON & HTML Parts helpers
 */
export function renderReportDesignJson(
  report: ReportInputData,
  mode: UnlayerRootMode = 'web'
): DesignJSON {
  const element = buildNexoraReportTree(report, mode);
  return renderToJson(element);
}

export function renderReportHtmlParts(
  report: ReportInputData,
  mode: UnlayerRootMode = 'web'
): HtmlParts {
  const element = buildNexoraReportTree(report, mode);
  return renderToHtmlParts(element, { mode });
}
