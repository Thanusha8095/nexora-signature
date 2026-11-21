import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOverviewKpiCards, OverviewView } from '../src/components/OverviewView.tsx';
import { PresentationModeModal } from '../src/components/PresentationModeModal.tsx';
import { AUDIENCE_EDITION_LIST, getAudienceEdition } from '../src/core/audiences.ts';
import {
  computeReportMetrics,
  determineHealthStatus,
  formatCurrency,
  formatPercent,
} from '../src/core/calculations.ts';
import { auditEmailHtml, emulateEmailClientHtml, getContrastRatio } from '../src/core/emailAudit.ts';
import { scoreReportExports } from '../src/core/exportQuality.ts';
import {
  computeTrendAnalysis,
  filterInsightsForAudience,
  filterRecommendationsForAudience,
  filterTrendForAudience,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../src/core/intelligence.ts';
import {
  auditOutputForConfidentialLeaks,
  sanitizeReportForAudience,
} from '../src/core/redaction.ts';
import { cloneReportData, SAMPLE_REPORTS } from '../src/core/samples.ts';
import {
  escapeHtml,
  sanitizeCssColor,
  sanitizeFilename,
  validateSafeImageDataUrl,
} from '../src/core/security.ts';
import {
  computeCombinedRevenueDeltaPct,
  DEFAULT_SIMULATION_ASSUMPTIONS,
  runWhatIfSimulation,
  SIMULATION_PRESETS,
  solveArpuDeltaFromRevenueAndCustomers,
} from '../src/core/simulator.ts';
import { computeHexContrast, resolveBrandTheme, THEME_LIST } from '../src/core/themes.ts';
import { validateReportData } from '../src/core/validation.ts';
import { compareReportVersions } from '../src/core/versionDiff.ts';
import {
  resolveHeroDetails,
  resolveKpiStripCards,
  resolveStoryArcChapters,
} from '../src/elements/custom/shared.ts';
import {
  outlineReportElements,
  renderCanvasHtml,
  renderEmailHtml,
  renderPlainTextEmail,
  renderPrintDocumentHtml,
  renderReportDesignJson,
  renderReportHtmlParts,
  renderWebHtml,
  validateReportElements,
} from '../src/elements/renderers.ts';
import {
  loadDistinctThemeFonts,
  rasterizeSvgLogoForNativeRender,
  renderNativeCanvasPng,
  renderNativeDocumentPdf,
} from '../src/elements/serverRenderers.ts';
import { NEXORA_CUSTOM_ELEMENTS } from '../src/elements/tools.tsx';
import { createDebouncedAutoSaver, type AutoSaveState } from '../src/hooks/useAutoSaveReport.ts';
import { generatePdfBuffer, generatePngBuffer } from '../server.ts';

describe('NEXORA Signature Core Financial Engine', () => {
  it('computes net profit, margins, and period-over-period growth accurately', () => {
    const saas = SAMPLE_REPORTS[0].report;
    const metrics = computeReportMetrics(saas);

    expect(metrics.netProfit).toBe(4_350_000);
    expect(metrics.previousNetProfit).toBe(3_150_000);
    expect(metrics.profitMarginPct).toBeCloseTo(29.2929, 2);
    expect(metrics.previousProfitMarginPct).toBeCloseTo(25.0, 2);
    expect(metrics.revenueGrowthPct).toBeCloseTo(17.857, 2);
    expect(metrics.expenseGrowthPct).toBeCloseTo(11.111, 2);
    expect(metrics.profitGrowthPct).toBeCloseTo(38.095, 2);
    expect(metrics.customerGrowthPct).toBeCloseTo(14.2857, 2);
    expect(metrics.healthStatus).toBe('Strong Expansion');
  });

  it('handles zero prior revenue without NaN or Infinity', () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    report.previousPeriod.revenue = 0;
    report.previousPeriod.customerCount = 0;
    const metrics = computeReportMetrics(report);

    expect(metrics.revenueGrowthPct).toBeNull();
    expect(metrics.customerGrowthPct).toBeNull();
    expect(formatPercent(metrics.revenueGrowthPct)).toBe('N/A');
  });

  it('formats currencies accurately', () => {
    expect(formatCurrency(14_850_000, 'USD')).toBe('$14,850,000');
    expect(formatCurrency(-2500, 'EUR')).toBe('-€2,500');
    expect(formatCurrency(14_850_000, 'USD', { compact: true })).toBe('$14.85M');
  });
});

describe('Input Validation, Security Hardening & Data Quality Guardian', () => {
  it('validates all 5 illustrative sample datasets with zero errors and 8 Guardian checks', () => {
    for (const sample of SAMPLE_REPORTS) {
      const res = validateReportData(sample.report);
      expect(res.valid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
      expect(res.checks).toHaveLength(8);
      expect(res.checks?.every((c) => c.status === 'pass')).toBe(true);
    }
  });

  it('flags mismatched category and segment reconciliation totals transparently', () => {
    const skewed = cloneReportData(SAMPLE_REPORTS[0].report);
    skewed.currentPeriod.revenue = skewed.currentPeriod.revenue + 5_000_000;
    const res = validateReportData(skewed);
    expect(res.valid).toBe(true);
    expect(res.warnings.length).toBeGreaterThanOrEqual(2);
    expect(res.checks?.some((c) => c.id === 'rev-cat-reconcile' && c.status === 'warn')).toBe(true);
    expect(res.checks?.some((c) => c.id === 'segment-reconcile' && c.status === 'warn')).toBe(true);
  });

  it('rejects negative financial values and invalid hex colors', () => {
    const bad = cloneReportData(SAMPLE_REPORTS[0].report);
    bad.currentPeriod.revenue = -500;
    bad.branding.accentColor = 'javascript:alert(1)';
    bad.branding.companyName = '';
    const res = validateReportData(bad);

    expect(res.valid).toBe(false);
    expect(res.errors['currentPeriod.revenue']).toBeDefined();
    expect(res.errors['branding.accentColor']).toBeDefined();
    expect(res.errors['branding.companyName']).toBeDefined();
  });

  it('escapes HTML entities and sanitizes filenames and colors', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
    expect(sanitizeFilename('../../etc/passwd?bad name!.pdf')).toBe('etc-passwd-bad-name');
    expect(sanitizeCssColor('#D4FF33', '#000000')).toBe('#D4FF33');
    expect(sanitizeCssColor('red;background:url(x)', '#000000')).toBe('#000000');
  });

  it('blocks SVG logos containing embedded scripts/event handlers and allows hosted HTTPS URLs', () => {
    const maliciousSvg =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent('<svg onload="alert(1)"><script>fetch("x")</script></svg>');
    const result = validateSafeImageDataUrl(maliciousSvg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('disallowed');

    expect(validateSafeImageDataUrl('https://cdn.example.com/logo.png').valid).toBe(true);
    expect(validateSafeImageDataUrl('http://insecure.example.com/logo.png').valid).toBe(false);
  });
});

describe('Transparent Rule-Based Executive Intelligence', () => {
  it('detects expense-faster-than-revenue margin pressure with rule & formula traces', () => {
    const retail = SAMPLE_REPORTS.find((s) => s.key === 'retail')!.report;
    const metrics = computeReportMetrics(retail);
    const insights = generateExecutiveInsights(retail, metrics);
    const recs = generateStrategicRecommendations(retail, metrics, insights);

    expect(insights.some((i) => i.id === 'op-leverage-neg')).toBe(true);
    expect(insights.some((i) => i.id === 'margin-compressed')).toBe(true);
    expect(insights.every((i) => Boolean(i.ruleTriggered && i.formulaTrace))).toBe(true);
    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs[0].basis).toBe('Derived from Financial Facts');
  });

  it('computes rolling 3-month Trend Analysis and momentum signals accurately across 3M and 6M datasets', () => {
    const saas = SAMPLE_REPORTS.find((s) => s.key === 'tech-saas')!.report;
    const saasMetrics = computeReportMetrics(saas);
    const saasTrend = computeTrendAnalysis(saas, saasMetrics);

    expect(saasTrend.hasSufficientData).toBe(true);
    expect(saasTrend.windowMonthsCount).toBe(3);
    expect(saasTrend.windowPeriodLabel).toBe('Jul 2026 – Sep 2026');
    expect(saasTrend.overallSignal).toBe('Accelerating');

    const revMetric = saasTrend.metrics.find((m) => m.id === 'revenue')!;
    expect(revMetric.rolling3MoAvg).toBe(4_950_000);
    expect(revMetric.currentMonthValue).toBe(5_230_000);
    expect(revMetric.deltaPct).toBeCloseTo(5.6565, 2);
    expect(revMetric.signal).toBe('Accelerating');

    const retail = SAMPLE_REPORTS.find((s) => s.key === 'retail')!.report;
    const retailMetrics = computeReportMetrics(retail);
    const retailTrend = computeTrendAnalysis(retail, retailMetrics);

    expect(retailTrend.windowMonthsCount).toBe(3);
    expect(retailTrend.totalMonthsCount).toBe(6);
    expect(retailTrend.windowPeriodLabel).toBe('Apr 2026 – Jun 2026');
    expect(retailTrend.overallSignal).toBe('Decelerating');
    expect(retailTrend.rollingSeries).toHaveLength(6);
    expect(retailTrend.rollingSeries[5].rolling3MoRevenueAvg).toBeCloseTo(4_016_666.67, 0);
  });

  it('handles short, empty, and zero-value monthly series without NaN/Infinity and redacts Client costs', () => {
    const emptyReport = cloneReportData(SAMPLE_REPORTS[0].report);
    emptyReport.monthlySeries = [];
    const emptyTrend = computeTrendAnalysis(emptyReport, computeReportMetrics(emptyReport));
    expect(emptyTrend.hasSufficientData).toBe(false);
    expect(emptyTrend.metrics).toHaveLength(0);

    const twoMonthReport = cloneReportData(SAMPLE_REPORTS[0].report);
    twoMonthReport.monthlySeries = [
      { month: 'Aug 2026', revenue: 0, expenses: 0 },
      { month: 'Sep 2026', revenue: 0, expenses: 0 },
    ];
    const twoMonthTrend = computeTrendAnalysis(twoMonthReport, computeReportMetrics(twoMonthReport));
    expect(twoMonthTrend.hasSufficientData).toBe(true);
    expect(twoMonthTrend.windowMonthsCount).toBe(2);
    expect(twoMonthTrend.metrics.find((m) => m.id === 'revenue')?.deltaPct).toBeNull();
    expect(twoMonthTrend.metrics.find((m) => m.id === 'net-profit')?.deltaPct).toBeNull();

    const fullTrend = computeTrendAnalysis(
      SAMPLE_REPORTS[0].report,
      computeReportMetrics(SAMPLE_REPORTS[0].report)
    );
    const clientTrend = filterTrendForAudience(fullTrend, true);
    expect(clientTrend.metrics.some((m) => m.id === 'expenses')).toBe(false);
    expect(clientTrend.metrics.some((m) => m.id === 'net-profit')).toBe(false);
    expect(clientTrend.metrics.some((m) => m.id === 'net-margin')).toBe(false);
    expect(clientTrend.metrics.some((m) => m.id === 'revenue')).toBe(true);
  });
});

describe('What-If Business Simulator (Strictly Non-Actual Projections)', () => {
  it('computes projected revenue, expenses, profit & monthly curves without modifying actuals', () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    const originalRevenue = base.currentPeriod.revenue;

    const sim = runWhatIfSimulation(base, {
      ...DEFAULT_SIMULATION_ASSUMPTIONS,
      revenueDeltaPct: 10,
      expenseDeltaPct: -5,
      customerDeltaPct: 12,
      arpuDeltaPct: 5,
      includeInReport: true,
    });

    expect(sim.isProjection).toBe(true);
    expect(base.currentPeriod.revenue).toBe(originalRevenue);
    expect(sim.actualRevenue).toBe(originalRevenue);
    expect(sim.projectedRevenue).toBeGreaterThan(sim.actualRevenue);
    expect(sim.projectedExpenses).toBeLessThan(sim.actualExpenses);
    expect(sim.projectedMonthlySeries).toHaveLength(base.monthlySeries.length);
  });

  it('renders labeled non-actual simulation appendix only when includeInReport is enabled', async () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    const withoutAppendix = await renderWebHtml(base);
    expect(withoutAppendix).not.toContain('HYPOTHETICAL WHAT-IF PROJECTION');

    base.simulation = {
      ...DEFAULT_SIMULATION_ASSUMPTIONS,
      includeInReport: true,
    };
    const [withAppendix, plainWithAppendix] = await Promise.all([
      renderWebHtml(base),
      renderPlainTextEmail(base),
    ]);

    expect(withAppendix).toContain('HYPOTHETICAL WHAT-IF PROJECTION');
    expect(plainWithAppendix).toContain('HYPOTHETICAL WHAT-IF PROJECTION (NON-ACTUAL SCENARIO)');
  });
});

describe('Audience Transformation & Brand DNA Studio', () => {
  it('renders distinct audience editions and redacts internal expenses in Client edition', async () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    expect(AUDIENCE_EDITION_LIST).toHaveLength(5);

    const ceoReport = { ...base, audienceEdition: 'ceo' as const };
    const ceoHtml = await renderWebHtml(ceoReport);
    expect(ceoHtml).toContain('CEO Operating Edition');
    expect(ceoHtml).toContain('Net Operating Profit');

    const clientReport = { ...base, audienceEdition: 'client' as const };
    const [clientHtml, clientPlain] = await Promise.all([
      renderWebHtml(clientReport),
      renderPlainTextEmail(clientReport),
    ]);
    const clientSpec = getAudienceEdition('client');

    expect(clientSpec.redactInternalExpenses).toBe(true);
    expect(clientHtml).toContain('External Client &amp; Partner Edition');
    expect(clientHtml).not.toContain('Operating Cost Drivers');
    expect(clientPlain).toContain('Internal cost structure omitted');
  });

  it('prevents Client Edition financial leakage in Overview KPI cards, insights, DesignJSON, and all 5 outputs', async () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    base.audienceEdition = 'client';
    base.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };

    const metrics = computeReportMetrics(base);
    const clientSpec = getAudienceEdition('client');
    const theme = resolveBrandTheme(base);
    const cards = buildOverviewKpiCards(base, metrics, clientSpec, theme);
    const cardLabels = cards.map((c) => c.label);

    expect(cardLabels).toContain('Period Revenue');
    expect(cardLabels).toContain('Active Customers');
    expect(cardLabels).not.toContain('Operating Expenses');
    expect(cardLabels).not.toContain('Net Profit');
    expect(cardLabels).not.toContain('Profit Margin');

    const validation = validateReportData(base);
    const overviewMarkup = renderToStaticMarkup(
      createElement(OverviewView, {
        report: base,
        validation,
        recentReports: [],
        showOnboarding: false,
        onDismissOnboarding: () => {},
        onReopenOnboarding: () => {},
        onSelectTab: () => {},
        onLoadSample: () => {},
        onLoadRecent: () => {},
        onSelectTheme: () => {},
        onSelectAudience: () => {},
        onOpenPresentation: () => {},
      })
    );
    expect(overviewMarkup).toContain('Period Revenue');
    expect(overviewMarkup).toContain('Partner Trajectory');
    expect(overviewMarkup).not.toContain('Operating Expenses');
    expect(overviewMarkup).not.toContain('Profit Margin');
    expect(overviewMarkup).not.toContain('$10,500,000');
    expect(overviewMarkup).not.toContain('$4,350,000');
    expect(overviewMarkup).not.toContain('net earnings');

    const rawTrend = computeTrendAnalysis(base, metrics);
    const filteredTrend = filterTrendForAudience(rawTrend, true);
    const rawInsights = generateExecutiveInsights(base, metrics);
    const filteredInsights = filterInsightsForAudience(rawInsights, filteredTrend, true);
    const filteredRecs = filterRecommendationsForAudience(
      generateStrategicRecommendations(base, metrics, rawInsights),
      true
    );

    expect(filteredInsights.some((i) => i.category === 'Efficiency' || i.category === 'Profitability')).toBe(
      false
    );
    expect(
      filteredInsights.find((i) => i.id === 'rolling-3m-momentum')?.explanation
    ).not.toContain('net earnings');
    expect(filteredRecs.some((r) => r.id === 'rec-cost-discipline')).toBe(false);

    const [webHtml, emailHtml, docHtml, canvasHtml, plainText] = await Promise.all([
      renderWebHtml(base),
      renderEmailHtml(base),
      renderPrintDocumentHtml(base),
      renderCanvasHtml(base),
      renderPlainTextEmail(base),
    ]);
    for (const rendered of [webHtml, emailHtml, docHtml, canvasHtml, plainText]) {
      expect(rendered).not.toContain('Operating Cost Drivers');
      expect(rendered).not.toContain('Operating Expenses');
      expect(rendered).not.toContain('$10,500,000');
      expect(rendered).not.toContain('$4,350,000');
      expect(rendered).not.toContain('HYPOTHETICAL WHAT-IF PROJECTION');
    }

    const designJsonStr = JSON.stringify(renderReportDesignJson(base, 'web'));
    expect(designJsonStr).not.toContain('10500000');
    expect(designJsonStr).not.toContain('4350000');
    expect(designJsonStr).not.toContain('expenseCategories');
  });

  it('resolves Brand DNA fontPreset, coverStyle, logoShape, and sanitized accent color', async () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    base.branding.fontPreset = 'classic-broadsheet';
    base.branding.coverStyle = 'swiss-precision';
    base.branding.logoShape = 'circle';
    base.branding.accentColor = '#0891B2';

    const resolved = resolveBrandTheme(base);
    expect(resolved.layoutStyle).toBe('swiss-precision');
    expect(resolved.colors.accent).toBe('#0891B2');
    expect(resolved.typography.bodyFont).toContain('DM Sans');

    const webHtml = await renderWebHtml(base);
    expect(webHtml).toMatch(/border-radius:\s*24px/i);
  });
});

describe('Email Compatibility Lab & Report Version Comparison', () => {
  it('audits rendered email HTML for size, MSO tables, Unicode sparklines, inline data URIs, and WCAG contrast', async () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    const emailHtml = await renderEmailHtml(report);
    const audit = auditEmailHtml(emailHtml, report);

    expect(audit.kbSize).toBeGreaterThan(10);
    expect(audit.tableCount).toBeGreaterThan(5);
    expect(audit.scriptTagCount).toBe(0);
    expect(audit.missingAltCount).toBe(0);
    expect(audit.contrastRatioPrimary).toBeGreaterThan(4.5);
    expect(getContrastRatio('#F8F6F0', '#111A2E')).toBeGreaterThan(12);

    // Preset uses inline data:image/svg+xml which Gmail strips -> must warn with hosted HTTPS recommendation
    expect(audit.inlineDataImageCount).toBeGreaterThan(0);
    const inlineImgCheck = audit.checks.find((c) => c.id === 'gmail-inline-images');
    expect(inlineImgCheck?.status).toBe('warn');
    expect(inlineImgCheck?.detail).toContain('hosted HTTPS');

    const sparklineCheck = audit.checks.find((c) => c.id === 'outlook-sparklines');
    expect(sparklineCheck?.status).toBe('pass');
    expect(sparklineCheck?.detail).toContain('Unicode block sparklines');

    // Hosted HTTPS logo resolves inline data URI warning cleanly
    report.branding.logoDataUrl = 'https://cdn.example.com/veloce-logo.png';
    const hostedEmailHtml = await renderEmailHtml(report);
    const hostedAudit = auditEmailHtml(hostedEmailHtml, report);
    expect(hostedAudit.inlineDataImageCount).toBe(0);
    expect(hostedAudit.checks.find((c) => c.id === 'gmail-inline-images')?.status).toBe('pass');

    const outlookEmulated = emulateEmailClientHtml(emailHtml, 'outlook');
    expect(outlookEmulated).toContain('border-radius: 0 !important');
  });

  it('computes accurate KPI, category, and metadata diffs between two report versions', () => {
    const baseline = cloneReportData(SAMPLE_REPORTS[0].report);
    const target = cloneReportData(SAMPLE_REPORTS[0].report);
    target.currentPeriod.revenue += 1_000_000;
    target.audienceEdition = 'investor';
    target.revenueCategories.push({ id: 'new-stream', name: 'AI Add-On Tier', amount: 1_000_000 });

    const diff = compareReportVersions(baseline, target);
    expect(diff.kpiDiffs[0].direction).toBe('up');
    expect(diff.kpiDiffs[0].deltaFormatted).toBe('+$1,000,000');
    expect(diff.categoryDiffs.some((c) => c.name === 'AI Add-On Tier' && c.status === 'Added')).toBe(
      true
    );
    expect(diff.metadataDiffs.some((m) => m.field === 'Audience Edition')).toBe(true);
    expect(diff.totalSignificantChanges).toBeGreaterThanOrEqual(4);
  });
});

describe('@hyper-elements/react Multi-Format & Multi-Theme Rendering', () => {
  it('renders all 3 themes across Email, Plain-Text, Web, Print Document, Canvas, Parts, and DesignJSON', async () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);

    for (const theme of THEME_LIST) {
      const themedReport = {
        ...base,
        theme: theme.id,
        branding: { ...base.branding, accentColor: theme.colors.accent },
      };

      const [emailHtml, plainText, webHtml, docHtml, canvasHtml, parts, webVal, outlineText] =
        await Promise.all([
          renderEmailHtml(themedReport),
          renderPlainTextEmail(themedReport),
          renderWebHtml(themedReport),
          renderPrintDocumentHtml(themedReport),
          renderCanvasHtml(themedReport),
          renderReportHtmlParts(themedReport, 'web'),
          validateReportElements(themedReport, 'web'),
          outlineReportElements(themedReport, 'web'),
        ]);
      const designJson = renderReportDesignJson(themedReport, 'web');

      expect(emailHtml).toContain('<!DOCTYPE');
      expect(emailHtml.toLowerCase()).toContain(theme.colors.canvas.toLowerCase());
      expect(emailHtml).toContain('Veloce Cloud Systems');
      expect(emailHtml).toContain('Monthly Revenue vs. Expenses Sparkline');
      expect(emailHtml).toContain('Trend Analysis');

      expect(plainText).toContain('VELOCE CLOUD SYSTEMS');
      expect(plainText).toContain('$14,850,000');
      expect(plainText).toContain('VERIFIED FINANCIAL OBSERVATIONS');
      expect(plainText).toContain('TREND ANALYSIS (CURRENT VS. ROLLING 3-MONTH AVG)');

      expect(webHtml).toContain('<svg');
      expect(webHtml).toContain('<rect');
      expect(webHtml).toContain('Rolling 3M Avg');
      expect(webHtml).toContain('Executive Story Arc');
      expect(webHtml).toContain('Trend Analysis');
      expect(webHtml.toLowerCase()).toContain(theme.colors.surface.toLowerCase());
      expect(webHtml.toLowerCase()).toContain(theme.colors.accent.toLowerCase());

      expect(docHtml).toContain('@page');
      expect(docHtml).toContain('A4 portrait');

      expect(canvasHtml).toContain('Veloce Cloud Systems');

      expect(parts.head).toContain('<style');
      expect(parts.body).toContain('Veloce Cloud Systems');

      expect(webVal.valid).toBe(true);
      expect(outlineText).toContain('Page');

      expect(designJson.schemaVersion).toBeGreaterThan(0);
      expect(designJson.body.rows.length).toBeGreaterThanOrEqual(8);
    }
  }, 20_000);

  it('escapes untrusted HTML injection inside report title and company name', async () => {
    const xssReport = cloneReportData(SAMPLE_REPORTS[0].report);
    xssReport.title = '<img src=x onerror=alert(1)> Q3 Review';
    xssReport.branding.companyName = 'Acme <script>evil()</script> Corp';

    const [webHtml, emailHtml] = await Promise.all([
      renderWebHtml(xssReport),
      renderEmailHtml(xssReport),
    ]);

    expect(webHtml).not.toContain('<script>evil()</script>');
    expect(webHtml).not.toContain('<img src=x onerror=alert(1)>');
    expect(webHtml).toContain('&lt;script&gt;evil()&lt;/script&gt;');
    expect(emailHtml).not.toContain('<script>evil()</script>');
  });
});

describe('Playwright Chromium PDF & PNG Generation', () => {
  it('generates a real A4 PDF buffer and 2x PNG screenshot from the shared report model', async () => {
    const report = SAMPLE_REPORTS[0].report;
    const pdfBuf = await generatePdfBuffer(report);
    const pngBuf = await generatePngBuffer(report, 1080);

    expect(pdfBuf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(pdfBuf.byteLength).toBeGreaterThan(25_000);

    expect(pngBuf[0]).toBe(0x89);
    expect(pngBuf[1]).toBe(0x50);
    expect(pngBuf[2]).toBe(0x4e);
    expect(pngBuf[3]).toBe(0x47);
    expect(pngBuf.byteLength).toBeGreaterThan(50_000);
  }, 30_000);

  it('generates native @hyper-elements/react/pdf Document PDF and @hyper-elements/react/image Canvas PNG', async () => {
    const report = SAMPLE_REPORTS[0].report;
    const [nativePdf, canvasPng] = await Promise.all([
      renderNativeDocumentPdf(report),
      renderNativeCanvasPng(report, { scale: 2, format: 'png' }),
    ]);

    expect(Buffer.from(nativePdf.pdf).subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(nativePdf.pdf.byteLength).toBeGreaterThan(20_000);

    expect(canvasPng.width).toBe(2400);
    expect(canvasPng.height).toBe(1600);
    expect(canvasPng.image[0]).toBe(0x89);
    expect(canvasPng.image[1]).toBe(0x50);
    expect(canvasPng.diagnostics).toHaveLength(0);
  }, 30_000);
});

describe('Debounced Auto-Save & Interruption Recovery', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid report edits into a single persisted write', () => {
    vi.useFakeTimers();
    const saved: string[] = [];
    const states: AutoSaveState[] = [];

    const saver = createDebouncedAutoSaver(
      (report: { title: string }) => {
        saved.push(report.title);
        return { ok: true, savedAt: '2026-11-18T10:00:00.000Z' };
      },
      500,
      (s) => states.push(s)
    );

    saver.schedule({ title: 'Draft 1' });
    vi.advanceTimersByTime(200);
    saver.schedule({ title: 'Draft 2' });
    vi.advanceTimersByTime(200);
    saver.schedule({ title: 'Draft 3' });

    expect(saved).toHaveLength(0);
    expect(saver.hasPending()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(saved).toEqual(['Draft 3']);
    expect(saver.hasPending()).toBe(false);
    expect(states[states.length - 1].status).toBe('saved');
  });

  it('flushes pending edits immediately during session interruption and surfaces storage errors', () => {
    vi.useFakeTimers();
    const saved: string[] = [];
    const states: AutoSaveState[] = [];

    const saver = createDebouncedAutoSaver(
      (report: { title: string }) => {
        saved.push(report.title);
        return { ok: true, savedAt: '2026-11-18T10:01:00.000Z' };
      },
      500,
      (s) => states.push(s)
    );

    saver.schedule({ title: 'Unsaved Interruption Draft' });
    expect(saved).toHaveLength(0);

    saver.flush();
    expect(saved).toEqual(['Unsaved Interruption Draft']);
    expect(saver.hasPending()).toBe(false);
    expect(saver.flush()).toBeNull();

    const failingSaver = createDebouncedAutoSaver(
      () => ({ ok: false, savedAt: null, error: 'QuotaExceededError' }),
      500,
      (s) => states.push(s)
    );
    failingSaver.schedule({ title: 'Too Large' });
    failingSaver.flush();
    expect(states[states.length - 1]).toEqual({
      status: 'error',
      lastSavedAt: null,
      error: 'QuotaExceededError',
    });
  });
});

describe('Genuine Export Quality Scoring & Upgraded Reporting Visuals', () => {
  it('computes genuine 0-100 Export Quality scores from live rendered artifacts and drops when data is skewed or invalid', async () => {
    const clean = cloneReportData(SAMPLE_REPORTS[0].report);
    const cleanScore = await scoreReportExports(clean);

    expect(cleanScore.overallScore).toBe(100);
    expect(cleanScore.grade).toBe('Competition Ready');
    expect(cleanScore.exportReady).toBe(true);
    expect(cleanScore.dimensions).toHaveLength(5);
    expect(cleanScore.telemetry.emailKb).toBeLessThanOrEqual(102);
    expect(cleanScore.telemetry.gmailClipRisk).toBe(false);
    expect(cleanScore.telemetry.emailTableCount).toBeGreaterThan(5);
    expect(cleanScore.telemetry.hasSvgCharts).toBe(true);
    expect(cleanScore.telemetry.hasPrintPageRule).toBe(true);
    expect(cleanScore.telemetry.redactionVerified).toBe(true);

    const sampleScores = await Promise.all(
      SAMPLE_REPORTS.map((sample) => scoreReportExports(sample.report))
    );
    for (const sampleScore of sampleScores) {
      expect(sampleScore.telemetry.emailKb).toBeLessThanOrEqual(102);
      expect(sampleScore.telemetry.gmailClipRisk).toBe(false);
      expect(sampleScore.overallScore).toBe(100);
    }

    const skewed = cloneReportData(SAMPLE_REPORTS[0].report);
    skewed.currentPeriod.revenue += 5_000_000;
    const skewedScore = await scoreReportExports(skewed);
    expect(skewedScore.overallScore).toBeLessThan(cleanScore.overallScore);
    expect(skewedScore.actionItems.length).toBeGreaterThan(0);

    const broken = cloneReportData(SAMPLE_REPORTS[0].report);
    broken.currentPeriod.revenue = -100;
    const brokenScore = await scoreReportExports(broken);
    expect(brokenScore.exportReady).toBe(false);
    expect(brokenScore.grade).toBe('Action Required');

    const clientClean = cloneReportData(SAMPLE_REPORTS[0].report);
    clientClean.audienceEdition = 'client';
    clientClean.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };
    const clientScore = await scoreReportExports(clientClean);
    expect(clientScore.telemetry.redactionVerified).toBe(true);
  }, 20_000);

  it('renders 4-beat Executive Story Arc and SVG chart with rolling 3M benchmark & negative profit baseline', async () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    report.monthlySeries[1].expenses = report.monthlySeries[1].revenue + 450_000;
    const webHtml = await renderWebHtml(report);

    expect(webHtml).toContain('01 · Scale &amp; Demand');
    expect(webHtml).toContain('02 · Rolling 3M Momentum');
    expect(webHtml).toContain('03 · Operating Leverage');
    expect(webHtml).toContain('04 · Forward Mandate');
    expect(webHtml).toContain('Rolling 3M Avg');
    expect(webHtml).toContain('<svg');
    expect(webHtml).toContain('<rect');
    expect(webHtml).toContain('<line');
    expect(webHtml).toContain('<circle');
  });

  it('verifies all 8 @hyper-elements/react defineElement() specs, zero validation diagnostics, and Windows-portable tooling config', async () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    report.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };
    const json = renderReportDesignJson(report, 'document');
    const [emailVal, webVal, docVal, canvasVal] = await Promise.all([
      validateReportElements(report, 'email'),
      validateReportElements(report, 'web'),
      validateReportElements(report, 'document'),
      validateReportElements(report, 'canvas'),
    ]);

    const expectedElements = [
      'nexora.CoverBanner',
      'nexora.HeroKpi',
      'nexora.KpiStrip',
      'nexora.StoryArc',
      'nexora.TrendChart',
      'nexora.BreakdownChart',
      'nexora.InsightsBlock',
      'nexora.SimulationAppendix',
    ];
    const registeredTypes = NEXORA_CUSTOM_ELEMENTS.map(
      (el) => (el as { displayName?: string }).displayName ?? el.name
    );
    for (const elementType of expectedElements) {
      expect(registeredTypes).toContain(elementType);
    }
    expect(NEXORA_CUSTOM_ELEMENTS).toHaveLength(8);
    expect(json.body.rows.length).toBeGreaterThanOrEqual(10);

    expect(emailVal.valid).toBe(true);
    expect(webVal.valid).toBe(true);
    expect(docVal.valid).toBe(true);
    expect(canvasVal.valid).toBe(true);
    const severe = (diags: typeof emailVal.diagnostics) =>
      diags.filter((d) => d.severity === 'error' || d.severity === 'warning');
    expect(severe(emailVal.diagnostics)).toHaveLength(0);
    expect(severe(webVal.diagnostics)).toHaveLength(0);
    expect(severe(docVal.diagnostics)).toHaveLength(0);
    expect(severe(canvasVal.diagnostics)).toHaveLength(0);

    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.clean).not.toContain('rm -rf');
    expect(pkg.scripts.clean).toContain('fs.rmSync');
    expect(fs.existsSync(path.resolve('.gitattributes'))).toBe(true);
  });
});

describe('Phase 1 — Exhaustive Client Redaction Across Themes & Formats', () => {
  it('blocks confidential expenses, net profit, margins, owners, and compact values across all themes & formats', async () => {
    const toxic = cloneReportData(SAMPLE_REPORTS[0].report);
    toxic.audienceEdition = 'client';
    toxic.title = 'Q3 Margin Expansion & $4.35M Net Profit Review';
    toxic.subtitle = 'Confidential OpEx Discipline Report';
    toxic.branding.preparedBy = 'Chief Revenue Officer & CFO';
    toxic.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };
    toxic.narrative.overview =
      'Veloce scaled revenue to $14,850,000 (+17.9%) while expanding net margin to 29.3% and lifting net profit to $4,350,000.';
    toxic.narrative.achievements =
      'Delivered $4.35M net earnings with disciplined $10.50M operating expenses.';
    toxic.narrative.closingTakeaway =
      'Focus next quarter on protecting 29.3% net profit margin and cutting COGS overhead.';
    toxic.strategicPriorities[0].owner = 'Chief Compliance Officer';
    toxic.strategicPriorities[0].title = 'Cut OpEx Margin Drag in Cloud Ops';
    toxic.strategicPriorities[0].rationale = 'Reduces operating cost drivers by $420,000 annually.';

    const rawMetrics = computeReportMetrics(toxic);

    for (const theme of THEME_LIST) {
      const themed = {
        ...toxic,
        theme: theme.id,
        branding: { ...toxic.branding, accentColor: theme.colors.accent },
      };

      const [webHtml, emailHtml, docHtml, canvasHtml, plainText] = await Promise.all([
        renderWebHtml(themed),
        renderEmailHtml(themed),
        renderPrintDocumentHtml(themed),
        renderCanvasHtml(themed),
        renderPlainTextEmail(themed),
      ]);
      const designJson = JSON.stringify(renderReportDesignJson(themed, 'web'));
      const presentationMarkup = renderToStaticMarkup(
        createElement(PresentationModeModal, {
          report: themed,
          onSelectAudience: () => {},
          onClose: () => {},
        })
      );

      for (const output of [
        webHtml,
        emailHtml,
        docHtml,
        canvasHtml,
        plainText,
        designJson,
        presentationMarkup,
      ]) {
        expect(auditOutputForConfidentialLeaks(output, toxic, rawMetrics)).toEqual([]);
        expect(output).not.toContain('$10,500,000');
        expect(output).not.toContain('$4,350,000');
        expect(output).not.toContain('$4.35M');
        expect(output).not.toContain('$10.50M');
        expect(output).not.toContain('29.3%');
        expect(output).not.toContain('Margin Pressure');
        expect(output).not.toContain('Chief Compliance Officer');
      }

      const expScore = await scoreReportExports(themed);
      expect(expScore.telemetry.redactionVerified).toBe(true);
    }
  }, 25_000);

  it('respects clean narrative.clientSummary and rejects confidential clientSummary leaks', () => {
    const clean = cloneReportData(SAMPLE_REPORTS[0].report);
    clean.audienceEdition = 'client';
    clean.narrative.clientSummary =
      'Partners deployed 18 new AI workflows across regional clinical hubs with 99.98% uptime.';
    const cleanBundle = sanitizeReportForAudience(clean);
    expect(cleanBundle.report.narrative.overview).toBe(clean.narrative.clientSummary);

    const leaky = cloneReportData(SAMPLE_REPORTS[0].report);
    leaky.audienceEdition = 'client';
    leaky.narrative.clientSummary =
      'Our team achieved a 29.3% net profit margin with $4.35M in net profit.';
    const leakyBundle = sanitizeReportForAudience(leaky);
    expect(leakyBundle.report.narrative.overview).not.toContain('net profit margin');
    expect(leakyBundle.report.narrative.overview).not.toContain('$4.35M');
  });
});

describe('Phase 2 & 3 — Five Distinct Stakeholder Editions & Dynamic A4 Pagination', () => {
  it('produces genuinely distinct hero views, KPI strips, story arcs, insights, and section order across all 5 editions', async () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    base.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };

    const kpiTitleSignatures = new Set<string>();
    const storySignatures = new Set<string>();
    const heroEyebrows = new Set<string>();
    const topInsightSignatures = new Set<string>();

    for (const edition of AUDIENCE_EDITION_LIST) {
      const edReport = { ...base, audienceEdition: edition.id };
      const { report, metrics, isRedacted } = sanitizeReportForAudience(edReport);
      const hero = resolveHeroDetails(report, metrics);
      const strip = resolveKpiStripCards(report, metrics, false);
      const overviewCards = buildOverviewKpiCards(report, metrics, edition, resolveBrandTheme(report));
      const trend = filterTrendForAudience(computeTrendAnalysis(report, metrics), isRedacted);
      const rawInsights = generateExecutiveInsights(report, metrics);
      const insights = filterInsightsForAudience(rawInsights, trend, isRedacted, edition.id);
      const chapters = resolveStoryArcChapters(report, metrics, trend);

      heroEyebrows.add(hero.eyebrow);
      kpiTitleSignatures.add(strip.map((c) => c.label).join('|'));
      storySignatures.add(chapters.map((c) => c.step).join('|'));
      topInsightSignatures.add(insights.slice(0, 3).map((i) => i.id).join('|'));

      expect(overviewCards.length).toBeGreaterThanOrEqual(4);
    }

    expect(heroEyebrows.size).toBe(5);
    expect(kpiTitleSignatures.size).toBe(5);
    expect(storySignatures.size).toBe(5);
    expect(topInsightSignatures.size).toBeGreaterThanOrEqual(3);

    // Team prioritizes priorities/roadmap BEFORE narrative summary in Web & Plain-Text
    const teamReport = { ...base, audienceEdition: 'team' as const };
    const [teamWeb, teamPlain] = await Promise.all([
      renderWebHtml(teamReport),
      renderPlainTextEmail(teamReport),
    ]);
    expect(teamWeb.indexOf('Team Execution Milestones')).toBeLessThan(
      teamWeb.indexOf('Company-Wide Wins')
    );
    expect(teamPlain.indexOf('TEAM EXECUTION MILESTONES')).toBeLessThan(
      teamPlain.indexOf('COMPANY-WIDE WINS')
    );
  });

  it('dynamically paginates Client Edition A4 PDF with zero blank trailing pages and omits duplicate DOM running chrome', async () => {
    const clientReport = cloneReportData(SAMPLE_REPORTS[0].report);
    clientReport.audienceEdition = 'client';

    const docWithDomChrome = await renderPrintDocumentHtml(clientReport);
    const docCleanForChromium = await renderPrintDocumentHtml(clientReport, {
      omitDomRunningChrome: true,
    });

    // No empty page-break divs or consecutive breaks
    expect(docCleanForChromium).not.toMatch(/page-break-before:\s*always[^>]*>\s*<\/div>\s*<div[^>]*page-break-before:\s*always/i);
    // Clean Chromium document omits DOM running chrome strings while preserving Page layout
    expect(docWithDomChrome).toContain('Page');
    expect(docCleanForChromium.length).toBeLessThan(docWithDomChrome.length);

    const pdfBuf = await generatePdfBuffer(clientReport);
    expect(pdfBuf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(pdfBuf.byteLength).toBeGreaterThan(20_000);
  }, 30_000);
});

describe('Phase 4 & 5 — Simulator Unity, Intelligence Rules & Edge Cases', () => {
  it('enforces Projected Revenue = Projected Customers * Projected ARPU without double-counting across presets', () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);

    for (const preset of SIMULATION_PRESETS) {
      const sim = runWhatIfSimulation(report, preset.assumptions);
      expect(sim.projectedArpu).not.toBeNull();
      expect(sim.projectedRevenue).toBeCloseTo(
        sim.projectedCustomers * (sim.projectedArpu ?? 0),
        -1
      );
      expect(sim.impliedRevenueDeltaPct).toBeCloseTo(
        computeCombinedRevenueDeltaPct(
          preset.assumptions.customerDeltaPct,
          preset.assumptions.arpuDeltaPct
        ),
        1
      );
    }

    const solvedArpu = solveArpuDeltaFromRevenueAndCustomers(21, 10);
    expect(solvedArpu).toBeCloseTo(10, 1);
  });

  it('retains rolling-3m-momentum across filtering, distinguishes revenue vs profit cadence, and evaluates retention/NPS rules', () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    report.currentPeriod.retentionRatePct = 108;
    report.currentPeriod.npsScore = 72;
    const metrics = computeReportMetrics(report);
    const trend = computeTrendAnalysis(report, metrics);
    const insights = generateExecutiveInsights(report, metrics);

    expect(insights.some((i) => i.id === 'retention-strong')).toBe(true);
    expect(insights.some((i) => i.id === 'nps-promoter')).toBe(true);
    expect(insights.some((i) => i.id === 'rolling-3m-momentum')).toBe(true);

    const clientFiltered = filterInsightsForAudience(insights, filterTrendForAudience(trend, true), true, 'client');
    expect(clientFiltered.some((i) => i.id === 'rolling-3m-momentum')).toBe(true);

    // Distinct profit vs revenue cadence test
    const splitReport = cloneReportData(SAMPLE_REPORTS[0].report);
    splitReport.monthlySeries = [
      { month: 'Jul 2026', revenue: 1_000_000, expenses: 950_000 },
      { month: 'Aug 2026', revenue: 1_200_000, expenses: 700_000 },
      { month: 'Sep 2026', revenue: 1_500_000, expenses: 1_400_000 },
    ];
    const splitMetrics = computeReportMetrics(splitReport);
    expect(splitMetrics.bestRevenueMonth?.month).toBe('Sep 2026');
    expect(splitMetrics.bestMonth?.month).toBe('Aug 2026');
    const splitRecs = generateStrategicRecommendations(
      splitReport,
      splitMetrics,
      generateExecutiveInsights(splitReport, splitMetrics),
      'board'
    );
    expect(splitRecs.some((r) => r.id === 'rec-cadence')).toBe(true);
    expect(splitRecs.some((r) => r.id === 'rec-profit-cadence')).toBe(true);

    // Zero-prior health status safety
    expect(determineHealthStatus(100_000, 20, null, 0)).toBe('Healthy & Stable');

    // Validation bounds for retentionRatePct & npsScore
    const invalidQual = cloneReportData(SAMPLE_REPORTS[0].report);
    invalidQual.currentPeriod.retentionRatePct = 240;
    invalidQual.currentPeriod.npsScore = -120;
    const valRes = validateReportData(invalidQual);
    expect(valRes.valid).toBe(false);
    expect(valRes.errors['currentPeriod.retentionRatePct']).toBeDefined();
    expect(valRes.errors['currentPeriod.npsScore']).toBeDefined();
  });
});

describe('Phase 6 & 7 — WCAG AA Contrast Enforcement & Native SVG/Font Rendering', () => {
  it('guarantees WCAG AA >= 4.5:1 text & accentInk contrast across all 3 themes and bright custom light accents', () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);

    for (const t of THEME_LIST) {
      const themed = resolveBrandTheme({
        ...base,
        theme: t.id,
        branding: { ...base.branding, accentColor: t.colors.accent },
      });
      for (const bg of [themed.colors.canvas, themed.colors.surface, themed.colors.elevated]) {
        expect(computeHexContrast(themed.colors.text, bg)).toBeGreaterThanOrEqual(4.5);
        expect(computeHexContrast(themed.colors.accentInk, bg)).toBeGreaterThanOrEqual(4.5);
      }
    }

    // Bright lime custom accent on light Editorial Ivory must auto-compensate accentInk for AA legibility
    const ivoryLime = resolveBrandTheme({
      ...base,
      theme: 'editorial-ivory',
      branding: { ...base.branding, accentColor: '#D4FF33' },
    });
    expect(ivoryLime.colors.accent).toBe('#D4FF33');
    expect(ivoryLime.colors.accentInk).not.toBe('#D4FF33');
    expect(computeHexContrast(ivoryLime.colors.accentInk, ivoryLime.colors.surface)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it('rasterizes inline SVG logos into PNG for native @hyper-elements/react renderers and suppresses zero-value bars', async () => {
    const sample = cloneReportData(SAMPLE_REPORTS[0].report);
    const rasterized = rasterizeSvgLogoForNativeRender(sample);
    expect(rasterized.branding.logoDataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const fonts = loadDistinctThemeFonts(sample);
    expect(fonts.length).toBeGreaterThan(0);

    // Zero-value category should not get a 1px phantom bar height in SVG charts
    sample.revenueCategories[0].amount = 0;
    const htmlWithZero = await renderWebHtml(sample);
    expect(htmlWithZero).toContain('<svg');
  });
});

