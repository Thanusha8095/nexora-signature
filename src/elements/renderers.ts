import {
  render,
  validate,
  outline,
  type Diagnostic,
} from '@hyper-elements/react';
import { toDesign, type Design } from '@hyper-elements/react/builder';
import { getAudienceEdition } from '../core/audiences.ts';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../core/calculations.ts';
import {
  computeTrendAnalysis,
  filterInsightsForAudience,
  filterRecommendationsForAudience,
  filterTrendForAudience,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../core/intelligence.ts';
import { sanitizeReportForAudience } from '../core/redaction.ts';
import { runWhatIfSimulation } from '../core/simulator.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type { ReportInputData } from '../core/types.ts';
import {
  buildNexoraReportTree,
  type BuildNexoraTreeOptions,
  type NexoraRootMode,
} from './NexoraReportDocument.tsx';

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
    .replace(/>\s+</g, '><');
}

/**
 * 2. Plain-Text Email (via @hyper-elements/react async render().text + stakeholder-ordered executive ledger)
 */
export async function renderPlainTextEmail(rawReport: ReportInputData): Promise<string> {
  const element = buildNexoraReportTree(rawReport, 'email');
  const { text: hyperText } = await render(element);
  const { report, metrics, isRedacted: redact } = sanitizeReportForAudience(rawReport);
  const audience = getAudienceEdition(report.audienceEdition);
  const trend = filterTrendForAudience(computeTrendAnalysis(report, metrics), redact);
  const rawInsights = generateExecutiveInsights(report, metrics);
  const insights = filterInsightsForAudience(rawInsights, trend, redact, audience.id);
  const recommendations = filterRecommendationsForAudience(
    generateStrategicRecommendations(report, metrics, rawInsights, audience.id),
    redact
  );
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
    'KEY PERFORMANCE SNAPSHOT',
    '------------------------',
    `Revenue:          ${formatCurrency(report.currentPeriod.revenue, cur)} (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`,
    ...(!redact
      ? [
          `Expenses:         ${formatCurrency(report.currentPeriod.expenses, cur)} (${formatPercent(metrics.expenseGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`,
          `Net Profit:       ${formatCurrency(metrics.netProfit, cur)} (${formatPercent(metrics.profitGrowthPct, { signed: true })} vs ${report.previousPeriodLabel})`,
          `Profit Margin:    ${formatPercent(metrics.profitMarginPct)} (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift)`,
        ]
      : ['[Internal cost structure omitted in Client & Partner Edition]']),
    `Customers:        ${formatNumber(report.currentPeriod.customerCount)} (${formatPercent(metrics.customerGrowthPct, { signed: true })})`,
    ...(report.currentPeriod.retentionRatePct !== undefined
      ? [`Retention Rate:   ${report.currentPeriod.retentionRatePct.toFixed(1)}%`]
      : []),
    ...(report.currentPeriod.npsScore !== undefined
      ? [`Customer NPS:     ${report.currentPeriod.npsScore}`]
      : []),
    redact
      ? `Partner Trajectory: ${metrics.clientSafeTrajectory}`
      : `Business Health:  ${metrics.healthStatus}`,
  ];

  const emittedSections = new Set<string>();
  for (const key of audience.sectionOrder) {
    if (emittedSections.has(key)) continue;
    emittedSections.add(key);

    if (key === 'summary') {
      lines.push(
        '',
        audience.summaryHeading.toUpperCase(),
        '-'.repeat(audience.summaryHeading.length),
        `Overview: ${report.narrative.overview}`,
        `${redact ? 'Partner Highlights' : 'Achievements'}: ${report.narrative.achievements}`,
        `${redact ? 'Delivery Priorities' : 'Challenges'}: ${report.narrative.challenges}`
      );
    } else if (key === 'trends') {
      lines.push(
        '',
        'MONTHLY PERFORMANCE',
        '-------------------',
        ...metrics.monthlyWithProfit.map((m) =>
          redact
            ? `  ${m.month.padEnd(12)} Rev: ${formatCurrency(m.revenue, cur).padStart(14)}`
            : `  ${m.month.padEnd(12)} Rev: ${formatCurrency(m.revenue, cur).padStart(14)} | Exp: ${formatCurrency(m.expenses, cur).padStart(14)} | Net: ${formatCurrency(m.netProfit, cur).padStart(13)} (${formatPercent(m.marginPct)})`
        )
      );
    } else if (key === 'breakdowns') {
      lines.push(
        '',
        'REVENUE MIX',
        '-----------',
        ...metrics.revenueCategoriesComputed.map(
          (c) => `  - ${c.name}: ${formatCurrency(c.amount, cur)} (${c.sharePct.toFixed(1)}%)`
        ),
        ...(!redact
          ? [
              '',
              'EXPENSE BREAKDOWN',
              '-----------------',
              ...metrics.expenseCategoriesComputed.map(
                (c) => `  - ${c.name}: ${formatCurrency(c.amount, cur)} (${c.sharePct.toFixed(1)}%)`
              ),
            ]
          : [])
      );
    } else if (key === 'segments' && metrics.segmentsComputed.length > 0) {
      lines.push(
        '',
        redact ? 'PARTNER SEGMENT REACH' : 'SEGMENT PERFORMANCE',
        '-------------------',
        ...metrics.segmentsComputed.map((seg) =>
          redact
            ? `  - ${seg.name}: ${formatCurrency(seg.revenue, cur)} (${seg.sharePct.toFixed(1)}% · YoP ${formatPercent(seg.growthPct, { signed: true })})`
            : `  - ${seg.name}: ${formatCurrency(seg.revenue, cur)} (${seg.sharePct.toFixed(1)}% · YoP ${formatPercent(seg.growthPct, { signed: true })} · Margin ${seg.marginPct.toFixed(1)}%)`
        )
      );
    } else if (key === 'intelligence' && !redact) {
      lines.push(
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
        )
      );
    } else if (key === 'priorities' && report.strategicPriorities.length > 0) {
      lines.push(
        '',
        audience.prioritiesHeading.toUpperCase(),
        '-'.repeat(audience.prioritiesHeading.length),
        ...report.strategicPriorities.map((sp, i) =>
          redact
            ? `  ${i + 1}. ${sp.title} (${sp.horizon}) -> ${sp.targetImpact}`
            : `  ${i + 1}. ${sp.title} (${sp.horizon} · Owner: ${sp.owner}) -> ${sp.targetImpact}`
        )
      );
    } else if (key === 'simulation' && report.simulation?.includeInReport && !redact) {
      const sim = runWhatIfSimulation(report, report.simulation);
      lines.push(
        '',
        'HYPOTHETICAL WHAT-IF PROJECTION (NON-ACTUAL SCENARIO)',
        '-----------------------------------------------------',
        `Scenario: ${sim.assumptions.scenarioName}`,
        `Projected Revenue:   ${formatCurrency(sim.projectedRevenue, cur)} (${formatCurrency(sim.revenueVariance, cur, { signed: true })} vs actual; ${sim.impliedRevenueDeltaPct >= 0 ? '+' : ''}${sim.impliedRevenueDeltaPct.toFixed(1)}%)`,
        `Projected Expenses:  ${formatCurrency(sim.projectedExpenses, cur)} (${formatCurrency(sim.expenseVariance, cur, { signed: true })} vs actual)`,
        `Projected Net Profit:${formatCurrency(sim.projectedNetProfit, cur)} (${formatCurrency(sim.netProfitVariance, cur, { signed: true })} vs actual)`,
        `Projected Margin:    ${formatPercent(sim.projectedMarginPct)} (${sim.marginVariancePts >= 0 ? '+' : ''}${sim.marginVariancePts.toFixed(1)} pts vs actual)`,
        `Projected Customers: ${formatNumber(sim.projectedCustomers)} (${sim.customerVariance >= 0 ? '+' : ''}${formatNumber(sim.customerVariance)} vs actual)`,
        `Projected ARPU:      ${sim.projectedArpu !== null ? formatCurrency(sim.projectedArpu, cur) : 'N/A'}`
      );
    } else if (key === 'closing') {
      lines.push(
        '',
        audience.closingHeading.toUpperCase(),
        '-'.repeat(audience.closingHeading.length),
        report.narrative.closingTakeaway
      );
    }
  }

  lines.push(
    '',
    '------------------------------------------------------------------------',
    `${report.branding.companyName} | ${report.branding.preparedBy} | ${report.branding.contactEmail}`,
    ...(audience.showGovernanceDisclaimer ? [report.branding.disclaimer] : [])
  );

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
export async function renderPrintDocumentHtml(
  report: ReportInputData,
  options?: BuildNexoraTreeOptions
): Promise<string> {
  const theme = resolveBrandTheme(report);
  const element = buildNexoraReportTree(report, 'document', options);
  const { html } = await render(element);

  const printCss = `
    ${googleFontsHeadLink(report)}
    <style>
      @page {
        size: A4 portrait;
        margin: 16mm 12mm 16mm 12mm;
      }
      html, body {
        background-color: ${theme.colors.canvas} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      h1, h2, h3 {
        break-after: avoid;
        page-break-after: avoid;
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
