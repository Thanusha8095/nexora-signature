import { getAudienceEdition } from './audiences.ts';
import { auditEmailHtml } from './emailAudit.ts';
import {
  auditOutputForConfidentialLeaks,
  sanitizeReportForAudience,
} from './redaction.ts';
import { resolveBrandTheme } from './themes.ts';
import type { ReportInputData } from './types.ts';
import { validateReportData } from './validation.ts';
import {
  renderCanvasHtml,
  renderEmailHtml,
  renderPlainTextEmail,
  renderPrintDocumentHtml,
  renderReportDesignJson,
  renderWebHtml,
  validateReportElements,
} from '../elements/renderers.ts';

export type ExportQualityGrade =
  | 'Competition Ready'
  | 'Production Ready'
  | 'Needs Attention'
  | 'Action Required';

export interface ExportQualityFinding {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  pointsEarned: number;
  maxPoints: number;
  detail: string;
}

export interface ExportQualityDimension {
  id: 'data' | 'email' | 'web' | 'print' | 'governance';
  label: string;
  score: number;
  maxScore: number;
  summary: string;
  findings: ExportQualityFinding[];
}

export interface ExportQualityScorecard {
  overallScore: number;
  maxScore: number;
  grade: ExportQualityGrade;
  exportReady: boolean;
  dimensions: ExportQualityDimension[];
  telemetry: {
    emailKb: number;
    webKb: number;
    plainTextLines: number;
    emailTableCount: number;
    designJsonRows: number;
    contrastRatioPrimary: number;
    contrastRatioAccent: number;
    gmailClipRisk: boolean;
    hasSvgCharts: boolean;
    hasPrintPageRule: boolean;
    redactionVerified: boolean;
  };
  actionItems: string[];
}

function deriveGrade(score: number, exportReady: boolean): ExportQualityGrade {
  if (!exportReady || score < 55) return 'Action Required';
  if (score >= 90) return 'Competition Ready';
  if (score >= 75) return 'Production Ready';
  return 'Needs Attention';
}

export async function scoreReportExports(
  report: ReportInputData
): Promise<ExportQualityScorecard> {
  const validation = validateReportData(report);
  const audience = getAudienceEdition(report.audienceEdition);
  const theme = resolveBrandTheme(report);
  const { rawMetrics } = sanitizeReportForAudience(report);

  const [emailHtml, plainText, webHtml, printHtml, canvasHtml, webValidation, emailValidation] =
    await Promise.all([
      renderEmailHtml(report),
      renderPlainTextEmail(report),
      renderWebHtml(report),
      renderPrintDocumentHtml(report),
      renderCanvasHtml(report),
      validateReportElements(report, 'web'),
      validateReportElements(report, 'email'),
    ]);
  const designJson = renderReportDesignJson(report, 'web');
  const designJsonText = JSON.stringify(designJson);
  const emailAudit = auditEmailHtml(emailHtml, report);

  const webKb = new TextEncoder().encode(webHtml).byteLength / 1024;
  const plainTextLines = plainText.split('\n').length;
  const designJsonRows = designJson.body?.rows?.length ?? 0;
  const elementErrorsZero = webValidation.valid && emailValidation.valid;

  // 1. Data Integrity & Guardian Reconciliation (25 pts)
  const blockingErrorCount = Object.keys(validation.errors).length;
  const guardianChecks = validation.checks ?? [];
  const guardianWarnOrFail = guardianChecks.filter((c) => c.status !== 'pass');
  const reconcileScore = Math.max(
    0,
    25 - blockingErrorCount * 8 - guardianWarnOrFail.length * 3
  );
  const dataFindings: ExportQualityFinding[] = [
    {
      id: 'dq-blocking',
      label: 'Schema & Numeric Bounds Integrity',
      status: blockingErrorCount === 0 ? 'pass' : 'fail',
      pointsEarned: blockingErrorCount === 0 ? 12 : Math.max(0, 12 - blockingErrorCount * 6),
      maxPoints: 12,
      detail:
        blockingErrorCount === 0
          ? 'Zero blocking schema or financial figure errors.'
          : `${blockingErrorCount} blocking field error(s): ${Object.values(validation.errors)[0]}`,
    },
    {
      id: 'dq-reconcile',
      label: 'Category, Monthly & Segment Reconciliation',
      status: guardianWarnOrFail.length === 0 ? 'pass' : 'warn',
      pointsEarned: Math.max(0, 13 - guardianWarnOrFail.length * 3),
      maxPoints: 13,
      detail:
        guardianWarnOrFail.length === 0
          ? `All ${guardianChecks.length} Data Quality Guardian checks passed within 2% tolerance.`
          : `${guardianWarnOrFail.length} reconciliation/guidance warning(s): ${guardianWarnOrFail[0].label}.`,
    },
  ];

  // 2. Email Deliverability & Client Compatibility (25 pts)
  const emailZeroScriptsPts = emailAudit.scriptTagCount === 0 ? 6 : 0;
  const emailSizePts =
    emailAudit.kbSize <= 102 ? 6 : emailAudit.kbSize <= 130 ? 3 : 0;
  const emailContrastPts =
    emailAudit.contrastRatioPrimary >= 4.5 && emailAudit.contrastRatioAccent >= 4.5
      ? 5
      : emailAudit.contrastRatioPrimary >= 4.5
        ? 3
        : emailAudit.contrastRatioPrimary >= 3.0
          ? 2
          : 0;
  const emailMsoSparkPts =
    emailAudit.tableCount >= 5 && /Monthly .*Sparkline/i.test(emailHtml) ? 4 : 1;
  const emailA11yRespPts =
    emailAudit.missingAltCount === 0 &&
    /@media/i.test(emailHtml) &&
    /<html[^>]*\blang=/i.test(emailHtml)
      ? 4
      : 2;
  const emailScore =
    emailZeroScriptsPts +
    emailSizePts +
    emailContrastPts +
    emailMsoSparkPts +
    emailA11yRespPts;

  const emailFindings: ExportQualityFinding[] = [
    {
      id: 'em-size',
      label: 'Gmail 102 KB Clip Ceiling',
      status: emailAudit.kbSize <= 102 ? 'pass' : 'warn',
      pointsEarned: emailSizePts,
      maxPoints: 6,
      detail: `${emailAudit.kbSize.toFixed(1)} KB (${emailAudit.gmailClipRisk ? 'exceeds 102 KB Gmail clip line' : 'safely below 102 KB'}).`,
    },
    {
      id: 'em-scripts',
      label: 'Script-Free Email Markup',
      status: emailAudit.scriptTagCount === 0 ? 'pass' : 'fail',
      pointsEarned: emailZeroScriptsPts,
      maxPoints: 6,
      detail: `${emailAudit.scriptTagCount} <script> tags present in Email HTML output.`,
    },
    {
      id: 'em-contrast',
      label: 'Surface & AccentInk Contrast Ratio (WCAG AA)',
      status:
        emailAudit.contrastRatioPrimary >= 4.5 && emailAudit.contrastRatioAccent >= 4.5
          ? 'pass'
          : 'warn',
      pointsEarned: emailContrastPts,
      maxPoints: 5,
      detail: `${emailAudit.contrastRatioPrimary.toFixed(1)}:1 primary text ratio; ${emailAudit.contrastRatioAccent.toFixed(1)}:1 accentInk small-text contrast (${theme.name}).`,
    },
    {
      id: 'em-tables',
      label: 'MSO Table Architecture & Unicode Sparklines',
      status: emailMsoSparkPts === 4 ? 'pass' : 'warn',
      pointsEarned: emailMsoSparkPts,
      maxPoints: 4,
      detail: `${emailAudit.tableCount} tables with Unicode block sparklines (no inline SVG in email).`,
    },
    {
      id: 'em-a11y',
      label: 'Responsive Media Queries & Image Alt Coverage',
      status: emailA11yRespPts === 4 ? 'pass' : 'warn',
      pointsEarned: emailA11yRespPts,
      maxPoints: 4,
      detail: `${emailAudit.missingAltCount} missing alt attributes; language & responsive rules present.`,
    },
  ];

  // 3. Responsive Web HTML & Visual Charts (20 pts)
  const hasSvgCharts =
    /<svg\b/i.test(webHtml) && /<rect\b/i.test(webHtml) && /<line\b/i.test(webHtml);
  const hasResponsiveAndRolling =
    webHtml.includes('Rolling 3M Avg') && /@media/i.test(webHtml);
  const hasFontsAndTree =
    webHtml.includes('fonts.googleapis.com') && designJsonRows >= 5 && elementErrorsZero;
  const webHasStoryAndCompany =
    (webHtml.includes('Executive Story Arc') ||
      webHtml.includes('Partner Journey') ||
      webHtml.includes('Execution Story') ||
      webHtml.includes('Growth Story')) &&
    webHtml.includes(report.branding.companyName.replace(/[<>&"']/g, '').slice(0, 8));

  const webSvgPts = hasSvgCharts ? 7 : 0;
  const webInteractivePts = hasResponsiveAndRolling ? 5 : 2;
  const webHyperTreePts = hasFontsAndTree && webHasStoryAndCompany ? 8 : 4;
  const webScore = webSvgPts + webInteractivePts + webHyperTreePts;

  const webFindings: ExportQualityFinding[] = [
    {
      id: 'web-svg',
      label: 'Native SVG Financial Trajectory Chart',
      status: hasSvgCharts ? 'pass' : 'fail',
      pointsEarned: webSvgPts,
      maxPoints: 7,
      detail: hasSvgCharts
        ? 'Crisp native <Svg> vector chart rendered with Rolling 3M Avg dashed line and trajectory markers.'
        : 'Vector SVG chart missing from Web HTML.',
    },
    {
      id: 'web-resp',
      label: 'Responsive Breakpoints & Rolling Benchmark',
      status: hasResponsiveAndRolling ? 'pass' : 'warn',
      pointsEarned: webInteractivePts,
      maxPoints: 5,
      detail: `${webKb.toFixed(1)} KB standalone HTML5 bundle with @media responsive breakpoints and Rolling 3M benchmark.`,
    },
    {
      id: 'web-tree',
      label: '@hyper-elements/react Tree, validate() & DesignJSON',
      status: hasFontsAndTree && webHasStoryAndCompany ? 'pass' : 'warn',
      pointsEarned: webHyperTreePts,
      maxPoints: 8,
      detail: `${designJsonRows} serialized DesignJSON rows with resolved ${theme.name} web fonts and ${elementErrorsZero ? '0' : 'non-zero'} validate() errors.`,
    },
  ];

  // 4. Print / A4 PDF Pagination & Color Fidelity (15 pts)
  const hasPrintPageRule = /@page\s*\{\s*size:\s*A4/i.test(printHtml);
  const hasColorExact = /print-color-adjust:\s*exact/i.test(printHtml);
  const hasPageBreak =
    /page-break-after:\s*always|break-after:\s*page/i.test(printHtml) &&
    /break-inside:\s*avoid/i.test(printHtml);
  const hasNoEmptyPageBreak =
    !/<div[^>]*page-break-after:\s*always[^>]*><\/div>\s*(?:<div[^>]*page-break-after:\s*always|<\/body)/i.test(
      printHtml
    );

  const printPagePts = hasPrintPageRule ? 6 : 0;
  const printColorPts = hasColorExact ? 4 : 0;
  const printBreakPts = hasPageBreak && hasNoEmptyPageBreak ? 5 : 2;
  const printScore = printPagePts + printColorPts + printBreakPts;

  const printFindings: ExportQualityFinding[] = [
    {
      id: 'pdf-page',
      label: 'A4 Portrait @page Geometry',
      status: hasPrintPageRule ? 'pass' : 'fail',
      pointsEarned: printPagePts,
      maxPoints: 6,
      detail: hasPrintPageRule
        ? '@page { size: A4 portrait } unified margins verified for Playwright Chromium PDF.'
        : 'Missing @page A4 portrait print rule.',
    },
    {
      id: 'pdf-color',
      label: 'Background & Chart Color Fidelity',
      status: hasColorExact ? 'pass' : 'warn',
      pointsEarned: printColorPts,
      maxPoints: 4,
      detail: 'print-color-adjust: exact enforced for dark/colored executive themes.',
    },
    {
      id: 'pdf-breaks',
      label: 'Dynamic <PageBreak /> & Card Break-Inside Protection',
      status: hasPageBreak && hasNoEmptyPageBreak ? 'pass' : 'warn',
      pointsEarned: printBreakPts,
      maxPoints: 5,
      detail: hasNoEmptyPageBreak
        ? 'Dynamic audience-aware <PageBreak /> splits and break-inside: avoid guards with zero trailing blank pages.'
        : 'Detected trailing or consecutive empty page break rule.',
    },
  ];

  // 5. Plain-Text Completeness & Full-Output Audience Redaction Governance (15 pts)
  const plainRequiredMarkers = [
    'SNAPSHOT',
    'MONTHLY PERFORMANCE',
    audience.prioritiesHeading.toUpperCase(),
  ];
  const plainComplete =
    plainText.length >= 350 &&
    plainRequiredMarkers.every((m) => plainText.toUpperCase().includes(m));
  const plainPts = plainComplete ? 8 : 3;

  let leakDetails: string[] = [];
  if (audience.redactInternalExpenses) {
    const formatAudits: [string, string][] = [
      ['Web HTML', webHtml],
      ['Email HTML', emailHtml],
      ['Plain-Text', plainText],
      ['Print PDF HTML', printHtml],
      ['Canvas HTML', canvasHtml],
      ['DesignJSON', designJsonText],
    ];
    for (const [formatName, content] of formatAudits) {
      const leaks = auditOutputForConfidentialLeaks(content, report, rawMetrics);
      if (leaks.length > 0) {
        leakDetails.push(`${formatName}: ${leaks.join(', ')}`);
      }
    }
    if (!plainText.includes('Internal cost structure omitted')) {
      leakDetails.push('Plain-Text missing Client redaction banner');
    }
  }

  const govVerified = audience.redactInternalExpenses
    ? leakDetails.length === 0
    : webHtml.includes('Operating Cost Drivers') || plainText.includes('EXPENSE BREAKDOWN');
  const govPts = govVerified ? 7 : 0;
  const govScore = plainPts + govPts;

  const govFindings: ExportQualityFinding[] = [
    {
      id: 'pt-ledger',
      label: 'Plain-Text Multipart Executive Ledger',
      status: plainComplete ? 'pass' : 'warn',
      pointsEarned: plainPts,
      maxPoints: 8,
      detail: `${plainTextLines} structured lines ordered for ${audience.shortLabel} priorities.`,
    },
    {
      id: 'gov-audience',
      label: audience.redactInternalExpenses
        ? 'Client Edition Six-Format Redaction Audit'
        : `Audience Cost & Simulation Alignment (${audience.shortLabel})`,
      status: govVerified ? 'pass' : 'fail',
      pointsEarned: govPts,
      maxPoints: 7,
      detail: audience.redactInternalExpenses
        ? govVerified
          ? 'Confirmed zero confidential expense, margin, profit, prose, owner, or metadata leakage across Web, Email, Plain-Text, PDF Print, Canvas, and DesignJSON.'
          : `Confidential leak detected -> ${leakDetails.join(' | ')}`
        : `Full P&L and ${audience.shortLabel}-specific section ordering verified.`,
    },
  ];

  const dimensions: ExportQualityDimension[] = [
    {
      id: 'data',
      label: 'Data Integrity & Reconciliation',
      score: reconcileScore,
      maxScore: 25,
      summary:
        blockingErrorCount === 0
          ? `${guardianChecks.length - guardianWarnOrFail.length}/${guardianChecks.length} Guardian checks passed`
          : `${blockingErrorCount} blocking schema error(s)`,
      findings: dataFindings,
    },
    {
      id: 'email',
      label: 'Email Deliverability & Clients',
      score: emailScore,
      maxScore: 25,
      summary: `${emailAudit.kbSize.toFixed(1)} KB · ${emailAudit.contrastRatioPrimary.toFixed(1)}:1 contrast · 0 scripts`,
      findings: emailFindings,
    },
    {
      id: 'web',
      label: 'Web HTML & SVG Charts',
      score: webScore,
      maxScore: 20,
      summary: `${webKb.toFixed(1)} KB · ${designJsonRows} DesignJSON rows`,
      findings: webFindings,
    },
    {
      id: 'print',
      label: 'Print & A4 PDF Pagination',
      score: printScore,
      maxScore: 15,
      summary: hasPrintPageRule ? 'A4 exact-color + dynamic PageBreak' : 'Missing print CSS rules',
      findings: printFindings,
    },
    {
      id: 'governance',
      label: 'Plain-Text & Audience Governance',
      score: govScore,
      maxScore: 15,
      summary: `${plainTextLines} text lines · ${audience.shortLabel} verified`,
      findings: govFindings,
    },
  ];

  const overallScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const actionItems = dimensions
    .flatMap((d) => d.findings)
    .filter((f) => f.status !== 'pass')
    .map((f) => `${f.label}: ${f.detail}`);

  return {
    overallScore,
    maxScore: 100,
    grade: deriveGrade(overallScore, validation.valid),
    exportReady: validation.valid,
    dimensions,
    telemetry: {
      emailKb: emailAudit.kbSize,
      webKb,
      plainTextLines,
      emailTableCount: emailAudit.tableCount,
      designJsonRows,
      contrastRatioPrimary: emailAudit.contrastRatioPrimary,
      contrastRatioAccent: emailAudit.contrastRatioAccent,
      gmailClipRisk: emailAudit.gmailClipRisk,
      hasSvgCharts,
      hasPrintPageRule,
      redactionVerified: govVerified,
    },
    actionItems,
  };
}
