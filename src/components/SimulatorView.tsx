import { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw, ShieldCheck, Sliders } from 'lucide-react';
import { getAudienceEdition } from '../core/audiences.ts';
import { formatCurrency, formatNumber, formatPercent } from '../core/calculations.ts';
import {
  computeCombinedRevenueDeltaPct,
  DEFAULT_SIMULATION_ASSUMPTIONS,
  runWhatIfSimulation,
  SIMULATION_PRESETS,
  solveArpuDeltaFromRevenueAndCustomers,
} from '../core/simulator.ts';
import type { ReportInputData, SimulationAssumptions } from '../core/types.ts';

interface SimulatorViewProps {
  report: ReportInputData;
  onChange: (next: ReportInputData) => void;
  onOpenPreview: () => void;
}

interface DraftPercentInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  onCommit: (next: number) => void;
}

function DraftPercentInput({ id, value, min, max, onCommit }: DraftPercentInputProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [value, focused]);

  const clampAndCommit = (raw: string) => {
    const trimmed = raw.trim();
    const parsed = Number(trimmed);
    if (trimmed === '' || trimmed === '-' || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Number(Math.max(min, Math.min(max, parsed)).toFixed(1));
    setDraft(String(clamped));
    onCommit(clamped);
  };

  return (
    <input
      aria-labelledby={id}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw.trim() !== '' && raw.trim() !== '-' && raw.trim() !== '.') {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            onCommit(Number(Math.max(min, Math.min(max, parsed)).toFixed(1)));
          }
        }
      }}
      onBlur={() => {
        setFocused(false);
        clampAndCommit(draft);
      }}
      className="w-16 rounded border border-slate-300 px-2 py-1 text-right font-mono-num text-xs text-[#0B1120]"
    />
  );
}

export function SimulatorView({ report, onChange, onOpenPreview }: SimulatorViewProps) {
  const assumptions: SimulationAssumptions =
    report.simulation ?? DEFAULT_SIMULATION_ASSUMPTIONS;
  const projection = runWhatIfSimulation(report, assumptions);
  const audience = getAudienceEdition(report.audienceEdition);
  const cur = report.currency;

  const commitAssumptions = (nextAssumptions: SimulationAssumptions) => {
    onChange({
      ...report,
      simulation: nextAssumptions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLeverChange = (
    key: 'revenueDeltaPct' | 'expenseDeltaPct' | 'customerDeltaPct' | 'arpuDeltaPct',
    nextVal: number
  ) => {
    const safeVal = Number.isFinite(nextVal) ? nextVal : 0;
    if (key === 'customerDeltaPct') {
      const combinedRev = computeCombinedRevenueDeltaPct(safeVal, assumptions.arpuDeltaPct);
      commitAssumptions({
        ...assumptions,
        customerDeltaPct: safeVal,
        revenueDeltaPct: combinedRev,
      });
      return;
    }
    if (key === 'arpuDeltaPct') {
      const combinedRev = computeCombinedRevenueDeltaPct(assumptions.customerDeltaPct, safeVal);
      commitAssumptions({
        ...assumptions,
        arpuDeltaPct: safeVal,
        revenueDeltaPct: combinedRev,
      });
      return;
    }
    if (key === 'revenueDeltaPct') {
      const solvedArpu = solveArpuDeltaFromRevenueAndCustomers(
        safeVal,
        assumptions.customerDeltaPct
      );
      commitAssumptions({
        ...assumptions,
        revenueDeltaPct: safeVal,
        arpuDeltaPct: solvedArpu,
      });
      return;
    }
    commitAssumptions({
      ...assumptions,
      expenseDeltaPct: safeVal,
    });
  };

  const applyPreset = (presetAssumptions: SimulationAssumptions) => {
    commitAssumptions({
      ...presetAssumptions,
      revenueDeltaPct: computeCombinedRevenueDeltaPct(
        presetAssumptions.customerDeltaPct,
        presetAssumptions.arpuDeltaPct
      ),
      includeInReport: assumptions.includeInReport ?? false,
    });
  };

  const sliderConfigs: {
    key: 'customerDeltaPct' | 'arpuDeltaPct' | 'revenueDeltaPct' | 'expenseDeltaPct';
    label: string;
    hint: string;
    min: number;
    max: number;
    step: number;
    value: number;
  }[] = [
    {
      key: 'customerDeltaPct',
      label: 'Active Customer Base Shift',
      hint: 'Drives projected customers and compounds top-line scale (%)',
      min: -30,
      max: 60,
      step: 1,
      value: assumptions.customerDeltaPct,
    },
    {
      key: 'arpuDeltaPct',
      label: 'Pricing / ARPU Uplift Assumption',
      hint: 'Adjusts revenue per customer without double-counting volume (%)',
      min: -25,
      max: 40,
      step: 1,
      value: assumptions.arpuDeltaPct,
    },
    {
      key: 'revenueDeltaPct',
      label: 'Implied Total Revenue Growth',
      hint: 'Linked to Customers × ARPU — dragging adjusts implied ARPU shift (%)',
      min: -45,
      max: 100,
      step: 0.5,
      value: projection.impliedRevenueDeltaPct,
    },
    {
      key: 'expenseDeltaPct',
      label: 'Operating Expense Shift Assumption',
      hint: 'Cost expansion (+) or operating discipline (-%)',
      min: -35,
      max: 50,
      step: 1,
      value: assumptions.expenseDeltaPct,
    },
  ];

  // Build SVG Actual vs Projected monthly bars
  const series = projection.projectedMonthlySeries;
  const svgW = 720;
  const svgH = 220;
  const padL = 56;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxVal =
    Math.max(...series.flatMap((m) => [m.actualRevenue, m.projectedRevenue]), 1) * 1.12;
  const groupW = series.length > 0 ? plotW / series.length : plotW;
  const barW = Math.min(26, Math.max(10, groupW * 0.28));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Hypothetical Projection Sandbox · Non-Actual Modeling
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120] mt-1">
            What-If Business Simulator
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Model customer growth, ARPU pricing power, and expense leverage under the unified
            identity Projected Revenue = Projected Customers &times; Projected ARPU. Reported actuals
            remain untouched.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => applyPreset(DEFAULT_SIMULATION_ASSUMPTIONS)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Scenario</span>
          </button>
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-4 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] cursor-pointer"
          >
            Inspect in Live Preview
          </button>
        </div>
      </div>

      {/* Explicit Non-Actual Banner */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">HYPOTHETICAL PROJECTION NOTICE: </span>
            Calculated scenario figures below are forward-looking sensitivities and are never merged
            into your verified financial statements.
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B1120] shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(assumptions.includeInReport)}
            onChange={(e) =>
              commitAssumptions({ ...assumptions, includeInReport: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-400 text-[#0B1120]"
          />
          <span>Attach Labeled Appendix to Exports</span>
        </label>
      </div>

      {/* Client Edition Guardrail Notice */}
      {audience.redactInternalExpenses ? (
        <div className="rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 flex items-start gap-2.5 text-xs text-cyan-950">
          <ShieldCheck className="h-4 w-4 text-[#0B6179] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Client &amp; Partner Edition Active: </span>
            Internal operating expenses, net profit, and What-If projection appendices are
            automatically withheld from all Client Edition previews, exports, and presentations.
          </div>
        </div>
      ) : null}

      {/* Scenario Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SIMULATION_PRESETS.map((preset) => {
          const active = assumptions.scenarioName === preset.assumptions.scenarioName;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.assumptions)}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                active
                  ? 'border-[#0B1120] bg-[#0B1120] text-[#F8F6F0]'
                  : 'border-slate-200 bg-white hover:border-slate-400 text-[#0B1120]'
              }`}
            >
              <div className="text-xs font-semibold">{preset.label}</div>
              <p
                className={`text-[11px] mt-1 leading-relaxed ${
                  active ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Split: Assumption Controls & Live Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#0B6179]" />
            <h2 className="font-display text-lg font-semibold text-[#0B1120]">
              Assumption Levers
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scenario Label
            </label>
            <input
              type="text"
              value={assumptions.scenarioName}
              onChange={(e) =>
                commitAssumptions({ ...assumptions, scenarioName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
            />
          </div>

          <div className="space-y-4">
            {sliderConfigs.map((cfg) => (
              <div key={cfg.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    id={`sim-label-${cfg.key}`}
                    htmlFor={`sim-${cfg.key}`}
                    className="text-xs font-semibold text-[#0B1120]"
                  >
                    {cfg.label}
                  </label>
                  <div className="flex items-center gap-1">
                    <DraftPercentInput
                      id={`sim-label-${cfg.key}`}
                      value={cfg.value}
                      min={cfg.min}
                      max={cfg.max}
                      onCommit={(nextVal) => handleLeverChange(cfg.key, nextVal)}
                    />
                    <span className="font-mono-num text-xs text-slate-500">%</span>
                  </div>
                </div>
                <input
                  id={`sim-${cfg.key}`}
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={cfg.value}
                  onChange={(e) => handleLeverChange(cfg.key, Number(e.target.value))}
                  className="w-full accent-[#0B1120] cursor-pointer"
                />
                <div className="text-[11px] text-slate-500">{cfg.hint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Projected Outcomes & SVG Chart */}
        <div className="lg:col-span-7 space-y-5">
          {/* Projected KPI Grid */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#0B1120]">
                Projected Outcomes vs. Reported Actuals
              </span>
              <span className="font-mono-num text-[11px] font-semibold text-amber-800">
                Status: {projection.projectedHealthStatus} (Simulated)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 px-5 font-semibold">Metric</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Reported Actual</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Hypothetical Projected</th>
                    <th className="py-2.5 px-5 font-semibold text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0B1120]">Period Revenue</td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                      {formatCurrency(projection.actualRevenue, cur)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                      {formatCurrency(projection.projectedRevenue, cur)}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono-num font-semibold ${
                        projection.revenueVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(projection.revenueVariance, cur, { signed: true })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0B1120]">Operating Expenses</td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                      {formatCurrency(projection.actualExpenses, cur)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                      {formatCurrency(projection.projectedExpenses, cur)}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono-num font-semibold ${
                        projection.expenseVariance <= 0 ? 'text-emerald-700' : 'text-amber-800'
                      }`}
                    >
                      {formatCurrency(projection.expenseVariance, cur, { signed: true })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0B1120]">Net Profit</td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                      {formatCurrency(projection.actualNetProfit, cur)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                      {formatCurrency(projection.projectedNetProfit, cur)}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono-num font-semibold ${
                        projection.netProfitVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(projection.netProfitVariance, cur, { signed: true })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0B1120]">Net Profit Margin</td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                      {formatPercent(projection.actualMarginPct)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                      {formatPercent(projection.projectedMarginPct)}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono-num font-semibold ${
                        projection.marginVariancePts >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {projection.marginVariancePts >= 0 ? '+' : ''}
                      {projection.marginVariancePts.toFixed(1)} pts
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0B1120]">Active Customers</td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                      {formatNumber(projection.actualCustomers)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                      {formatNumber(projection.projectedCustomers)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-num font-semibold text-slate-700">
                      {projection.customerVariance >= 0 ? '+' : ''}
                      {formatNumber(projection.customerVariance)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0B1120]">ARPU (Revenue / Customer)</td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                      {projection.actualArpu !== null
                        ? formatCurrency(projection.actualArpu, cur)
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1120]">
                      {projection.projectedArpu !== null
                        ? formatCurrency(projection.projectedArpu, cur)
                        : 'N/A'}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono-num font-semibold ${
                        (projection.arpuVariance ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {projection.arpuVariance !== null
                        ? formatCurrency(projection.arpuVariance, cur, { signed: true })
                        : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Actual vs Projected Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0B1120]">
                  Monthly Actual vs. Simulated Revenue Curve
                </h3>
                <p className="text-[11px] text-slate-500">
                  Side-by-side trajectory showing scenario variance per reporting month
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-slate-400 inline-block" />
                  Actual
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#0891B2] inline-block" />
                  Hypothetical Projected
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              role="img"
              aria-label="Actual versus projected monthly revenue chart"
              className="w-full h-auto block"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = padT + plotH - r * plotH;
                const val = maxVal * r;
                return (
                  <g key={i}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#64748B"
                      fontFamily="monospace"
                    >
                      {formatCurrency(val, cur, { compact: true })}
                    </text>
                  </g>
                );
              })}

              {series.map((m, idx) => {
                const cx = padL + idx * groupW + groupW / 2;
                const actH = m.actualRevenue > 0 ? Math.max(2, (m.actualRevenue / maxVal) * plotH) : 0;
                const projH =
                  m.projectedRevenue > 0 ? Math.max(2, (m.projectedRevenue / maxVal) * plotH) : 0;
                return (
                  <g key={m.month}>
                    {actH > 0 ? (
                      <rect
                        x={cx - barW - 2}
                        y={padT + plotH - actH}
                        width={barW}
                        height={actH}
                        rx={3}
                        fill="#94A3B8"
                      />
                    ) : null}
                    {projH > 0 ? (
                      <rect
                        x={cx + 2}
                        y={padT + plotH - projH}
                        width={barW}
                        height={projH}
                        rx={3}
                        fill="#0891B2"
                      />
                    ) : null}
                    <text
                      x={cx}
                      y={svgH - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#475569"
                      fontFamily="monospace"
                    >
                      {m.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
