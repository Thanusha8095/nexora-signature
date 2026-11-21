import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { computeReportMetrics, formatCurrency } from '../core/calculations.ts';
import type { DataQualityCheck, ReportInputData, ValidationResult } from '../core/types.ts';

interface DataQualityPanelProps {
  report: ReportInputData;
  validation: ValidationResult;
  compact?: boolean;
  onJumpToSection?: (section: NonNullable<DataQualityCheck['sectionHint']>) => void;
  onReconcile?: (action: 'sync-rev-from-cats' | 'sync-rev-from-monthly' | 'sync-exp-from-cats') => void;
}

export function DataQualityPanel({
  report,
  validation,
  compact = false,
  onJumpToSection,
  onReconcile,
}: DataQualityPanelProps) {
  const checks = validation.checks ?? [];
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const metrics = computeReportMetrics(report);

  const hasRevCatMismatch = checks.some(
    (c) => c.id === 'rev-cat-reconcile' && c.status === 'warn'
  );
  const hasMonthlyMismatch = checks.some(
    (c) => c.id === 'monthly-reconcile' && c.status === 'warn'
  );
  const hasExpCatMismatch = checks.some(
    (c) => c.id === 'exp-cat-reconcile' && c.status === 'warn'
  );

  return (
    <section
      aria-label="Data Quality Guardian"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            className={`h-5 w-5 shrink-0 ${
              failCount > 0 ? 'text-rose-600' : warnCount > 0 ? 'text-amber-600' : 'text-emerald-700'
            }`}
          />
          <div>
            <h2 className="font-display text-base font-semibold text-[#0B1120]">
              Data Quality Guardian
            </h2>
            <p className="text-xs text-slate-500">
              Pre-export financial reconciliation, period integrity, and brand security audit
            </p>
          </div>
        </div>
        <div className="font-mono-num text-xs text-slate-600">
          <span className="font-semibold text-emerald-700">{passCount} Pass</span>
          <span aria-hidden="true"> &middot; </span>
          <span className={warnCount > 0 ? 'font-semibold text-amber-700' : ''}>
            {warnCount} Notice
          </span>
          <span aria-hidden="true"> &middot; </span>
          <span className={failCount > 0 ? 'font-semibold text-rose-700' : ''}>
            {failCount} Blocking
          </span>
        </div>
      </div>

      {onReconcile && (hasRevCatMismatch || hasMonthlyMismatch || hasExpCatMismatch) ? (
        <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-amber-950">
            Reconciliation quick actions available for mismatched sub-totals:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {hasRevCatMismatch ? (
              <button
                type="button"
                onClick={() => onReconcile('sync-rev-from-cats')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-300 bg-white text-amber-950 font-medium hover:bg-amber-100 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>
                  Set Period Revenue = {formatCurrency(metrics.revenueCategoryTotal, report.currency)}
                </span>
              </button>
            ) : null}
            {hasMonthlyMismatch ? (
              <button
                type="button"
                onClick={() => onReconcile('sync-rev-from-monthly')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-300 bg-white text-amber-950 font-medium hover:bg-amber-100 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync Revenue from Monthly Sum</span>
              </button>
            ) : null}
            {hasExpCatMismatch ? (
              <button
                type="button"
                onClick={() => onReconcile('sync-exp-from-cats')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-300 bg-white text-amber-950 font-medium hover:bg-amber-100 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>
                  Set Period Expenses = {formatCurrency(metrics.expenseCategoryTotal, report.currency)}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={`grid grid-cols-1 ${
          compact ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'
        } divide-y md:divide-y-0 md:gap-px bg-slate-200`}
      >
        {checks.map((chk) => {
          const Icon =
            chk.status === 'fail'
              ? XCircle
              : chk.status === 'warn'
                ? AlertTriangle
                : CheckCircle2;
          const iconColor =
            chk.status === 'fail'
              ? 'text-rose-600'
              : chk.status === 'warn'
                ? 'text-amber-600'
                : 'text-emerald-700';
          return (
            <div
              key={chk.id}
              className="bg-white p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#0B1120]">{chk.label}</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{chk.detail}</p>
                </div>
              </div>
              {onJumpToSection && chk.sectionHint && chk.status !== 'pass' ? (
                <button
                  type="button"
                  onClick={() => onJumpToSection(chk.sectionHint!)}
                  className="text-[11px] font-semibold text-[#0B6179] hover:underline shrink-0 cursor-pointer"
                >
                  Inspect
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
