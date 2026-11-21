import { useState } from 'react';
import {
  BookmarkPlus,
  Eye,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AUDIENCE_EDITION_LIST } from '../core/audiences.ts';
import {
  computeReportMetrics,
  formatCurrency,
  formatPercent,
  SUPPORTED_CURRENCIES,
} from '../core/calculations.ts';
import { containsConfidentialFinancialReference, sanitizeReportForAudience } from '../core/redaction.ts';
import { applyThemePresetToReport, THEME_LIST } from '../core/themes.ts';
import type {
  AudienceEditionId,
  CurrencyCode,
  ReportInputData,
  StrategicPriority,
  ValidationResult,
} from '../core/types.ts';
import type { AutoSaveState } from '../hooks/useAutoSaveReport.ts';
import { DataQualityPanel } from './DataQualityPanel.tsx';

interface ReportEditorViewProps {
  report: ReportInputData;
  validation: ValidationResult;
  autoSave?: AutoSaveState;
  onChange: (next: ReportInputData) => void;
  onReset: () => void;
  onSaveSnapshot: () => void;
  onOpenPreview: () => void;
  onOpenBranding?: () => void;
}

type EditorSubTab = 'general' | 'financials' | 'categories' | 'narrative';

export function ReportEditorView({
  report,
  validation,
  autoSave,
  onChange,
  onReset,
  onSaveSnapshot,
  onOpenPreview,
  onOpenBranding,
}: ReportEditorViewProps) {
  const [subTab, setSubTab] = useState<EditorSubTab>('general');
  const metrics = computeReportMetrics(report);
  const cur = report.currency;

  const handleReconcile = (
    action: 'sync-rev-from-cats' | 'sync-rev-from-monthly' | 'sync-exp-from-cats'
  ) => {
    if (action === 'sync-rev-from-cats') {
      updateField('currentPeriod', {
        ...report.currentPeriod,
        revenue: metrics.revenueCategoryTotal,
      });
    } else if (action === 'sync-rev-from-monthly') {
      const sum = report.monthlySeries.reduce((s, m) => s + (Number(m.revenue) || 0), 0);
      updateField('currentPeriod', {
        ...report.currentPeriod,
        revenue: sum,
      });
    } else if (action === 'sync-exp-from-cats') {
      updateField('currentPeriod', {
        ...report.currentPeriod,
        expenses: metrics.expenseCategoryTotal,
      });
    }
  };

  const updateField = <K extends keyof ReportInputData>(key: K, value: ReportInputData[K]) => {
    onChange({
      ...report,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const numInput = (raw: string): number => {
    if (raw.trim() === '') return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const optionalNumInput = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const addMonth = () => {
    const next = [
      ...report.monthlySeries,
      { month: `Month ${report.monthlySeries.length + 1}`, revenue: 0, expenses: 0 },
    ];
    updateField('monthlySeries', next);
  };

  const removeMonth = (idx: number) => {
    if (report.monthlySeries.length <= 2) return;
    updateField(
      'monthlySeries',
      report.monthlySeries.filter((_, i) => i !== idx)
    );
  };

  const addCategory = (kind: 'revenueCategories' | 'expenseCategories') => {
    const list = report[kind];
    updateField(kind, [
      ...list,
      {
        id: `${kind}-${Date.now()}`,
        name: kind === 'revenueCategories' ? 'New Revenue Stream' : 'New Expense Line',
        amount: 0,
      },
    ]);
  };

  const removeCategory = (kind: 'revenueCategories' | 'expenseCategories', idx: number) => {
    if (report[kind].length <= 1) return;
    updateField(
      kind,
      report[kind].filter((_, i) => i !== idx)
    );
  };

  const addSegment = () => {
    updateField('segments', [
      ...report.segments,
      {
        id: `seg-${Date.now()}`,
        name: 'New Business Segment',
        revenue: 0,
        growthPct: 0,
        marginPct: 15,
      },
    ]);
  };

  const removeSegment = (idx: number) => {
    updateField(
      'segments',
      report.segments.filter((_, i) => i !== idx)
    );
  };

  const addPriority = () => {
    const item: StrategicPriority = {
      id: `sp-${Date.now()}`,
      title: 'New Strategic Initiative',
      horizon: 'Near-Term (Q+1)',
      owner: 'Executive Sponsor',
      rationale: 'Aligned with period financial performance.',
      targetImpact: 'Measurable EBITDA or revenue lift',
    };
    updateField('strategicPriorities', [...report.strategicPriorities, item]);
  };

  const removePriority = (idx: number) => {
    if (report.strategicPriorities.length <= 1) return;
    updateField(
      'strategicPriorities',
      report.strategicPriorities.filter((_, i) => i !== idx)
    );
  };

  const fieldError = (key: string) =>
    validation.errors[key] ? (
      <p className="text-xs text-rose-600 mt-1">{validation.errors[key]}</p>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120]">
            Structured Report Editor
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            All metrics, calculations, and charts update synchronously across all five export
            formats.
            {autoSave ? (
              <span className="ml-2 text-slate-500">
                &middot;{' '}
                {autoSave.status === 'saving'
                  ? 'Saving draft...'
                  : autoSave.status === 'error'
                    ? `Auto-save error: ${autoSave.error || 'Storage unavailable'}`
                    : autoSave.lastSavedAt
                      ? `Draft saved ${new Date(autoSave.lastSavedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}`
                      : 'Draft ready'}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Report</span>
          </button>
          <button
            type="button"
            onClick={onSaveSnapshot}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Save Snapshot</span>
          </button>
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-medium hover:bg-[#17223B] cursor-pointer whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5 text-[#D4FF33]" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Data Quality Guardian Panel */}
      <DataQualityPanel
        report={report}
        validation={validation}
        compact
        onReconcile={handleReconcile}
        onJumpToSection={(hint) => {
          if (hint === 'branding' && onOpenBranding) {
            onOpenBranding();
          } else if (hint !== 'branding') {
            setSubTab(hint);
          }
        }}
      />

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
        {(
          [
            { id: 'general', label: '1. Report & Theme' },
            { id: 'financials', label: '2. Financials & Monthly' },
            { id: 'categories', label: '3. Categories & Segments' },
            { id: 'narrative', label: '4. Summary & Priorities' },
          ] as { id: EditorSubTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === tab.id
                ? 'bg-white text-[#0B1120] shadow-xs'
                : 'text-slate-600 hover:text-[#0B1120]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: General & Metadata */}
      {subTab === 'general' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={report.branding.companyName}
                onChange={(e) =>
                  updateField('branding', { ...report.branding, companyName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
              />
              {fieldError('branding.companyName')}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reporting Currency
              </label>
              <select
                value={report.currency}
                onChange={(e) => updateField('currency', e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] bg-white focus:border-[#0891B2] focus:outline-none"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Report Title
              </label>
              <input
                type="text"
                value={report.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
              />
              {fieldError('title')}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Report Subtitle
              </label>
              <input
                type="text"
                value={report.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Reporting Period
              </label>
              <input
                type="text"
                value={report.reportingPeriod}
                onChange={(e) => updateField('reportingPeriod', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
              />
              {fieldError('reportingPeriod')}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Comparison Period Label
              </label>
              <input
                type="text"
                value={report.previousPeriodLabel}
                onChange={(e) => updateField('previousPeriodLabel', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
              />
              {fieldError('previousPeriodLabel')}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Publication Date
              </label>
              <input
                type="text"
                value={report.reportDate}
                onChange={(e) => updateField('reportDate', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stakeholder Audience Edition
              </label>
              <select
                value={report.audienceEdition ?? 'board'}
                onChange={(e) =>
                  updateField('audienceEdition', e.target.value as AudienceEditionId)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] bg-white focus:border-[#0891B2] focus:outline-none"
              >
                {AUDIENCE_EDITION_LIST.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name} — {ed.targetReader}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dataset Classification
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="illustrative-toggle"
                  type="checkbox"
                  checked={report.isIllustrative}
                  onChange={(e) => updateField('isIllustrative', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0B1120]"
                />
                <label htmlFor="illustrative-toggle" className="text-sm text-slate-700">
                  Label figures as illustrative demonstration data
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-2.5">
              Executive Design System
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {THEME_LIST.map((theme) => {
                const selected = report.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onChange(applyThemePresetToReport(report, theme.id))}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#0B1120] bg-slate-50 ring-1 ring-[#0B1120]'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0B1120]">{theme.name}</span>
                      <span
                        className="h-4 w-4 rounded-full border border-black/15"
                        style={{ backgroundColor: theme.colors.canvas }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{theme.subtitle}</div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 2: Financials & Monthly */}
      {subTab === 'financials' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Period */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                Current Period ({report.reportingPeriod})
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Revenue ({cur})
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.currentPeriod.revenue}
                  onChange={(e) =>
                    updateField('currentPeriod', {
                      ...report.currentPeriod,
                      revenue: numInput(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                />
                {fieldError('currentPeriod.revenue')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Expenses ({cur})
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.currentPeriod.expenses}
                  onChange={(e) =>
                    updateField('currentPeriod', {
                      ...report.currentPeriod,
                      expenses: numInput(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                />
                {fieldError('currentPeriod.expenses')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Customer Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.currentPeriod.customerCount}
                  onChange={(e) =>
                    updateField('currentPeriod', {
                      ...report.currentPeriod,
                      customerCount: numInput(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                />
                {fieldError('currentPeriod.customerCount')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Retention Rate % <span className="font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    step="0.1"
                    placeholder="e.g. 104"
                    value={report.currentPeriod.retentionRatePct ?? ''}
                    onChange={(e) =>
                      updateField('currentPeriod', {
                        ...report.currentPeriod,
                        retentionRatePct: optionalNumInput(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                  />
                  {fieldError('currentPeriod.retentionRatePct')}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Net Promoter Score <span className="font-normal text-slate-500">(Optional, -100..100)</span>
                  </label>
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    step={1}
                    placeholder="e.g. 62"
                    value={report.currentPeriod.npsScore ?? ''}
                    onChange={(e) =>
                      updateField('currentPeriod', {
                        ...report.currentPeriod,
                        npsScore: optionalNumInput(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                  />
                  {fieldError('currentPeriod.npsScore')}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Computed Net Profit</span>
                  <div className="font-mono-num text-base font-semibold text-[#0B1120] mt-0.5">
                    {formatCurrency(metrics.netProfit, cur)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Computed Margin</span>
                  <div className="font-mono-num text-base font-semibold text-[#0B1120] mt-0.5">
                    {formatPercent(metrics.profitMarginPct)}
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Period */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                Comparison Period ({report.previousPeriodLabel})
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prior Revenue ({cur})
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.previousPeriod.revenue}
                  onChange={(e) =>
                    updateField('previousPeriod', {
                      ...report.previousPeriod,
                      revenue: numInput(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                />
                {fieldError('previousPeriod.revenue')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prior Operating Expenses ({cur})
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.previousPeriod.expenses}
                  onChange={(e) =>
                    updateField('previousPeriod', {
                      ...report.previousPeriod,
                      expenses: numInput(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                />
                {fieldError('previousPeriod.expenses')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prior Customer Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={report.previousPeriod.customerCount}
                  onChange={(e) =>
                    updateField('previousPeriod', {
                      ...report.previousPeriod,
                      customerCount: numInput(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                />
                {fieldError('previousPeriod.customerCount')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prior Retention Rate % <span className="font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    step="0.1"
                    placeholder="e.g. 98"
                    value={report.previousPeriod.retentionRatePct ?? ''}
                    onChange={(e) =>
                      updateField('previousPeriod', {
                        ...report.previousPeriod,
                        retentionRatePct: optionalNumInput(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                  />
                  {fieldError('previousPeriod.retentionRatePct')}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prior NPS <span className="font-normal text-slate-500">(Optional, -100..100)</span>
                  </label>
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    step={1}
                    placeholder="e.g. 54"
                    value={report.previousPeriod.npsScore ?? ''}
                    onChange={(e) =>
                      updateField('previousPeriod', {
                        ...report.previousPeriod,
                        npsScore: optionalNumInput(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
                  />
                  {fieldError('previousPeriod.npsScore')}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Revenue Growth</span>
                  <div className="font-mono-num text-base font-semibold text-[#0B1120] mt-0.5">
                    {formatPercent(metrics.revenueGrowthPct, { signed: true })}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Profit Growth</span>
                  <div className="font-mono-num text-base font-semibold text-[#0B1120] mt-0.5">
                    {formatPercent(metrics.profitGrowthPct, { signed: true })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Performance Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                  Monthly Performance Series
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drives SVG dual-series charts in Web/PDF and table sparklines in Email HTML.
                </p>
              </div>
              <button
                type="button"
                onClick={addMonth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1120] hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Month</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Month Label</th>
                    <th className="py-2 px-3 font-semibold">Revenue ({cur})</th>
                    <th className="py-2 px-3 font-semibold">Expenses ({cur})</th>
                    <th className="py-2 px-3 font-semibold text-right">Net Profit</th>
                    <th className="py-2 px-3 font-semibold text-right">Margin</th>
                    <th className="py-2 pl-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.monthlyWithProfit.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={m.month}
                          onChange={(e) => {
                            const next = [...report.monthlySeries];
                            next[idx] = { ...next[idx], month: e.target.value };
                            updateField('monthlySeries', next);
                          }}
                          className="w-full min-w-[110px] rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={m.revenue}
                          onChange={(e) => {
                            const next = [...report.monthlySeries];
                            next[idx] = { ...next[idx], revenue: numInput(e.target.value) };
                            updateField('monthlySeries', next);
                          }}
                          className="w-full min-w-[120px] rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={m.expenses}
                          onChange={(e) => {
                            const next = [...report.monthlySeries];
                            next[idx] = { ...next[idx], expenses: numInput(e.target.value) };
                            updateField('monthlySeries', next);
                          }}
                          className="w-full min-w-[120px] rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-xs text-right font-semibold text-[#0B1120] whitespace-nowrap">
                        {formatCurrency(m.netProfit, cur)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-xs text-right text-slate-600 whitespace-nowrap">
                        {formatPercent(m.marginPct)}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeMonth(idx)}
                          disabled={report.monthlySeries.length <= 2}
                          aria-label={`Remove ${m.month}`}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 3: Categories & Segments */}
      {subTab === 'categories' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Categories */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                    Revenue Categories
                  </h2>
                  <p className="font-mono-num text-xs text-slate-500 mt-0.5">
                    Sum: {formatCurrency(metrics.revenueCategoryTotal, cur)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addCategory('revenueCategories')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Stream</span>
                </button>
              </div>
              <div className="space-y-2.5">
                {metrics.revenueCategoriesComputed.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const next = [...report.revenueCategories];
                        next[idx] = { ...next[idx], name: e.target.value };
                        updateField('revenueCategories', next);
                      }}
                      className="flex-1 min-w-0 rounded border border-slate-300 px-2.5 py-1.5 text-xs text-[#0B1120]"
                    />
                    <input
                      type="number"
                      min={0}
                      value={cat.amount}
                      onChange={(e) => {
                        const next = [...report.revenueCategories];
                        next[idx] = { ...next[idx], amount: numInput(e.target.value) };
                        updateField('revenueCategories', next);
                      }}
                      className="w-32 rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                    />
                    <span className="font-mono-num text-xs text-slate-500 w-12 text-right">
                      {cat.sharePct.toFixed(1)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCategory('revenueCategories', idx)}
                      disabled={report.revenueCategories.length <= 1}
                      aria-label={`Remove ${cat.name}`}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                    Expense Categories
                  </h2>
                  <p className="font-mono-num text-xs text-slate-500 mt-0.5">
                    Sum: {formatCurrency(metrics.expenseCategoryTotal, cur)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addCategory('expenseCategories')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
              <div className="space-y-2.5">
                {metrics.expenseCategoriesComputed.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const next = [...report.expenseCategories];
                        next[idx] = { ...next[idx], name: e.target.value };
                        updateField('expenseCategories', next);
                      }}
                      className="flex-1 min-w-0 rounded border border-slate-300 px-2.5 py-1.5 text-xs text-[#0B1120]"
                    />
                    <input
                      type="number"
                      min={0}
                      value={cat.amount}
                      onChange={(e) => {
                        const next = [...report.expenseCategories];
                        next[idx] = { ...next[idx], amount: numInput(e.target.value) };
                        updateField('expenseCategories', next);
                      }}
                      className="w-32 rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                    />
                    <span className="font-mono-num text-xs text-slate-500 w-12 text-right">
                      {cat.sharePct.toFixed(1)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCategory('expenseCategories', idx)}
                      disabled={report.expenseCategories.length <= 1}
                      aria-label={`Remove ${cat.name}`}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Business Segments */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                  Segment Contribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regional or product-line contribution table with share, growth, and margin.
                </p>
              </div>
              <button
                type="button"
                onClick={addSegment}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Segment</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Segment Name</th>
                    <th className="py-2 px-3 font-semibold">Revenue ({cur})</th>
                    <th className="py-2 px-3 font-semibold">YoP Growth %</th>
                    <th className="py-2 px-3 font-semibold">Net Margin %</th>
                    <th className="py-2 px-3 font-semibold text-right">Share</th>
                    <th className="py-2 pl-3 font-semibold text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.segmentsComputed.map((seg, idx) => (
                    <tr key={seg.id}>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={seg.name}
                          onChange={(e) => {
                            const next = [...report.segments];
                            next[idx] = { ...next[idx], name: e.target.value };
                            updateField('segments', next);
                          }}
                          className="w-full min-w-[150px] rounded border border-slate-300 px-2.5 py-1.5 text-xs text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={seg.revenue}
                          onChange={(e) => {
                            const next = [...report.segments];
                            next[idx] = { ...next[idx], revenue: numInput(e.target.value) };
                            updateField('segments', next);
                          }}
                          className="w-32 rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="0.1"
                          value={seg.growthPct}
                          onChange={(e) => {
                            const next = [...report.segments];
                            next[idx] = { ...next[idx], growthPct: numInput(e.target.value) };
                            updateField('segments', next);
                          }}
                          className="w-24 rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="0.1"
                          value={seg.marginPct}
                          onChange={(e) => {
                            const next = [...report.segments];
                            next[idx] = { ...next[idx], marginPct: numInput(e.target.value) };
                            updateField('segments', next);
                          }}
                          className="w-24 rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-xs text-right text-slate-600">
                        {seg.sharePct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeSegment(idx)}
                          aria-label={`Remove ${seg.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 4: Narrative & Priorities */}
      {subTab === 'narrative' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#0B1120]">
              Executive Summary &amp; Closing Takeaway
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Overview
              </label>
              <textarea
                rows={3}
                value={report.narrative.overview}
                onChange={(e) =>
                  updateField('narrative', { ...report.narrative, overview: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] leading-relaxed focus:border-[#0891B2] focus:outline-none"
              />
              {fieldError('narrative.overview')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Achievements
                </label>
                <textarea
                  rows={3}
                  value={report.narrative.achievements}
                  onChange={(e) =>
                    updateField('narrative', { ...report.narrative, achievements: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] leading-relaxed focus:border-[#0891B2] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Challenges
                </label>
                <textarea
                  rows={3}
                  value={report.narrative.challenges}
                  onChange={(e) =>
                    updateField('narrative', { ...report.narrative, challenges: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] leading-relaxed focus:border-[#0891B2] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Closing Executive Takeaway
              </label>
              <textarea
                rows={2}
                value={report.narrative.closingTakeaway}
                onChange={(e) =>
                  updateField('narrative', { ...report.narrative, closingTakeaway: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] leading-relaxed focus:border-[#0891B2] focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Client &amp; Partner Safe Summary Override{' '}
                  <span className="font-normal text-slate-500">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Used automatically as the primary summary in Client &amp; Partner Edition
                </span>
              </div>
              <textarea
                rows={2}
                placeholder="Optional external-safe summary highlighting delivered customer value, retention, and solution adoption (avoid OpEx, net profit, or margin figures)."
                value={report.narrative.clientSummary ?? ''}
                onChange={(e) =>
                  updateField('narrative', {
                    ...report.narrative,
                    clientSummary: e.target.value || undefined,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] leading-relaxed focus:border-[#0891B2] focus:outline-none"
              />
              {(() => {
                const rawClientText = report.narrative.clientSummary?.trim();
                const hasClientLeak = rawClientText
                  ? containsConfidentialFinancialReference(rawClientText, report, metrics)
                  : false;
                const isClientMode = (report.audienceEdition ?? 'board') === 'client';
                if (!hasClientLeak && !isClientMode) return null;
                const sanitizedPreview = sanitizeReportForAudience(report, 'client');
                return (
                  <div
                    className={`rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${
                      hasClientLeak
                        ? 'border-amber-300 bg-amber-50 text-amber-950'
                        : 'border-cyan-200 bg-cyan-50/60 text-cyan-950'
                    }`}
                  >
                    <div className="font-semibold">
                      {hasClientLeak
                        ? 'Confidential terms or internal ratios detected in Client Summary Override — automatic redaction fallback will apply:'
                        : 'Live Client & Partner Edition Redacted Narrative Preview:'}
                    </div>
                    <p className="mt-1 text-slate-700">{sanitizedPreview.report.narrative.overview}</p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                  Strategic Priorities (3–5 Recommended)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actionable leadership initiatives rendered in Section VI of the executive report.
                </p>
              </div>
              <button
                type="button"
                onClick={addPriority}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Priority</span>
              </button>
            </div>

            <div className="space-y-3">
              {report.strategicPriorities.map((sp, idx) => (
                <div
                  key={sp.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
                >
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Initiative Title
                    </label>
                    <input
                      type="text"
                      value={sp.title}
                      onChange={(e) => {
                        const next = [...report.strategicPriorities];
                        next[idx] = { ...next[idx], title: e.target.value };
                        updateField('strategicPriorities', next);
                      }}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-[#0B1120]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Horizon
                    </label>
                    <select
                      value={sp.horizon}
                      onChange={(e) => {
                        const next = [...report.strategicPriorities];
                        next[idx] = {
                          ...next[idx],
                          horizon: e.target.value as StrategicPriority['horizon'],
                        };
                        updateField('strategicPriorities', next);
                      }}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-[#0B1120]"
                    >
                      <option value="Immediate (0-30d)">Immediate (0-30d)</option>
                      <option value="Near-Term (Q+1)">Near-Term (Q+1)</option>
                      <option value="Strategic (2-4Q)">Strategic (2-4Q)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={sp.owner}
                      onChange={(e) => {
                        const next = [...report.strategicPriorities];
                        next[idx] = { ...next[idx], owner: e.target.value };
                        updateField('strategicPriorities', next);
                      }}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-[#0B1120]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Target Impact
                    </label>
                    <input
                      type="text"
                      value={sp.targetImpact}
                      onChange={(e) => {
                        const next = [...report.strategicPriorities];
                        next[idx] = { ...next[idx], targetImpact: e.target.value };
                        updateField('strategicPriorities', next);
                      }}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-[#0B1120]"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end pt-5">
                    <button
                      type="button"
                      onClick={() => removePriority(idx)}
                      disabled={report.strategicPriorities.length <= 1}
                      aria-label={`Remove priority ${sp.title}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
