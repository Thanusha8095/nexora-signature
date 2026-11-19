import { useMemo, useState } from 'react';
import { ArrowLeftRight, GitCompare } from 'lucide-react';
import { formatCurrency } from '../core/calculations.ts';
import { SAMPLE_REPORTS } from '../core/samples.ts';
import type { ReportInputData } from '../core/types.ts';
import { compareReportVersions } from '../core/versionDiff.ts';
import type { SavedReportEntry } from '../services/storage.ts';

interface VersionCompareViewProps {
  report: ReportInputData;
  recentReports: SavedReportEntry[];
}

export function VersionCompareView({ report, recentReports }: VersionCompareViewProps) {
  const defaultBaselineKey = report.sampleKey ? `sample:${report.sampleKey}` : `sample:${SAMPLE_REPORTS[0].key}`;
  const [baselineSource, setBaselineSource] = useState<string>(defaultBaselineKey);
  const [targetSource, setTargetSource] = useState<string>('active');

  const sourceOptions = useMemo(() => {
    const list: { key: string; label: string; data: ReportInputData }[] = [
      {
        key: 'active',
        label: `Active Workspace Draft — ${report.branding.companyName} (${report.reportingPeriod})`,
        data: report,
      },
      ...recentReports.map((entry) => ({
        key: `saved:${entry.id}`,
        label: `Saved Snapshot — ${entry.companyName} (${entry.reportingPeriod})`,
        data: entry.report,
      })),
      ...SAMPLE_REPORTS.map((s) => ({
        key: `sample:${s.key}`,
        label: `Sample Baseline (${s.industry}) — ${s.report.branding.companyName}`,
        data: s.report,
      })),
    ];
    return list;
  }, [report, recentReports]);

  const baselineEntry =
    sourceOptions.find((o) => o.key === baselineSource) ?? sourceOptions[sourceOptions.length - 1];
  const targetEntry = sourceOptions.find((o) => o.key === targetSource) ?? sourceOptions[0];

  const diff = useMemo(
    () =>
      compareReportVersions(baselineEntry.data, targetEntry.data, {
        baselineLabel: baselineEntry.label,
        targetLabel: targetEntry.label,
      }),
    [baselineEntry, targetEntry]
  );

  const handleSwap = () => {
    setBaselineSource(targetSource);
    setTargetSource(baselineSource);
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#0891B2]">
          Revision &amp; Baseline Audit
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120] mt-1">
          Report Version Comparison
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Compare your active draft against saved snapshots or baseline datasets to track KPI
          movements, category additions/removals, and narrative changes before publishing.
        </p>
      </div>

      {/* Selector Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 grid grid-cols-1 lg:grid-cols-11 gap-3 items-end">
        <div className="lg:col-span-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Baseline Report (Version A)
          </label>
          <select
            value={baselineSource}
            onChange={(e) => setBaselineSource(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#0B1120]"
          >
            {sourceOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1 flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Baseline and Target"
            aria-label="Swap baseline and target versions"
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        <div className="lg:col-span-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Target Report (Version B)
          </label>
          <select
            value={targetSource}
            onChange={(e) => setTargetSource(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#0B1120]"
          >
            {sourceOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Change Summary Strip */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs">
          <GitCompare className="h-4 w-4 text-[#0891B2]" />
          <span className="font-semibold text-[#0B1120]">
            {diff.totalSignificantChanges === 0
              ? 'Versions are identical across all financial figures, categories, and narrative.'
              : `Detected ${diff.totalSignificantChanges} significant change(s) between Version A and Version B.`}
          </span>
        </div>
        <div className="font-mono-num text-xs text-slate-600">
          Narrative: {diff.narrativeChanged ? 'Modified' : 'Unchanged'} &middot; Priorities:{' '}
          {diff.prioritiesChanged ? 'Modified' : 'Unchanged'}
        </div>
      </div>

      {/* KPI Diff Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-display text-lg font-semibold text-[#0B1120]">
            Key Financial Metric Comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className="py-2.5 px-5 font-semibold">Metric</th>
                <th className="py-2.5 px-4 font-semibold text-right">Baseline (A)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Target (B)</th>
                <th className="py-2.5 px-5 font-semibold text-right">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {diff.kpiDiffs.map((row) => (
                <tr key={row.metric}>
                  <td className="py-3 px-5 font-semibold text-[#0B1120]">{row.metric}</td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                    {row.baselineValue}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                    {row.targetValue}
                  </td>
                  <td
                    className={`py-3 px-5 text-right font-mono-num font-semibold ${
                      row.direction === 'up'
                        ? 'text-emerald-700'
                        : row.direction === 'down'
                          ? 'text-rose-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {row.deltaFormatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category & Segment Changes + Metadata Diffs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-display text-lg font-semibold text-[#0B1120]">
              Category &amp; Segment Line-Item Delta
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="py-2.5 px-5 font-semibold">Line Item</th>
                  <th className="py-2.5 px-3 font-semibold">Group</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Baseline</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Target</th>
                  <th className="py-2.5 px-5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {diff.categoryDiffs.map((cat, idx) => (
                  <tr key={`${cat.kind}-${cat.name}-${idx}`}>
                    <td className="py-2.5 px-5 font-medium text-[#0B1120]">{cat.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{cat.kind}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-slate-600">
                      {formatCurrency(cat.baselineAmount, baselineEntry.data.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-[#0B1120]">
                      {formatCurrency(cat.targetAmount, targetEntry.data.currency)}
                    </td>
                    <td
                      className={`py-2.5 px-5 text-right font-semibold ${
                        cat.status === 'Added'
                          ? 'text-emerald-700'
                          : cat.status === 'Removed'
                            ? 'text-rose-700'
                            : cat.status === 'Modified'
                              ? 'text-amber-700'
                              : 'text-slate-400'
                      }`}
                    >
                      {cat.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-display text-lg font-semibold text-[#0B1120]">
              Metadata &amp; Edition Diff
            </h2>
          </div>
          {diff.metadataDiffs.length === 0 ? (
            <div className="p-5 text-xs text-slate-500">
              No changes detected across company name, period, currency, theme, or audience edition.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {diff.metadataDiffs.map((m) => (
                <div key={m.field} className="p-4 text-xs">
                  <div className="font-semibold text-[#0B1120]">{m.field}</div>
                  <div className="text-slate-500 mt-1">
                    <span className="line-through">{m.before}</span> &rarr;{' '}
                    <span className="font-semibold text-[#0891B2]">{m.after}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
