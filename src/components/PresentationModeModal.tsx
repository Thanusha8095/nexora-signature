import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  StickyNote,
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
  filterInsightsForAudience,
  filterRecommendationsForAudience,
  filterTrendForAudience,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../core/intelligence.ts';
import { runWhatIfSimulation } from '../core/simulator.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type { AudienceEditionId, ReportInputData } from '../core/types.ts';

interface PresentationModeModalProps {
  report: ReportInputData;
  onSelectAudience: (edition: AudienceEditionId) => void;
  onClose: () => void;
}

interface DeckSlide {
  id: string;
  label: string;
  title: string;
  speakerNotes: string;
}

export function PresentationModeModal({
  report,
  onSelectAudience,
  onClose,
}: PresentationModeModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const theme = useMemo(() => resolveBrandTheme(report), [report]);
  const audience = useMemo(
    () => getAudienceEdition(report.audienceEdition),
    [report.audienceEdition]
  );
  const metrics = useMemo(() => computeReportMetrics(report), [report]);
  const trend = useMemo(
    () =>
      filterTrendForAudience(
        computeTrendAnalysis(report, metrics),
        audience.redactInternalExpenses
      ),
    [report, metrics, audience.redactInternalExpenses]
  );
  const rawInsights = useMemo(
    () => generateExecutiveInsights(report, metrics),
    [report, metrics]
  );
  const insights = useMemo(
    () => filterInsightsForAudience(rawInsights, trend, audience.redactInternalExpenses),
    [rawInsights, trend, audience.redactInternalExpenses]
  );
  const recommendations = useMemo(
    () =>
      filterRecommendationsForAudience(
        generateStrategicRecommendations(report, metrics, rawInsights),
        audience.redactInternalExpenses
      ),
    [report, metrics, rawInsights, audience.redactInternalExpenses]
  );

  const showSimulationSlide = Boolean(
    report.simulation?.includeInReport && !audience.redactInternalExpenses
  );
  const simulation = useMemo(
    () =>
      showSimulationSlide && report.simulation
        ? runWhatIfSimulation(report, report.simulation)
        : null,
    [showSimulationSlide, report]
  );

  const cur = report.currency;
  const c = theme.colors;

  const slides: DeckSlide[] = useMemo(() => {
    const base: DeckSlide[] = [
      {
        id: 'cover',
        label: '01 Cover',
        title: report.title,
        speakerNotes: `Opening framing for ${audience.name}: ${report.narrative.overview} Key takeaway: ${report.narrative.closingTakeaway}`,
      },
      {
        id: 'scorecard',
        label: '02 Scorecard',
        title: 'Hero KPI & Financial Scorecard',
        speakerNotes: audience.redactInternalExpenses
          ? `Focus on top-line growth (${formatPercent(metrics.revenueGrowthPct, { signed: true })}) across ${formatNumber(report.currentPeriod.customerCount)} active accounts. Internal cost drivers are withheld under Client & Partner governance.`
          : `Lead with ${audience.heroLabel}: Net profit settled at ${formatCurrency(metrics.netProfit, cur)} (${formatPercent(metrics.profitMarginPct)} margin, ${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift vs ${report.previousPeriodLabel}). Health status: ${metrics.healthStatus}.`,
      },
      {
        id: 'trajectory',
        label: '03 Trajectory',
        title: 'Monthly Trajectory & Rolling 3M Momentum',
        speakerNotes: trend.hasSufficientData
          ? `${trend.summaryHeadline} — ${trend.summaryNarrative}`
          : 'Monthly revenue and expense trajectory across the reporting horizon.',
      },
      {
        id: 'mix',
        label: '04 Portfolio',
        title: audience.redactInternalExpenses
          ? 'Revenue Portfolio & Segment Reach'
          : 'Revenue Mix, Cost Drivers & Operating Segments',
        speakerNotes: `Leading revenue stream: ${metrics.revenueCategoriesComputed[0]?.name ?? 'Primary'} (${metrics.revenueCategoriesComputed[0]?.sharePct.toFixed(1) ?? '0'}% share).${!audience.redactInternalExpenses && metrics.expenseCategoriesComputed[0] ? ` Largest cost driver: ${metrics.expenseCategoriesComputed[0].name} (${metrics.expenseCategoriesComputed[0].sharePct.toFixed(1)}% share).` : ''}`,
      },
      {
        id: 'story-intelligence',
        label: '05 Story & Rules',
        title: 'Four-Beat Story Arc & Verified Intelligence',
        speakerNotes: insights
          .slice(0, 3)
          .map((ins) => `[${ins.category}] ${ins.headline} (${ins.formulaTrace ?? ins.supportingMetric})`)
          .join(' | '),
      },
      {
        id: 'priorities',
        label: '06 Mandate',
        title: 'Strategic Priorities & Leadership Mandate',
        speakerNotes: `Next-horizon mandate: ${report.strategicPriorities.map((p) => `${p.title} (${p.owner})`).join('; ')}. Closing note: ${report.narrative.closingTakeaway}`,
      },
    ];

    if (showSimulationSlide && simulation) {
      base.push({
        id: 'simulation',
        label: '07 Scenario',
        title: `What-If Scenario: ${simulation.assumptions.scenarioName}`,
        speakerNotes: `Strictly hypothetical non-actual projection: Revenue ${simulation.assumptions.revenueDeltaPct >= 0 ? '+' : ''}${simulation.assumptions.revenueDeltaPct}%, OpEx ${simulation.assumptions.expenseDeltaPct >= 0 ? '+' : ''}${simulation.assumptions.expenseDeltaPct}% yields projected net profit of ${formatCurrency(simulation.projectedNetProfit, cur)} (${formatCurrency(simulation.netProfitVariance, cur, { signed: true })} variance).`,
      });
    }

    return base;
  }, [
    report,
    audience,
    metrics,
    cur,
    trend,
    insights,
    showSimulationSlide,
    simulation,
  ]);

  const clampedIndex = Math.min(slideIndex, Math.max(0, slides.length - 1));
  const activeSlide = slides[clampedIndex];

  const goNext = useCallback(() => {
    setSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowNotes((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose]);

  const heroPrimary = useMemo(() => {
    if (audience.heroMetric === 'netProfit') {
      return {
        label: audience.heroLabel,
        value: formatCurrency(metrics.netProfit, cur),
        delta: formatPercent(metrics.profitGrowthPct, { signed: true }),
        positive: (metrics.profitGrowthPct ?? 0) >= 0,
        detail: `${formatCurrency(metrics.netProfit - metrics.previousNetProfit, cur, { signed: true })} vs ${report.previousPeriodLabel}`,
      };
    }
    if (audience.heroMetric === 'margin') {
      return {
        label: audience.heroLabel,
        value: formatPercent(metrics.profitMarginPct),
        delta: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts`,
        positive: metrics.marginDeltaPts >= 0,
        detail: `vs ${formatPercent(metrics.previousProfitMarginPct)} in ${report.previousPeriodLabel}`,
      };
    }
    if (audience.heroMetric === 'customers') {
      const diff = report.currentPeriod.customerCount - report.previousPeriod.customerCount;
      return {
        label: audience.heroLabel,
        value: formatNumber(report.currentPeriod.customerCount),
        delta: formatPercent(metrics.customerGrowthPct, { signed: true }),
        positive: (metrics.customerGrowthPct ?? 0) >= 0,
        detail: `${diff >= 0 ? '+' : ''}${formatNumber(diff)} vs ${report.previousPeriodLabel}`,
      };
    }
    return {
      label: audience.heroLabel,
      value: formatCurrency(report.currentPeriod.revenue, cur),
      delta: formatPercent(metrics.revenueGrowthPct, { signed: true }),
      positive: (metrics.revenueGrowthPct ?? 0) >= 0,
      detail: `${formatCurrency(report.currentPeriod.revenue - report.previousPeriod.revenue, cur, { signed: true })} vs ${report.previousPeriodLabel}`,
    };
  }, [audience, metrics, report, cur]);

  const scorecardCards = useMemo(() => {
    if (audience.redactInternalExpenses) {
      return [
        {
          label: 'Total Revenue',
          value: formatCurrency(report.currentPeriod.revenue, cur),
          sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
          good: (metrics.revenueGrowthPct ?? 0) >= 0,
        },
        {
          label: 'Active Customers',
          value: formatNumber(report.currentPeriod.customerCount),
          sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
          good: (metrics.customerGrowthPct ?? 0) >= 0,
        },
        {
          label: 'Revenue / Customer',
          value:
            metrics.revenuePerCustomer !== null
              ? formatCurrency(metrics.revenuePerCustomer, cur)
              : 'N/A',
          sub: `${formatPercent(metrics.arpuGrowthPct, { signed: true })} ARPU shift`,
          good: (metrics.arpuGrowthPct ?? 0) >= 0,
        },
        {
          label: 'Retention Rate',
          value:
            report.currentPeriod.retentionRatePct !== undefined
              ? `${report.currentPeriod.retentionRatePct.toFixed(1)}%`
              : metrics.healthStatus,
          sub: report.currentPeriod.npsScore !== undefined ? `NPS ${report.currentPeriod.npsScore}` : report.reportingPeriod,
          good: true,
        },
      ];
    }
    return [
      {
        label: 'Total Revenue',
        value: formatCurrency(report.currentPeriod.revenue, cur),
        sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
        good: (metrics.revenueGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Operating Expenses',
        value: formatCurrency(report.currentPeriod.expenses, cur),
        sub: `${formatPercent(metrics.expenseGrowthPct, { signed: true })} vs prior`,
        good: (metrics.expenseGrowthPct ?? 0) <= (metrics.revenueGrowthPct ?? 0),
      },
      {
        label: 'Net Profit',
        value: formatCurrency(metrics.netProfit, cur),
        sub: `${formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior`,
        good: metrics.netProfit >= 0 && (metrics.profitGrowthPct ?? 0) >= 0,
      },
      {
        label: 'Profit Margin',
        value: formatPercent(metrics.profitMarginPct),
        sub: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift`,
        good: metrics.marginDeltaPts >= 0,
      },
      {
        label: 'Active Customers',
        value: formatNumber(report.currentPeriod.customerCount),
        sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
        good: (metrics.customerGrowthPct ?? 0) >= 0,
      },
    ];
  }, [audience.redactInternalExpenses, report, cur, metrics]);

  const storyChapters = useMemo(() => {
    const revTrend = trend.metrics.find((m) => m.id === 'revenue');
    return [
      {
        step: '01 · Scale & Demand',
        body: `${report.branding.companyName} recorded ${formatCurrency(report.currentPeriod.revenue, cur)} in revenue (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) across ${formatNumber(report.currentPeriod.customerCount)} accounts.`,
      },
      {
        step: `02 · Rolling ${trend.windowMonthsCount || 3}M Momentum`,
        body:
          trend.hasSufficientData && revTrend
            ? `${trend.overallSignal} cadence: ${trend.latestMonthLabel} (${revTrend.currentMonthFormatted}) tracked ${revTrend.deltaFormatted} against the ${revTrend.rolling3MoAvgFormatted} trailing baseline.`
            : `Peak monthly velocity occurred in ${metrics.bestMonth?.month ?? 'the period'} (${formatCurrency(metrics.bestMonth?.revenue ?? 0, cur)}).`,
      },
      {
        step: audience.redactInternalExpenses ? '03 · Account Value' : '03 · Operating Leverage',
        body: audience.redactInternalExpenses
          ? `Account revenue averaged ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'} (${formatPercent(metrics.arpuGrowthPct, { signed: true })} YoP).`
          : `Operating discipline generated ${formatCurrency(metrics.netProfit, cur)} net profit at ${formatPercent(metrics.profitMarginPct)} margin (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts).`,
      },
      {
        step: '04 · Forward Mandate',
        body: report.strategicPriorities[0]
          ? `${report.strategicPriorities[0].title} (${report.strategicPriorities[0].owner}) — targeting ${report.strategicPriorities[0].targetImpact}.`
          : report.narrative.closingTakeaway,
      },
    ];
  }, [report, cur, metrics, trend, audience.redactInternalExpenses]);

  const renderTrajectorySvg = () => {
    const series = metrics.monthlyWithProfit;
    if (series.length === 0) return null;
    const width = 740;
    const height = 270;
    const padLeft = 62;
    const padRight = 22;
    const padTop = 26;
    const padBottom = 38;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const rawVals = series.flatMap((m) =>
      audience.redactInternalExpenses ? [m.revenue] : [m.revenue, m.expenses, m.netProfit]
    );
    const maxPos = Math.max(...rawVals, 1) * 1.15;
    const minNeg = audience.redactInternalExpenses
      ? 0
      : Math.min(0, ...series.map((m) => m.netProfit));
    const minVal = minNeg < 0 ? minNeg * 1.15 : 0;
    const span = Math.max(maxPos - minVal, 1);

    const yFor = (val: number) => padTop + chartH - ((val - minVal) / span) * chartH;
    const zeroY = yFor(0);
    const groupW = chartW / series.length;
    const barW = Math.min(
      30,
      Math.max(10, groupW * (audience.redactInternalExpenses ? 0.42 : 0.28))
    );

    const rollingPoints = trend.rollingSeries
      .map((pt, i) => {
        const cx = padLeft + i * groupW + groupW / 2;
        return `${cx.toFixed(1)},${yFor(pt.rolling3MoRevenueAvg).toFixed(1)}`;
      })
      .join(' ');

    const profitPoints = series
      .map((m, i) => {
        const cx = padLeft + i * groupW + groupW / 2;
        return `${cx.toFixed(1)},${yFor(m.netProfit).toFixed(1)}`;
      })
      .join(' ');

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((r) => {
      const val = minVal + span * r;
      return { val, y: yFor(val) };
    });

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Presentation monthly trajectory chart"
        className="w-full"
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={t.y}
              x2={width - padRight}
              y2={t.y}
              stroke={c.border}
              strokeDasharray="3 3"
            />
            <text
              x={padLeft - 8}
              y={t.y + 4}
              textAnchor="end"
              fill={c.textMuted}
              fontSize="10.5"
              fontFamily={theme.typography.monoFont}
            >
              {formatCurrency(t.val, cur, { compact: true })}
            </text>
          </g>
        ))}
        {minVal < 0 ? (
          <line
            x1={padLeft}
            y1={zeroY}
            x2={width - padRight}
            y2={zeroY}
            stroke={c.textMuted}
            strokeWidth={1.2}
          />
        ) : null}

        {series.map((m, i) => {
          const cx = padLeft + i * groupW + groupW / 2;
          const revTop = yFor(Math.max(0, m.revenue));
          const revH = Math.max(2, zeroY - revTop);
          const expTop = yFor(Math.max(0, m.expenses));
          const expH = Math.max(2, zeroY - expTop);

          if (audience.redactInternalExpenses) {
            return (
              <g key={m.month}>
                <rect
                  x={cx - barW / 2}
                  y={revTop}
                  width={barW}
                  height={revH}
                  rx={3}
                  fill={c.chartRevenue}
                />
                {series.length <= 8 ? (
                  <text
                    x={cx}
                    y={revTop - 6}
                    textAnchor="middle"
                    fill={c.textMuted}
                    fontSize="10"
                    fontFamily={theme.typography.monoFont}
                  >
                    {formatCurrency(m.revenue, cur, { compact: true })}
                  </text>
                ) : null}
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  fill={c.textMuted}
                  fontSize="11"
                  fontFamily={theme.typography.monoFont}
                >
                  {m.month}
                </text>
              </g>
            );
          }

          return (
            <g key={m.month}>
              <rect
                x={cx - barW - 2}
                y={revTop}
                width={barW}
                height={revH}
                rx={3}
                fill={c.chartRevenue}
              />
              <rect
                x={cx + 2}
                y={expTop}
                width={barW}
                height={expH}
                rx={3}
                fill={c.chartExpense}
                opacity={0.88}
              />
              {series.length <= 8 ? (
                <text
                  x={cx - barW / 2 - 2}
                  y={revTop - 6}
                  textAnchor="middle"
                  fill={c.textMuted}
                  fontSize="10"
                  fontFamily={theme.typography.monoFont}
                >
                  {formatCurrency(m.revenue, cur, { compact: true })}
                </text>
              ) : null}
              <text
                x={cx}
                y={height - 12}
                textAnchor="middle"
                fill={c.textMuted}
                fontSize="11"
                fontFamily={theme.typography.monoFont}
              >
                {m.month}
              </text>
            </g>
          );
        })}

        {trend.rollingSeries.length > 1 ? (
          <polyline
            fill="none"
            stroke={c.accent}
            strokeWidth={2}
            strokeDasharray="5 4"
            points={rollingPoints}
          />
        ) : null}

        {!audience.redactInternalExpenses && series.length > 1 ? (
          <>
            <polyline fill="none" stroke={c.chartProfit} strokeWidth={2.4} points={profitPoints} />
            {series.map((m, i) => {
              const cx = padLeft + i * groupW + groupW / 2;
              return (
                <circle
                  key={`${m.month}-pt`}
                  cx={cx}
                  cy={yFor(m.netProfit)}
                  r={4}
                  fill={c.surface}
                  stroke={c.chartProfit}
                  strokeWidth={2.5}
                />
              );
            })}
          </>
        ) : null}
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="NEXORA Executive Presentation Mode"
      className="fixed inset-0 z-50 flex flex-col bg-[#070B14] text-[#F8F6F0]"
    >
      {/* Top Boardroom Deck Toolbar */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-800 bg-[#0B1120] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono-num text-xs font-bold tracking-wider uppercase text-[#D4FF33] shrink-0">
            Presentation Mode
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-xs font-medium text-slate-200 truncate hidden sm:inline">
            {report.branding.companyName} &middot; {report.reportingPeriod}
          </span>
          <span className="font-mono-num text-xs text-slate-400 shrink-0">
            Slide {clampedIndex + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Presentation audience edition"
            value={report.audienceEdition ?? 'board'}
            onChange={(e) => onSelectAudience(e.target.value as AudienceEditionId)}
            className="rounded-md border border-slate-700 bg-[#111A2E] px-2.5 py-1.5 text-xs font-medium text-slate-100 cursor-pointer"
          >
            {AUDIENCE_EDITION_LIST.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
              showNotes
                ? 'border-[#D4FF33] bg-[#17223B] text-[#D4FF33]'
                : 'border-slate-700 bg-[#111A2E] text-slate-200 hover:bg-slate-800'
            }`}
          >
            <StickyNote className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Speaker Notes</span>
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="p-1.5 rounded-md border border-slate-700 bg-[#111A2E] text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close presentation mode"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-700 bg-[#111A2E] text-slate-200 hover:bg-slate-800 text-xs font-medium cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        <div
          className="w-full max-w-[1140px] rounded-xl overflow-hidden shadow-2xl border transition-colors"
          style={{
            backgroundColor: c.canvas,
            borderColor: c.border,
            color: c.text,
            fontFamily: theme.typography.bodyFont,
          }}
        >
          {/* Slide Stage Header */}
          <div
            className="px-6 sm:px-10 py-4 border-b flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{
              backgroundColor: c.surface,
              borderColor: c.border,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {report.branding.logoDataUrl ? (
                <img
                  src={report.branding.logoDataUrl}
                  alt={report.branding.companyName}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded object-contain border"
                  style={{ borderColor: c.border }}
                />
              ) : null}
              <span
                className="font-bold uppercase tracking-wider truncate"
                style={{ color: c.accent }}
              >
                {report.branding.companyName}
              </span>
              <span style={{ color: c.textMuted }}>&middot;</span>
              <span style={{ color: c.textMuted }}>{audience.coverKicker}</span>
            </div>
            <div className="font-mono-num" style={{ color: c.textMuted }}>
              {activeSlide.label} &middot; {report.reportingPeriod}
            </div>
          </div>

          {/* Slide Body */}
          <div className="p-6 sm:p-10 min-h-[460px] flex flex-col justify-center">
            {activeSlide.id === 'cover' ? (
              <div className="space-y-8">
                <div className="space-y-4 max-w-3xl">
                  <div
                    className="font-mono-num text-xs uppercase tracking-[0.14em] font-semibold"
                    style={{ color: c.accent }}
                  >
                    {audience.name} &middot; {report.branding.classification}
                  </div>
                  <h1
                    className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight"
                    style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                  >
                    {report.title}
                  </h1>
                  <p className="text-base sm:text-lg leading-relaxed" style={{ color: c.textMuted }}>
                    {report.subtitle}
                  </p>
                </div>

                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-lg border"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}
                >
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: c.textMuted }}
                    >
                      {heroPrimary.label}
                    </div>
                    <div
                      className="font-mono-num text-2xl sm:text-3xl font-bold mt-1"
                      style={{ color: c.accent }}
                    >
                      {heroPrimary.value}
                    </div>
                    <div className="font-mono-num text-xs mt-1" style={{ color: c.textMuted }}>
                      {heroPrimary.delta} ({heroPrimary.detail})
                    </div>
                  </div>

                  <div>
                    <div
                      className="text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: c.textMuted }}
                    >
                      Executive Thesis
                    </div>
                    <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: c.text }}>
                      {report.narrative.overview}
                    </p>
                  </div>

                  <div>
                    <div
                      className="text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: c.textMuted }}
                    >
                      Closing Takeaway
                    </div>
                    <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: c.text }}>
                      {report.narrative.closingTakeaway}
                    </p>
                  </div>
                </div>

                <div
                  className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t text-xs font-mono-num"
                  style={{ borderColor: c.border, color: c.textMuted }}
                >
                  <span>Prepared by {report.branding.preparedBy}</span>
                  <span>
                    {report.isIllustrative ? 'Illustrative Sample Figures · ' : ''}Published{' '}
                    {report.reportDate} &middot; Theme: {theme.name}
                  </span>
                </div>
              </div>
            ) : null}

            {activeSlide.id === 'scorecard' ? (
              <div className="space-y-6">
                <div
                  className="p-6 sm:p-7 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-6"
                  style={{
                    backgroundColor: c.elevated,
                    borderColor: c.border,
                    borderTopWidth: '3px',
                    borderTopColor: c.accent,
                  }}
                >
                  <div>
                    <div
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: c.textMuted }}
                    >
                      {heroPrimary.label}
                    </div>
                    <div
                      className="font-mono-num text-4xl sm:text-5xl font-bold mt-2 tracking-tight"
                      style={{ color: c.accent }}
                    >
                      {heroPrimary.value}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className="font-mono-num font-bold"
                        style={{ color: heroPrimary.positive ? c.positive : c.critical }}
                      >
                        {heroPrimary.positive ? '▲' : '▼'} {heroPrimary.delta}
                      </span>
                      <span style={{ color: c.textMuted }}>{heroPrimary.detail}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    {trend.hasSufficientData ? (
                      <div className="pl-5 border-l" style={{ borderColor: c.border }}>
                        <div
                          className="text-[11px] uppercase tracking-wider"
                          style={{ color: c.textMuted }}
                        >
                          Rolling {trend.windowMonthsCount}M Momentum
                        </div>
                        <div
                          className="font-mono-num text-xl font-bold mt-1"
                          style={{
                            color:
                              trend.overallSignal === 'Accelerating'
                                ? c.positive
                                : trend.overallSignal === 'Decelerating'
                                  ? c.warning
                                  : c.textMuted,
                          }}
                        >
                          {trend.overallSignal === 'Accelerating'
                            ? '▲'
                            : trend.overallSignal === 'Decelerating'
                              ? '▼'
                              : '—'}{' '}
                          {trend.overallSignal}
                        </div>
                        <div
                          className="font-mono-num text-xs mt-1"
                          style={{ color: c.textMuted }}
                        >
                          {trend.windowPeriodLabel}
                        </div>
                      </div>
                    ) : null}

                    <div className="pl-5 border-l" style={{ borderColor: c.border }}>
                      <div
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: c.textMuted }}
                      >
                        Business Health
                      </div>
                      <div
                        className="text-xl font-bold mt-1"
                        style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                      >
                        {metrics.healthStatus}
                      </div>
                      <div className="font-mono-num text-xs mt-1" style={{ color: c.textMuted }}>
                        {report.reportingPeriod}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    scorecardCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
                  } gap-3.5`}
                >
                  {scorecardCards.map((card) => (
                    <div
                      key={card.label}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: c.surface,
                        borderColor: c.border,
                        borderTopWidth: '2px',
                        borderTopColor: card.good ? c.accent : c.warning,
                      }}
                    >
                      <div
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: c.textMuted }}
                      >
                        {card.label}
                      </div>
                      <div
                        className="font-mono-num text-xl font-bold mt-2"
                        style={{ color: c.text }}
                      >
                        {card.value}
                      </div>
                      <div
                        className="font-mono-num text-xs font-semibold mt-1.5"
                        style={{ color: card.good ? c.positive : c.warning }}
                      >
                        {card.good ? '▲' : '▼'} {card.sub}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSlide.id === 'trajectory' ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                    >
                      {activeSlide.title}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                      {trend.summaryHeadline} — Avg Monthly Revenue:{' '}
                      {formatCurrency(metrics.averageMonthlyRevenue, cur)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: c.textMuted }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 inline-block rounded-xs"
                        style={{ backgroundColor: c.chartRevenue }}
                      />
                      Revenue
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-3.5 inline-block border-t-2 border-dashed"
                        style={{ borderColor: c.accent }}
                      />
                      Rolling 3M Rev Avg
                    </span>
                    {!audience.redactInternalExpenses ? (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 inline-block rounded-xs"
                            style={{ backgroundColor: c.chartExpense }}
                          />
                          Expenses
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-3 h-0.5 inline-block"
                            style={{ backgroundColor: c.chartProfit }}
                          />
                          Net Profit
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}
                >
                  {renderTrajectorySvg()}
                </div>

                {trend.hasSufficientData ? (
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: c.border }}>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr
                          style={{
                            backgroundColor: c.tableHeaderBg,
                            color: c.tableHeaderText,
                          }}
                        >
                          <th className="px-3 py-2 text-left">Metric</th>
                          <th className="px-3 py-2 text-right">{trend.latestMonthLabel}</th>
                          <th className="px-3 py-2 text-right">
                            Rolling {trend.windowMonthsCount}M Avg
                          </th>
                          <th className="px-3 py-2 text-right">Delta vs Avg</th>
                          <th className="px-3 py-2 text-right">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trend.metrics.map((tm) => {
                          const sCol =
                            tm.id === 'expenses'
                              ? tm.signal === 'Accelerating'
                                ? c.warning
                                : tm.signal === 'Decelerating'
                                  ? c.positive
                                  : c.textMuted
                              : tm.signal === 'Accelerating'
                                ? c.positive
                                : tm.signal === 'Decelerating'
                                  ? c.warning
                                  : c.textMuted;
                          return (
                            <tr
                              key={tm.id}
                              style={{
                                backgroundColor: c.surface,
                                borderTop: `1px solid ${c.border}`,
                              }}
                            >
                              <td className="px-3 py-2 font-medium">{tm.label}</td>
                              <td className="px-3 py-2 text-right font-mono-num">
                                {tm.currentMonthFormatted}
                              </td>
                              <td
                                className="px-3 py-2 text-right font-mono-num"
                                style={{ color: c.textMuted }}
                              >
                                {tm.rolling3MoAvgFormatted}
                              </td>
                              <td
                                className="px-3 py-2 text-right font-mono-num font-bold"
                                style={{ color: sCol }}
                              >
                                {tm.deltaFormatted}
                              </td>
                              <td
                                className="px-3 py-2 text-right font-mono-num font-bold"
                                style={{ color: sCol }}
                              >
                                {tm.signal === 'Accelerating'
                                  ? '▲'
                                  : tm.signal === 'Decelerating'
                                    ? '▼'
                                    : '—'}{' '}
                                {tm.signal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSlide.id === 'mix' ? (
              <div className="space-y-6">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                >
                  {activeSlide.title}
                </h2>

                <div
                  className={`grid grid-cols-1 ${
                    audience.redactInternalExpenses ? 'md:grid-cols-1' : 'md:grid-cols-2'
                  } gap-5`}
                >
                  <div
                    className="p-5 rounded-xl border space-y-3"
                    style={{ backgroundColor: c.surface, borderColor: c.border }}
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm font-bold">Revenue Streams</div>
                      <div className="font-mono-num text-xs" style={{ color: c.textMuted }}>
                        Total {formatCurrency(metrics.revenueCategoryTotal, cur)}
                      </div>
                    </div>
                    {metrics.revenueCategoriesComputed.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{item.name}</span>
                          <span className="font-mono-num">
                            {formatCurrency(item.amount, cur)} ({item.sharePct.toFixed(1)}%)
                          </span>
                        </div>
                        <div
                          className="h-2 rounded overflow-hidden"
                          style={{ backgroundColor: c.elevated }}
                        >
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${Math.max(3, item.sharePct)}%`,
                              backgroundColor: c.chartRevenue,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {!audience.redactInternalExpenses ? (
                    <div
                      className="p-5 rounded-xl border space-y-3"
                      style={{ backgroundColor: c.surface, borderColor: c.border }}
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-bold">Operating Cost Drivers</div>
                        <div className="font-mono-num text-xs" style={{ color: c.textMuted }}>
                          Total {formatCurrency(metrics.expenseCategoryTotal, cur)}
                        </div>
                      </div>
                      {metrics.expenseCategoriesComputed.map((item) => (
                        <div key={item.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{item.name}</span>
                            <span className="font-mono-num">
                              {formatCurrency(item.amount, cur)} ({item.sharePct.toFixed(1)}%)
                            </span>
                          </div>
                          <div
                            className="h-2 rounded overflow-hidden"
                            style={{ backgroundColor: c.elevated }}
                          >
                            <div
                              className="h-full rounded"
                              style={{
                                width: `${Math.max(3, item.sharePct)}%`,
                                backgroundColor: c.chartExpense,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {metrics.segmentsComputed.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: c.border }}>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: c.tableHeaderBg, color: c.tableHeaderText }}>
                          <th className="px-3.5 py-2.5 text-left">Operating Segment</th>
                          <th className="px-3.5 py-2.5 text-right">Revenue</th>
                          <th className="px-3.5 py-2.5 text-right">Mix Share</th>
                          <th className="px-3.5 py-2.5 text-right">YoP Growth</th>
                          {!audience.redactInternalExpenses ? (
                            <th className="px-3.5 py-2.5 text-right">Segment Margin</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.segmentsComputed.map((seg) => (
                          <tr
                            key={seg.id}
                            style={{
                              backgroundColor: c.surface,
                              borderTop: `1px solid ${c.border}`,
                            }}
                          >
                            <td className="px-3.5 py-2.5 font-semibold">{seg.name}</td>
                            <td className="px-3.5 py-2.5 text-right font-mono-num">
                              {formatCurrency(seg.revenue, cur)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono-num">
                              {seg.sharePct.toFixed(1)}%
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono-num">
                              {formatPercent(seg.growthPct, { signed: true })}
                            </td>
                            {!audience.redactInternalExpenses ? (
                              <td className="px-3.5 py-2.5 text-right font-mono-num">
                                {seg.marginPct.toFixed(1)}%
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSlide.id === 'story-intelligence' ? (
              <div className="space-y-6">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                >
                  {activeSlide.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {storyChapters.map((ch) => (
                    <div
                      key={ch.step}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: c.surface,
                        borderColor: c.border,
                        borderTopWidth: '2px',
                        borderTopColor: c.accent,
                      }}
                    >
                      <div
                        className="font-mono-num text-[11px] font-bold"
                        style={{ color: c.accent }}
                      >
                        {ch.step}
                      </div>
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: c.textMuted }}>
                        {ch.body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <div
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: c.textMuted }}
                    >
                      Verified Financial Observations
                    </div>
                    {insights.slice(0, 3).map((ins) => (
                      <div
                        key={ins.id}
                        className="p-3.5 rounded-lg border"
                        style={{ backgroundColor: c.surface, borderColor: c.border }}
                      >
                        <div className="flex justify-between text-[11px] font-mono-num">
                          <span style={{ color: c.accent }}>{ins.category}</span>
                          <span style={{ color: c.textMuted }}>{ins.supportingMetric}</span>
                        </div>
                        <div className="text-sm font-bold mt-1">{ins.headline}</div>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: c.textMuted }}>
                          {ins.explanation}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    <div
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: c.textMuted }}
                    >
                      Rule-Derived Advisory Actions
                    </div>
                    {recommendations.slice(0, 3).map((rec, idx) => (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-lg border"
                        style={{ backgroundColor: c.elevated, borderColor: c.border }}
                      >
                        <div className="font-mono-num text-[11px]" style={{ color: c.accent }}>
                          0{idx + 1} &middot; {rec.priority} Priority
                        </div>
                        <div className="text-sm font-bold mt-1">{rec.title}</div>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: c.textMuted }}>
                          {rec.suggestedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSlide.id === 'priorities' ? (
              <div className="space-y-6">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                >
                  {activeSlide.title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.strategicPriorities.map((sp, i) => (
                    <div
                      key={sp.id}
                      className="p-5 rounded-xl border space-y-2"
                      style={{ backgroundColor: c.surface, borderColor: c.border }}
                    >
                      <div className="flex items-center justify-between font-mono-num text-xs">
                        <span style={{ color: c.accent }}>
                          0{i + 1} &middot; {sp.horizon}
                        </span>
                        <span style={{ color: c.textMuted }}>Owner: {sp.owner}</span>
                      </div>
                      <div className="text-base font-bold">{sp.title}</div>
                      <p className="text-xs leading-relaxed" style={{ color: c.textMuted }}>
                        {sp.rationale}
                      </p>
                      <div
                        className="pt-2 border-t text-xs font-mono-num font-semibold"
                        style={{ borderColor: c.border, color: c.text }}
                      >
                        Target Impact: {sp.targetImpact}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="p-5 rounded-xl border"
                  style={{ backgroundColor: c.elevated, borderColor: c.border }}
                >
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: c.accent }}>
                    Closing Executive Takeaway
                  </div>
                  <p className="text-sm mt-2 leading-relaxed">{report.narrative.closingTakeaway}</p>
                  <div className="text-[11px] mt-3 pt-2 border-t" style={{ borderColor: c.border, color: c.textMuted }}>
                    {report.branding.companyName} &middot; {report.branding.preparedBy} &middot;{' '}
                    {report.branding.contactEmail}
                    {audience.showGovernanceDisclaimer ? ` — ${report.branding.disclaimer}` : ''}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSlide.id === 'simulation' && simulation ? (
              <div className="space-y-6">
                <div
                  className="p-5 rounded-xl border border-dashed"
                  style={{ backgroundColor: c.warningBg, borderColor: c.warning }}
                >
                  <div
                    className="font-mono-num text-xs font-bold uppercase tracking-wider"
                    style={{ color: c.warning }}
                  >
                    HYPOTHETICAL WHAT-IF PROJECTION — NON-ACTUAL SCENARIO
                  </div>
                  <h2
                    className="text-2xl font-bold mt-1"
                    style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                  >
                    {simulation.assumptions.scenarioName}
                  </h2>
                  <p className="text-xs mt-1.5" style={{ color: c.textMuted }}>
                    Assumptions applied to reported actuals: Revenue{' '}
                    {simulation.assumptions.revenueDeltaPct >= 0 ? '+' : ''}
                    {simulation.assumptions.revenueDeltaPct}% &middot; OpEx{' '}
                    {simulation.assumptions.expenseDeltaPct >= 0 ? '+' : ''}
                    {simulation.assumptions.expenseDeltaPct}% &middot; Customers{' '}
                    {simulation.assumptions.customerDeltaPct >= 0 ? '+' : ''}
                    {simulation.assumptions.customerDeltaPct}% &middot; ARPU{' '}
                    {simulation.assumptions.arpuDeltaPct >= 0 ? '+' : ''}
                    {simulation.assumptions.arpuDeltaPct}%
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Projected Revenue',
                      val: formatCurrency(simulation.projectedRevenue, cur),
                      actual: formatCurrency(simulation.actualRevenue, cur),
                      variance: formatCurrency(simulation.revenueVariance, cur, { signed: true }),
                    },
                    {
                      label: 'Projected Expenses',
                      val: formatCurrency(simulation.projectedExpenses, cur),
                      actual: formatCurrency(simulation.actualExpenses, cur),
                      variance: formatCurrency(simulation.expenseVariance, cur, { signed: true }),
                    },
                    {
                      label: 'Projected Net Profit',
                      val: formatCurrency(simulation.projectedNetProfit, cur),
                      actual: formatCurrency(simulation.actualNetProfit, cur),
                      variance: formatCurrency(simulation.netProfitVariance, cur, { signed: true }),
                    },
                    {
                      label: 'Projected Margin',
                      val: formatPercent(simulation.projectedMarginPct),
                      actual: formatPercent(simulation.actualMarginPct),
                      variance: `${simulation.marginVariancePts >= 0 ? '+' : ''}${simulation.marginVariancePts.toFixed(1)} pts`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: c.surface, borderColor: c.border }}
                    >
                      <div
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: c.textMuted }}
                      >
                        {item.label} (Simulated)
                      </div>
                      <div className="font-mono-num text-2xl font-bold mt-2" style={{ color: c.accent }}>
                        {item.val}
                      </div>
                      <div className="font-mono-num text-xs mt-1.5" style={{ color: c.textMuted }}>
                        Actual: {item.actual}
                      </div>
                      <div className="font-mono-num text-xs font-bold mt-0.5" style={{ color: c.text }}>
                        Variance: {item.variance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Optional Speaker Notes Strip */}
          {showNotes ? (
            <div
              className="px-6 sm:px-10 py-3.5 border-t text-xs leading-relaxed"
              style={{
                backgroundColor: c.elevated,
                borderColor: c.border,
                color: c.textMuted,
              }}
            >
              <span className="font-mono-num font-bold uppercase mr-2" style={{ color: c.accent }}>
                Speaker Notes:
              </span>
              {activeSlide.speakerNotes}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Slide Navigation Dock */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-[#0B1120] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {slides.map((s, idx) => {
            const active = idx === clampedIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={`px-2.5 py-1.5 rounded-md font-mono-num text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D4FF33] text-[#0B1120] font-bold'
                    : 'bg-[#111A2E] text-slate-300 hover:bg-[#17223B]'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden lg:inline font-mono-num text-[11px] text-slate-400 mr-2">
            Keys: ← / → navigate · N notes · Esc exit
          </span>
          <button
            type="button"
            disabled={clampedIndex === 0}
            onClick={goPrev}
            aria-label="Previous slide"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-700 bg-[#111A2E] text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            disabled={clampedIndex === slides.length - 1}
            onClick={goNext}
            aria-label="Next slide"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#D4FF33] text-[#0B1120] text-xs font-bold hover:brightness-95 disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
