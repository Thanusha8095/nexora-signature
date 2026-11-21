import { useState } from 'react';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent } from '../core/calculations.ts';
import type { CurrencyCode, MomentumSignal, TrendAnalysisResult } from '../core/types.ts';

interface TrendAnalysisPanelProps {
  trend: TrendAnalysisResult;
  currency: CurrencyCode;
  redactInternalExpenses: boolean;
  onEditMonthlySeries: () => void;
}

type ComparisonBasis = 'latest-month' | 'period-pace';

function SignalBadge({ signal, metricId }: { signal: MomentumSignal; metricId?: string }) {
  const isExpense = metricId === 'expenses';
  const colorClass =
    signal === 'Accelerating'
      ? isExpense
        ? 'text-amber-700'
        : 'text-emerald-700'
      : signal === 'Decelerating'
        ? isExpense
          ? 'text-emerald-700'
          : 'text-amber-700'
        : 'text-slate-600';

  const Icon =
    signal === 'Accelerating'
      ? TrendingUp
      : signal === 'Decelerating'
        ? TrendingDown
        : Minus;

  return (
    <span className={`inline-flex items-center justify-end gap-1.5 font-mono-num text-xs font-semibold ${colorClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{signal}</span>
    </span>
  );
}

export function TrendAnalysisPanel({
  trend,
  currency,
  redactInternalExpenses,
  onEditMonthlySeries,
}: TrendAnalysisPanelProps) {
  const [basis, setBasis] = useState<ComparisonBasis>('latest-month');

  if (!trend.hasSufficientData) {
    return (
      <div
        data-testid="trend-analysis-module"
        className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trend Analysis &middot; Rolling 3-Month Benchmark
          </div>
          <div className="text-sm font-semibold text-[#0B1120] mt-1">{trend.summaryHeadline}</div>
          <p className="text-xs text-slate-600 mt-1">{trend.summaryNarrative}</p>
        </div>
        <button
          type="button"
          onClick={onEditMonthlySeries}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Add Monthly Data</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#D4FF33]" />
        </button>
      </div>
    );
  }

  const windowTag = trend.windowMonthsCount < 3 ? `${trend.windowMonthsCount}M` : '3M';
  const maxSeriesRev = Math.max(
    ...trend.rollingSeries.flatMap((pt) => [pt.revenue, pt.rolling3MoRevenueAvg]),
    1
  );

  return (
    <div
      data-testid="trend-analysis-module"
      className="rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      {/* Module Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[#0B6179]">
              Trend Analysis
            </span>
            <span aria-hidden="true">&middot;</span>
            <span className="font-mono-num">
              Rolling {windowTag} Window ({trend.windowPeriodLabel})
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-[#0B1120] mt-1">
            {trend.summaryHeadline}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{trend.summaryNarrative}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Basis Toggle */}
          <div
            role="group"
            aria-label="Trend comparison baseline"
            className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70"
          >
            <button
              type="button"
              onClick={() => setBasis('latest-month')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                basis === 'latest-month'
                  ? 'bg-white text-[#0B1120] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1120]'
              }`}
            >
              Latest Month ({trend.latestMonthLabel})
            </button>
            <button
              type="button"
              onClick={() => setBasis('period-pace')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                basis === 'period-pace'
                  ? 'bg-white text-[#0B1120] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1120]'
              }`}
            >
              Period Monthly Pace
            </button>
          </div>

          <div className="pl-2 border-l border-slate-200 text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Overall Signal
            </div>
            <div className="mt-0.5">
              <SignalBadge signal={trend.overallSignal} />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500 font-semibold">
              <th className="py-2.5 px-5">Performance Metric</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">
                {basis === 'latest-month' ? trend.latestMonthLabel : 'Period Monthly Pace'}
              </th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">
                Rolling {windowTag} Avg
              </th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Delta vs {windowTag} Avg</th>
              <th className="py-2.5 px-5 text-right whitespace-nowrap">Momentum Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {trend.metrics.map((tm) => {
              const currentStr =
                basis === 'latest-month' ? tm.currentMonthFormatted : tm.periodPaceFormatted;
              const deltaStr =
                basis === 'latest-month' ? tm.deltaFormatted : tm.periodPaceDeltaFormatted;
              const activeSignal = basis === 'latest-month' ? tm.signal : tm.periodPaceSignal;
              const traceStr =
                basis === 'latest-month' ? tm.formulaTrace : tm.periodPaceFormulaTrace;

              const isExpense = tm.id === 'expenses';
              const deltaColor =
                activeSignal === 'Accelerating'
                  ? isExpense
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                  : activeSignal === 'Decelerating'
                    ? isExpense
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                    : 'text-slate-700';

              return (
                <tr key={tm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-5">
                    <div className="font-semibold text-[#0B1120]">{tm.label}</div>
                    <div className="font-mono-num text-[11px] text-slate-500 mt-0.5">
                      {traceStr}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120] whitespace-nowrap">
                    {currentStr}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-600 whitespace-nowrap">
                    {tm.rolling3MoAvgFormatted}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono-num font-semibold whitespace-nowrap ${deltaColor}`}
                  >
                    {deltaStr}
                  </td>
                  <td className="py-3 px-5 text-right whitespace-nowrap">
                    <SignalBadge signal={activeSignal} metricId={tm.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Month-by-Month Rolling Average Trajectory Strip */}
      <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-[#0B1120]">
            Monthly Revenue Run-Rate vs. Trailing {windowTag} Moving Average
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0B1120] inline-block" />
              <span>Actual Month</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0891B2] inline-block" />
              <span>Rolling {windowTag} Avg</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {trend.rollingSeries.map((pt) => {
            const actualWidth =
              pt.revenue > 0 ? Math.max(4, Math.round((pt.revenue / maxSeriesRev) * 100)) : 0;
            const rollingWidth =
              pt.rolling3MoRevenueAvg > 0
                ? Math.max(4, Math.round((pt.rolling3MoRevenueAvg / maxSeriesRev) * 100))
                : 0;
            const varianceStr = formatPercent(pt.revenueVsRollingPct, { signed: true });
            const isAbove = (pt.revenueVsRollingPct ?? 0) >= 0;

            return (
              <div
                key={pt.month}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-mono-num font-semibold text-[#0B1120]">{pt.month}</span>
                  <span
                    className={`font-mono-num text-[11px] font-semibold ${
                      isAbove ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {varianceStr} vs rolling
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono-num text-slate-600 mb-0.5">
                      <span>Actual</span>
                      <span className="text-[#0B1120] font-semibold">
                        {formatCurrency(pt.revenue, currency, { compact: true })}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-[#0B1120]"
                        style={{ width: `${actualWidth}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-mono-num text-slate-500 mb-0.5">
                      <span>Rolling {windowTag}</span>
                      <span>
                        {formatCurrency(pt.rolling3MoRevenueAvg, currency, { compact: true })}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-[#0891B2]"
                        style={{ width: `${rollingWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Note & Navigation */}
      <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          {redactInternalExpenses
            ? 'Client & Partner Edition active: internal cost, net profit, and margin momentum rows are redacted.'
            : trend.windowMonthsCount < 3
              ? `Using ${trend.windowMonthsCount} available months; add at least 3 monthly rows for a full 3-month rolling average.`
              : `Benchmarked across ${trend.totalMonthsCount} reported monthly intervals using trailing 3-month averages.`}
        </div>
        <button
          type="button"
          onClick={onEditMonthlySeries}
          className="inline-flex items-center gap-1 font-semibold text-[#0B6179] hover:underline cursor-pointer whitespace-nowrap"
        >
          <span>Adjust Monthly Series</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
