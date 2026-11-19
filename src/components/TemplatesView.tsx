import { useMemo, useState } from 'react';
import { Check, Eye, Presentation, Sparkles } from 'lucide-react';
import { AUDIENCE_EDITION_LIST } from '../core/audiences.ts';
import {
  computeReportMetrics,
  formatCurrency,
  formatPercent,
} from '../core/calculations.ts';
import { computeTrendAnalysis } from '../core/intelligence.ts';
import { SAMPLE_REPORTS } from '../core/samples.ts';
import { REPORT_THEMES, THEME_LIST } from '../core/themes.ts';
import type { AudienceEditionId, ReportInputData, ReportThemeId } from '../core/types.ts';

interface TemplatesViewProps {
  report: ReportInputData;
  onLoadSample: (sampleKey: string) => void;
  onSelectTheme: (theme: ReportThemeId) => void;
  onSelectAudience: (edition: AudienceEditionId) => void;
  onOpenPreview: () => void;
  onOpenPresentation: () => void;
}

const RECOMMENDED_PAIRINGS: {
  id: string;
  title: string;
  themeId: ReportThemeId;
  audienceId: AudienceEditionId;
  rationale: string;
}[] = [
  {
    id: 'investor-vault',
    title: 'Series Growth & Capital Packet',
    themeId: 'midnight-luxe',
    audienceId: 'investor',
    rationale: 'Architectural Dark Vault paired with top-line unit economics and forward priorities.',
  },
  {
    id: 'shareholder-letter',
    title: 'Annual Board & Shareholder Letter',
    themeId: 'editorial-ivory',
    audienceId: 'board',
    rationale: 'Broadsheet serif authority tailored for fiduciary governance and P&L variance.',
  },
  {
    id: 'ceo-telemetry',
    title: 'Quarterly Operating Review',
    themeId: 'modern-signal',
    audienceId: 'ceo',
    rationale: 'Swiss Precision grid prioritizing operating leverage, net profit, and rolling momentum.',
  },
  {
    id: 'partner-qbr',
    title: 'External Client Value Review',
    themeId: 'editorial-ivory',
    audienceId: 'client',
    rationale: 'Redacts internal OpEx/margins automatically while highlighting customer value & reach.',
  },
];

export function TemplatesView({
  report,
  onLoadSample,
  onSelectTheme,
  onSelectAudience,
  onOpenPreview,
  onOpenPresentation,
}: TemplatesViewProps) {
  const currentEdition = report.audienceEdition ?? 'board';
  const [industryFilter, setIndustryFilter] = useState<'all' | string>('all');

  const enrichedSamples = useMemo(
    () =>
      SAMPLE_REPORTS.map((sample) => {
        const metrics = computeReportMetrics(sample.report);
        const trend = computeTrendAnalysis(sample.report, metrics);
        return { sample, metrics, trend };
      }),
    []
  );

  const filteredSamples = useMemo(() => {
    if (industryFilter === 'all') return enrichedSamples;
    return enrichedSamples.filter((s) => s.sample.report.theme === industryFilter);
  }, [enrichedSamples, industryFilter]);

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120]">
            Premium Template, Theme &amp; Audience Gallery
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Combine three executive design systems, five stakeholder audience editions, and five
            internally consistent sample businesses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={onOpenPresentation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#0B1120] text-xs font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <Presentation className="h-3.5 w-3.5 text-[#0891B2]" />
            <span>Presentation Mode</span>
          </button>
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] cursor-pointer whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5 text-[#D4FF33]" />
            <span>Preview Active Report</span>
          </button>
        </div>
      </div>

      {/* Recommended Theme x Audience Pairings */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-[#0891B2]" />
          <h2 className="font-display text-xl font-semibold text-[#0B1120]">
            Curated Executive Combinations
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          One-click pairings combining visual theme architecture with the matching stakeholder edition.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RECOMMENDED_PAIRINGS.map((pair) => {
            const t = REPORT_THEMES[pair.themeId];
            const active = report.theme === pair.themeId && currentEdition === pair.audienceId;
            return (
              <div
                key={pair.id}
                className={`rounded-xl border bg-white p-4 flex flex-col justify-between ${
                  active ? 'border-[#0B1120] ring-1 ring-[#0B1120]' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono-num text-[11px]">
                    <span className="font-semibold text-[#0891B2]">{t.name}</span>
                    <span className="text-slate-500 uppercase">{pair.audienceId}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0B1120] mt-1.5">{pair.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pair.rationale}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTheme(pair.themeId);
                    onSelectAudience(pair.audienceId);
                  }}
                  className={`mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0B1120] text-[#D4FF33]'
                      : 'border border-slate-300 bg-white text-[#0B1120] hover:bg-slate-50'
                  }`}
                >
                  {active ? 'Active Combination' : 'Apply Pairing'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Five Audience Transformation Editions */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[#0B1120] mb-1">
          Five Stakeholder Audience Editions
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Transform layout hierarchy, hero KPI emphasis, and cost-structure visibility from the
          exact same underlying data model.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {AUDIENCE_EDITION_LIST.map((ed) => {
            const active = currentEdition === ed.id;
            return (
              <div
                key={ed.id}
                className={`rounded-xl border bg-white p-4 flex flex-col justify-between ${
                  active ? 'border-[#0B1120] ring-1 ring-[#0B1120]' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0891B2]">{ed.shortLabel}</span>
                    {active ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : null}
                  </div>
                  <h3 className="text-sm font-semibold text-[#0B1120] mt-1">{ed.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-1">{ed.targetReader}</div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {ed.focusDescription}
                  </p>
                  <div className="font-mono-num text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    Hero: {ed.heroMetric} &middot; {ed.sectionOrder.length} blocks
                    {ed.redactInternalExpenses ? ' · Redacted' : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAudience(ed.id)}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0B1120] text-[#D4FF33]'
                      : 'border border-slate-300 bg-white text-[#0B1120] hover:bg-slate-50'
                  }`}
                >
                  {active ? 'Active Edition' : `Switch to ${ed.shortLabel}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Three Design Systems */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[#0B1120] mb-1">
          Three Executive Design Systems
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Each theme transforms typography, masthead architecture, surface hierarchy, and chart
          encoding across all five outputs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEME_LIST.map((theme) => {
            const active = report.theme === theme.id;
            return (
              <div
                key={theme.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between bg-white ${
                  active ? 'border-[#0B1120] ring-1 ring-[#0B1120]' : 'border-slate-200'
                }`}
              >
                <div>
                  <div
                    className="p-5 border-b"
                    style={{
                      backgroundColor: theme.colors.canvas,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className="font-semibold uppercase tracking-wider"
                        style={{ color: theme.colors.accent }}
                      >
                        {theme.layoutStyle === 'editorial-broadsheet'
                          ? 'Broadsheet'
                          : theme.layoutStyle === 'swiss-precision'
                            ? 'Swiss Grid'
                            : 'Architectural Vault'}
                      </span>
                      <span className="font-mono-num" style={{ color: theme.colors.textMuted }}>
                        {report.reportingPeriod}
                      </span>
                    </div>
                    <div
                      className="text-lg font-semibold mt-2 leading-snug"
                      style={{ fontFamily: theme.typography.headingFont }}
                    >
                      {theme.name}
                    </div>
                    <div
                      className="font-mono-num text-xl font-bold mt-2"
                      style={{ color: theme.colors.accent }}
                    >
                      {formatCurrency(report.currentPeriod.revenue, report.currency)}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-xs font-semibold text-[#0B1120]">{theme.subtitle}</div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0B1120] text-[#D4FF33]'
                        : 'border border-slate-300 bg-white text-[#0B1120] hover:bg-slate-50'
                    }`}
                  >
                    {active ? 'Currently Active Theme' : `Apply ${theme.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Five Sample Reports */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#0B1120] mb-1">
              Five Illustrative Sample Businesses
            </h2>
            <p className="text-xs text-slate-500">
              All sample figures are clearly marked illustrative and reconcile across monthly series,
              categories, and operating segments.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 self-start">
            {[
              { id: 'all', label: 'All (5)' },
              { id: 'midnight-luxe', label: 'Midnight Luxe' },
              { id: 'editorial-ivory', label: 'Editorial Ivory' },
              { id: 'modern-signal', label: 'Modern Signal' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setIndustryFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
                  industryFilter === tab.id
                    ? 'bg-white text-[#0B1120] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1120]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSamples.map(({ sample, metrics, trend }) => {
            const active = report.sampleKey === sample.key;
            const themeMeta = REPORT_THEMES[sample.report.theme];
            return (
              <div
                key={sample.key}
                className={`rounded-xl border bg-white p-5 flex flex-col justify-between ${
                  active ? 'border-[#0B1120] ring-1 ring-[#0B1120]' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={sample.report.branding.logoDataUrl}
                        alt={sample.report.branding.companyName}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#0891B2]">
                          {sample.industry}
                        </div>
                        <h3 className="text-sm font-semibold text-[#0B1120] truncate">
                          {sample.report.branding.companyName}
                        </h3>
                      </div>
                    </div>
                    {active ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : null}
                  </div>

                  {/* Live Calculated KPI Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-lg bg-[#F8F6F0] border border-slate-200/80 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Revenue</div>
                      <div className="font-mono-num font-bold text-[#0B1120]">
                        {formatCurrency(sample.report.currentPeriod.revenue, sample.report.currency, {
                          compact: true,
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Net Margin</div>
                      <div className="font-mono-num font-bold text-[#0B1120]">
                        {formatPercent(metrics.profitMarginPct)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Rolling 3M</div>
                      <div
                        className={`font-mono-num font-bold ${
                          trend.overallSignal === 'Accelerating'
                            ? 'text-emerald-700'
                            : trend.overallSignal === 'Decelerating'
                              ? 'text-amber-700'
                              : 'text-slate-700'
                        }`}
                      >
                        {trend.overallSignal}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{sample.summary}</p>
                  <div className="font-mono-num text-[11px] text-slate-500 mt-3">
                    Illustrative · {sample.report.reportingPeriod} · {themeMeta.name}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadSample(sample.key)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0B1120] text-[#D4FF33]'
                        : 'border border-slate-300 bg-white text-[#0B1120] hover:bg-slate-50'
                    }`}
                  >
                    {active ? 'Active Preset' : 'Load Sample'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSample(sample.key);
                      onOpenPreview();
                    }}
                    title="Load & Inspect in 5-Format Preview"
                    className="py-2 px-3 rounded-lg border border-slate-300 bg-white text-[#0B1120] text-xs font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                  >
                    Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
