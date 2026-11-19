import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDIENCE_EDITION_LIST, getAudienceEdition } from '../src/core/audiences.ts';
import {
  computeReportMetrics,
  formatCurrency,
  formatPercent,
} from '../src/core/calculations.ts';
import { auditEmailHtml, emulateEmailClientHtml, getContrastRatio } from '../src/core/emailAudit.ts';
import { scoreReportExports } from '../src/core/exportQuality.ts';
import {
  computeTrendAnalysis,
  filterTrendForAudience,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../src/core/intelligence.ts';
import { cloneReportData, SAMPLE_REPORTS } from '../src/core/samples.ts';
import {
  escapeHtml,
  sanitizeCssColor,
  sanitizeFilename,
  validateSafeImageDataUrl,
} from '../src/core/security.ts';
import { DEFAULT_SIMULATION_ASSUMPTIONS, runWhatIfSimulation } from '../src/core/simulator.ts';
import { resolveBrandTheme, THEME_LIST } from '../src/core/themes.ts';
import { validateReportData } from '../src/core/validation.ts';
import { compareReportVersions } from '../src/core/versionDiff.ts';
import {
  renderEmailHtml,
  renderPlainTextEmail,
  renderPrintDocumentHtml,
  renderReportDesignJson,
  renderReportHtmlParts,
  renderWebHtml,
} from '../src/elements/renderers.ts';
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

  it('blocks SVG logos containing embedded scripts or event handlers', () => {
    const maliciousSvg =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent('<svg onload="alert(1)"><script>fetch("x")</script></svg>');
    const result = validateSafeImageDataUrl(maliciousSvg);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('disallowed');
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

  it('renders labeled non-actual simulation appendix only when includeInReport is enabled', () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    const withoutAppendix = renderWebHtml(base);
    expect(withoutAppendix).not.toContain('HYPOTHETICAL WHAT-IF PROJECTION');

    base.simulation = {
      ...DEFAULT_SIMULATION_ASSUMPTIONS,
      includeInReport: true,
    };
    const withAppendix = renderWebHtml(base);
    const plainWithAppendix = renderPlainTextEmail(base);

    expect(withAppendix).toContain('HYPOTHETICAL WHAT-IF PROJECTION');
    expect(plainWithAppendix).toContain('HYPOTHETICAL WHAT-IF PROJECTION (NON-ACTUAL SCENARIO)');
  });
});

describe('Audience Transformation & Brand DNA Studio', () => {
  it('renders distinct audience editions and redacts internal expenses in Client edition', () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    expect(AUDIENCE_EDITION_LIST).toHaveLength(5);

    const ceoReport = { ...base, audienceEdition: 'ceo' as const };
    const ceoHtml = renderWebHtml(ceoReport);
    expect(ceoHtml).toContain('CEO Operating Edition');
    expect(ceoHtml).toContain('Net Operating Profit');

    const clientReport = { ...base, audienceEdition: 'client' as const };
    const clientHtml = renderWebHtml(clientReport);
    const clientPlain = renderPlainTextEmail(clientReport);
    const clientSpec = getAudienceEdition('client');

    expect(clientSpec.redactInternalExpenses).toBe(true);
    expect(clientHtml).toContain('External Client &amp; Partner Edition');
    expect(clientHtml).not.toContain('Operating Cost Drivers');
    expect(clientPlain).toContain('Internal cost structure omitted');
  });

  it('resolves Brand DNA fontPreset, coverStyle, logoShape, and sanitized accent color', () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);
    base.branding.fontPreset = 'classic-broadsheet';
    base.branding.coverStyle = 'swiss-precision';
    base.branding.logoShape = 'circle';
    base.branding.accentColor = '#0891B2';

    const resolved = resolveBrandTheme(base);
    expect(resolved.layoutStyle).toBe('swiss-precision');
    expect(resolved.colors.accent).toBe('#0891B2');
    expect(resolved.typography.bodyFont).toContain('DM Sans');

    const webHtml = renderWebHtml(base);
    expect(webHtml).toContain('border-radius:9999px');
  });
});

describe('Email Compatibility Lab & Report Version Comparison', () => {
  it('audits rendered email HTML for size, MSO tables, zero scripts, and WCAG contrast', () => {
    const report = SAMPLE_REPORTS[0].report;
    const emailHtml = renderEmailHtml(report);
    const audit = auditEmailHtml(emailHtml, report);

    expect(audit.kbSize).toBeGreaterThan(10);
    expect(audit.tableCount).toBeGreaterThan(5);
    expect(audit.scriptTagCount).toBe(0);
    expect(audit.missingAltCount).toBe(0);
    expect(audit.contrastRatioPrimary).toBeGreaterThan(4.5);
    expect(getContrastRatio('#F8F6F0', '#111A2E')).toBeGreaterThan(12);

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

describe('Unlayer Hyper Elements Multi-Format & Multi-Theme Rendering', () => {
  it('renders all 3 themes across Email HTML, Plain-Text, Web HTML, Print Document, Parts, and DesignJSON', () => {
    const base = cloneReportData(SAMPLE_REPORTS[0].report);

    for (const theme of THEME_LIST) {
      const themedReport = {
        ...base,
        theme: theme.id,
        branding: { ...base.branding, accentColor: theme.colors.accent },
      };

      const emailHtml = renderEmailHtml(themedReport);
      const plainText = renderPlainTextEmail(themedReport);
      const webHtml = renderWebHtml(themedReport);
      const docHtml = renderPrintDocumentHtml(themedReport);
      const parts = renderReportHtmlParts(themedReport, 'web');
      const designJson = renderReportDesignJson(themedReport, 'web');

      expect(emailHtml).toContain('<!DOCTYPE');
      expect(emailHtml).toContain(theme.colors.canvas);
      expect(emailHtml).toContain('Veloce Cloud Systems');
      expect(emailHtml).toContain('Monthly Revenue vs. Expenses Sparkline');
      expect(emailHtml).toContain('Trend Analysis');

      expect(plainText).toContain('VELOCE CLOUD SYSTEMS');
      expect(plainText).toContain('$14,850,000');
      expect(plainText).toContain('VERIFIED FINANCIAL OBSERVATIONS');
      expect(plainText).toContain('TREND ANALYSIS (CURRENT VS. ROLLING 3-MONTH AVG)');

      expect(webHtml).toContain('<svg');
      expect(webHtml).toContain('nexora-tooltip-bar');
      expect(webHtml).toContain('Executive Story Arc');
      expect(webHtml).toContain('Trend Analysis');
      expect(webHtml).toContain(theme.colors.canvas);

      expect(docHtml).toContain('@page');
      expect(docHtml).toContain('A4 portrait');

      expect(parts.head).toContain('<style');
      expect(parts.body).toContain('Veloce Cloud Systems');

      expect(designJson.schemaVersion).toBeGreaterThan(0);
      expect(designJson.body.rows.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('escapes untrusted HTML injection inside report title and company name', () => {
    const xssReport = cloneReportData(SAMPLE_REPORTS[0].report);
    xssReport.title = '<img src=x onerror=alert(1)> Q3 Review';
    xssReport.branding.companyName = 'Acme <script>evil()</script> Corp';

    const webHtml = renderWebHtml(xssReport);
    const emailHtml = renderEmailHtml(xssReport);

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
  it('computes genuine 0-100 Export Quality scores from live rendered artifacts and drops when data is skewed or invalid', () => {
    const clean = cloneReportData(SAMPLE_REPORTS[0].report);
    const cleanScore = scoreReportExports(clean);

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

    for (const sample of SAMPLE_REPORTS) {
      const sampleScore = scoreReportExports(sample.report);
      expect(sampleScore.telemetry.emailKb).toBeLessThanOrEqual(102);
      expect(sampleScore.telemetry.gmailClipRisk).toBe(false);
      expect(sampleScore.overallScore).toBe(100);
    }

    const skewed = cloneReportData(SAMPLE_REPORTS[0].report);
    skewed.currentPeriod.revenue += 5_000_000;
    const skewedScore = scoreReportExports(skewed);
    expect(skewedScore.overallScore).toBeLessThan(cleanScore.overallScore);
    expect(skewedScore.actionItems.length).toBeGreaterThan(0);

    const broken = cloneReportData(SAMPLE_REPORTS[0].report);
    broken.currentPeriod.revenue = -100;
    const brokenScore = scoreReportExports(broken);
    expect(brokenScore.exportReady).toBe(false);
    expect(brokenScore.grade).toBe('Action Required');

    const clientClean = cloneReportData(SAMPLE_REPORTS[0].report);
    clientClean.audienceEdition = 'client';
    clientClean.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };
    const clientScore = scoreReportExports(clientClean);
    expect(clientScore.telemetry.redactionVerified).toBe(true);
  });

  it('renders 4-beat Executive Story Arc and SVG chart with rolling 3M benchmark & negative profit baseline', () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    report.monthlySeries[1].expenses = report.monthlySeries[1].revenue + 450_000;
    const webHtml = renderWebHtml(report);

    expect(webHtml).toContain('01 · Scale &amp; Demand');
    expect(webHtml).toContain('02 · Rolling 3M Momentum');
    expect(webHtml).toContain('03 · Operating Leverage');
    expect(webHtml).toContain('04 · Forward Mandate');
    expect(webHtml).toContain('Rolling 3M Rev Avg');
    expect(webHtml).toContain('stroke-dasharray="5 4"');
  });

  it('verifies all 8 @unlayer/react-elements custom tools in DesignJSON and Windows-portable tooling config', () => {
    const report = cloneReportData(SAMPLE_REPORTS[0].report);
    report.simulation = { ...DEFAULT_SIMULATION_ASSUMPTIONS, includeInReport: true };
    const json = renderReportDesignJson(report, 'document');
    const serialized = JSON.stringify(json);

    const expectedTools = [
      'nexora_cover_banner',
      'nexora_hero_kpi',
      'nexora_kpi_strip',
      'nexora_story_arc',
      'nexora_trend_chart',
      'nexora_breakdown_chart',
      'nexora_insights_block',
      'nexora_simulation_appendix',
    ];
    for (const toolName of expectedTools) {
      expect(serialized).toContain(toolName);
    }

    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.clean).not.toContain('rm -rf');
    expect(pkg.scripts.clean).toContain('fs.rmSync');
    expect(fs.existsSync(path.resolve('.gitattributes'))).toBe(true);
  });
});

