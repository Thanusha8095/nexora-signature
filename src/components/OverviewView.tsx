import {
  ArrowRight,
  Check,
  Eye,
  FileEdit,
  FileText,
  GitCompare,
  Globe,
  Image as ImageIcon,
  Mail,
  MailCheck,
  Presentation,
  Printer,
  ShieldCheck,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { AUDIENCE_EDITION_LIST, getAudienceEdition } from '../core/audiences.ts';
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
} from '../core/intelligence.ts';
import { SAMPLE_REPORTS } from '../core/samples.ts';
import { REPORT_THEMES } from '../core/themes.ts';
import type { AudienceEditionId, ReportInputData, ValidationResult } from '../core/types.ts';
import type { SavedReportEntry } from '../services/storage.ts';
import type { StudioTabId } from './TopBar.tsx';
import { TrendAnalysisPanel } from './TrendAnalysisPanel.tsx';

interface OverviewViewProps {
  report: ReportInputData;
  validation: ValidationResult;
  recentReports: SavedReportEntry[];
  showOnboarding: boolean;
  onDismissOnboarding: () => void;
  onReopenOnboarding: () => void;
  onSelectTab: (tab: StudioTabId) => void;
  onLoadSample: (sampleKey: string) => void;
  onLoadRecent: (entry: SavedReportEntry) => void;
  onSelectTheme: (theme: ReportInputData['theme']) => void;
  onSelectAudience: (edition: AudienceEditionId) => void;
  onOpenPresentation: () => void;
}

export function OverviewView({
  report,
  validation,
  recentReports,
  showOnboarding,
  onDismissOnboarding,
  onReopenOnboarding,
  onSelectTab,
  onLoadSample,
  onLoadRecent,
  onSelectTheme,
  onSelectAudience,
  onOpenPresentation,
}: OverviewViewProps) {
  const metrics = computeReportMetrics(report);
  const theme = REPORT_THEMES[report.theme] ?? REPORT_THEMES['midnight-luxe'];
  const audience = getAudienceEdition(report.audienceEdition);
  const rawTrend = computeTrendAnalysis(report, metrics);
  const trendAnalysis = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
  const rawInsights = generateExecutiveInsights(report, metrics);
  const insights = audience.redactInternalExpenses
    ? rawInsights.filter((ins) => ins.category !== 'Efficiency' && ins.category !== 'Profitability')
    : rawInsights;
  const cur = report.currency;

  const qualityChecks = validation.checks ?? [];
  const passChecks = qualityChecks.filter((c) => c.status === 'pass').length;

  const formatOutputs = [
    {
      name: 'Email HTML',
      root: '<Email> · renderToHtml',
      desc: 'Table-safe inline markup with table sparklines',
      icon: Mail,
    },
    {
      name: 'Plain-Text Email',
      root: '<Email> · renderToPlainText',
      desc: 'Structured executive ledger for text clients',
      icon: FileText,
    },
    {
      name: 'Responsive Web',
      root: '<Page> · renderToHtml',
      desc: 'SVG charts with interactive hover tooltips',
      icon: Globe,
    },
    {
      name: 'A4 Executive PDF',
      root: '<Document> · Playwright',
      desc: 'Paginated print layout with page numbers',
      icon: Printer,
    },
    {
      name: 'High-Res PNG',
      root: '<Page> · Playwright 2x',
      desc: 'Full-page Retina snapshot for slide decks',
      icon: ImageIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>One Report</span>
            <span aria-hidden="true">&middot;</span>
            <span>One Validated Model</span>
            <span aria-hidden="true">&middot;</span>
            <span>Five Output Formats</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-[#0B1120] mt-2 tracking-tight">
            Executive Reporting Workspace
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Author structured financial intelligence once inside NEXORA Signature, transform
            outputs for CEO, Investor, Board, Team, or Client stakeholders, and verify every
            deliverable before export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!showOnboarding ? (
            <button
              type="button"
              onClick={onReopenOnboarding}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Guided Tour
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onSelectTab('editor')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#0B1120] text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileEdit className="h-4 w-4" />
            <span>Edit Report Data</span>
          </button>
          <button
            type="button"
            onClick={onOpenPresentation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#0B1120] text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Presentation className="h-4 w-4 text-[#0891B2]" />
            <span>Present Deck</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('preview')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-sm font-medium hover:bg-[#17223B] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="h-4 w-4 text-[#D4FF33]" />
            <span>Open Live Preview</span>
          </button>
        </div>
      </section>

      {/* Onboarding Guided Workflow (Dismissible, Non-Blocking) */}
      {showOnboarding ? (
        <section
          aria-label="Onboarding guide"
          className="rounded-xl border border-slate-200 bg-white p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0891B2]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Quick-Start Studio Workflow</span>
              </div>
              <h2 className="font-display text-xl font-semibold text-[#0B1120] mt-1">
                From Financial Data to Five Executive Deliverables in Three Steps
              </h2>
            </div>
            <button
              type="button"
              onClick={onDismissOnboarding}
              aria-label="Dismiss quick-start guide"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <div className="p-4 rounded-lg bg-[#F8F6F0] border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="font-mono-num text-xs font-semibold text-slate-500">01. Configure</div>
                <h3 className="text-sm font-semibold text-[#0B1120] mt-1">
                  Enter Metrics &amp; Reconcile Totals
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Edit revenue, expenses, monthly series, and segments with Data Quality Guardian
                  reconciliation checks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('editor')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1120] hover:underline cursor-pointer"
              >
                <span>Open Report Editor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[#F8F6F0] border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="font-mono-num text-xs font-semibold text-slate-500">02. Simulate &amp; Tailor</div>
                <h3 className="text-sm font-semibold text-[#0B1120] mt-1">
                  Tailor Audience &amp; Test What-If Scenarios
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Switch between Board, CEO, Investor, Team, and Client editions or run sensitivity
                  models safely separated from actuals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('simulator')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1120] hover:underline cursor-pointer"
              >
                <span>Open What-If Simulator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[#F8F6F0] border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="font-mono-num text-xs font-semibold text-slate-500">03. Inspect &amp; Export</div>
                <h3 className="text-sm font-semibold text-[#0B1120] mt-1">
                  Verify Email Lab &amp; Export Five Formats
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Audit Gmail/Outlook/Apple Mail rendering and generate Email HTML, Plain-Text,
                  Web HTML, A4 PDF, and 2x PNG.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('export')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1120] hover:underline cursor-pointer"
              >
                <span>Go to Export Centre</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Active Report Pulse + Audience Switcher */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {report.branding.logoDataUrl ? (
              <img
                src={report.branding.logoDataUrl}
                alt={report.branding.companyName}
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-lg border border-slate-200 object-contain shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-[#0B1120]">{report.branding.companyName}</span>
                <span aria-hidden="true">&middot;</span>
                <span>{report.reportingPeriod}</span>
                <span aria-hidden="true">&middot;</span>
                <span className="text-[#0891B2] font-semibold">{audience.name}</span>
                {report.isIllustrative ? (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>Illustrative Sample</span>
                  </>
                ) : null}
              </div>
              <h2 className="font-display text-xl font-semibold text-[#0B1120] truncate mt-0.5">
                {report.title}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Audience Edition Quick Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
              {AUDIENCE_EDITION_LIST.map((ed) => {
                const active = audience.id === ed.id;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => onSelectAudience(ed.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#0B1120] text-[#D4FF33]'
                        : 'text-slate-600 hover:text-[#0B1120]'
                    }`}
                  >
                    {ed.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Quick Theme Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
              {(['midnight-luxe', 'editorial-ivory', 'modern-signal'] as const).map((tid) => {
                const t = REPORT_THEMES[tid];
                const active = report.theme === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => onSelectTheme(tid)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#0B1120] shadow-xs'
                        : 'text-slate-600 hover:text-[#0B1120]'
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5 KPI Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5">
            <div className="text-xs font-medium text-slate-500">Period Revenue</div>
            <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1.5">
              {formatCurrency(report.currentPeriod.revenue, cur)}
            </div>
            <div className="font-mono-num text-xs text-slate-600 mt-1">
              {formatPercent(metrics.revenueGrowthPct, { signed: true })} vs {report.previousPeriodLabel}
            </div>
          </div>
          <div className="p-5">
            <div className="text-xs font-medium text-slate-500">Operating Expenses</div>
            <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1.5">
              {formatCurrency(report.currentPeriod.expenses, cur)}
            </div>
            <div className="font-mono-num text-xs text-slate-600 mt-1">
              {formatPercent(metrics.expenseGrowthPct, { signed: true })} vs prior
            </div>
          </div>
          <div className="p-5">
            <div className="text-xs font-medium text-slate-500">Net Profit</div>
            <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1.5">
              {formatCurrency(metrics.netProfit, cur)}
            </div>
            <div className="font-mono-num text-xs text-slate-600 mt-1">
              {formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior
            </div>
          </div>
          <div className="p-5">
            <div className="text-xs font-medium text-slate-500">Profit Margin</div>
            <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1.5">
              {formatPercent(metrics.profitMarginPct)}
            </div>
            <div className="font-mono-num text-xs text-slate-600 mt-1">
              {metrics.marginDeltaPts >= 0 ? '+' : ''}
              {metrics.marginDeltaPts.toFixed(1)} pts shift
            </div>
          </div>
          <div className="p-5 col-span-2 md:col-span-1">
            <div className="text-xs font-medium text-slate-500">Business Health</div>
            <div className="text-base font-semibold text-[#0B1120] mt-1.5">{metrics.healthStatus}</div>
            <div className="font-mono-num text-xs text-slate-600 mt-1">
              {formatNumber(report.currentPeriod.customerCount)} customers · {theme.name}
            </div>
          </div>
        </div>
      </section>

      {/* Executive Insights & Trend Analysis */}
      <section aria-label="Executive Insights" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#0B1120]">
              Executive Insights
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic rules &amp; Trend Analysis benchmarking current-period metrics against a rolling 3-month average.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('preview')}
            className="text-xs font-semibold text-[#0891B2] hover:underline cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Inspect in 5-Format Report &rarr;
          </button>
        </div>

        {/* Trend Analysis Module */}
        <TrendAnalysisPanel
          trend={trendAnalysis}
          currency={cur}
          redactInternalExpenses={audience.redactInternalExpenses}
          onEditMonthlySeries={() => onSelectTab('editor')}
        />

        {/* Rule-Based Financial Observations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {insights.slice(0, 6).map((ins) => {
            const sevColor =
              ins.severity === 'positive'
                ? 'text-emerald-700'
                : ins.severity === 'critical'
                  ? 'text-rose-700'
                  : ins.severity === 'warning'
                    ? 'text-amber-700'
                    : 'text-slate-600';
            return (
              <div
                key={ins.id}
                className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono-num">
                    <span className={`font-semibold uppercase tracking-wider ${sevColor}`}>
                      {ins.category}
                    </span>
                    <span className="text-slate-500">{ins.supportingMetric}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#0B1120] mt-1.5">
                    {ins.headline}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ins.explanation}</p>
                </div>
                {ins.ruleTriggered ? (
                  <div className="pt-2.5 border-t border-slate-100 font-mono-num text-[11px] text-slate-500 leading-snug">
                    <div>Rule: {ins.ruleTriggered}</div>
                    {ins.formulaTrace ? <div className="mt-0.5">Calc: {ins.formulaTrace}</div> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Signature Innovation Workbench */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => onSelectTab('simulator')}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0B1120] transition-colors cursor-pointer"
        >
          <Sliders className="h-4 w-4 text-[#0891B2]" />
          <div className="text-sm font-semibold text-[#0B1120] mt-3">What-If Simulator</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Model revenue, OpEx, and ARPU sensitivities with explicit non-actual guardrails.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('email-lab')}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0B1120] transition-colors cursor-pointer"
        >
          <MailCheck className="h-4 w-4 text-[#0891B2]" />
          <div className="text-sm font-semibold text-[#0B1120] mt-3">Email Compatibility Lab</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Emulate Gmail, Outlook, Apple Mail &amp; mobile plus 102 KB clipping &amp; WCAG audit.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('versions')}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0B1120] transition-colors cursor-pointer"
        >
          <GitCompare className="h-4 w-4 text-[#0891B2]" />
          <div className="text-sm font-semibold text-[#0B1120] mt-3">Version Comparison</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Diff your active draft against baseline presets or saved snapshots line by line.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('editor')}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0B1120] transition-colors cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <div className="text-sm font-semibold text-[#0B1120] mt-3">Data Quality Guardian</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            <span className="font-mono-num font-semibold">{passChecks}/{qualityChecks.length}</span>{' '}
            reconciliation &amp; security checks verified before export.
          </p>
        </button>
      </section>

      {/* Five Formats Matrix */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#0B1120]">
              Five Synchronized Output Formats
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every output renders from the same validated data tree via @unlayer/react-elements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('export')}
            className="text-xs font-semibold text-[#0891B2] hover:underline cursor-pointer whitespace-nowrap"
          >
            Launch Export Centre &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {formatOutputs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelectTab('preview')}
                className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0B1120] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-[#0891B2]" />
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="text-sm font-semibold text-[#0B1120] mt-3">{item.name}</div>
                <div className="font-mono-num text-[11px] text-slate-500 mt-0.5">{item.root}</div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sample Presets + Recent Reports */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                Illustrative Industry Presets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Load any of five internally consistent business datasets to test themes and exports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('templates')}
              className="text-xs font-semibold text-[#0891B2] hover:underline cursor-pointer"
            >
              View Gallery
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {SAMPLE_REPORTS.map((sample) => {
              const isCurrent = report.sampleKey === sample.key;
              return (
                <div
                  key={sample.key}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-[#0B1120]">{sample.industry}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>{sample.report.branding.companyName}</span>
                    </div>
                    <div className="font-mono-num text-xs text-slate-600 mt-0.5">
                      {sample.headlineMetric}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLoadSample(sample.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isCurrent
                        ? 'bg-[#0B1120] text-[#D4FF33]'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isCurrent ? 'Active Preset' : 'Load Sample'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-[#0B1120]">Recent Snapshots</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Browser-persisted executive report drafts.
          </p>
          {recentReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-xs text-slate-500 leading-relaxed">
              No saved snapshots in browser storage yet. Use the Save button in the sidebar or
              Report Editor to bookmark revisions.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentReports.slice(0, 5).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onLoadRecent(entry)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#0B1120] transition-colors cursor-pointer"
                >
                  <div className="text-sm font-semibold text-[#0B1120] truncate">
                    {entry.companyName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {entry.reportingPeriod} &middot; {REPORT_THEMES[entry.theme].name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
