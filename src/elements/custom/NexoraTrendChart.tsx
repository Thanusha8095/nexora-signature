import {
  Circle,
  Column,
  Heading,
  Line,
  Rect,
  Row,
  Span,
  Svg,
  Table,
  TableCell,
  TableRow,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getAudienceEdition } from '../../core/audiences.ts';
import { formatCurrency } from '../../core/calculations.ts';
import { computeTrendAnalysis } from '../../core/intelligence.ts';
import { getThemeRadiusPx, resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload } from './shared.ts';

interface DashSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function buildDashedSegments(
  points: { x: number; y: number }[],
  dashLen = 7,
  gapLen = 5
): DashSegment[] {
  const segments: DashSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) continue;
    const ux = dx / dist;
    const uy = dy / dist;
    let t = 0;
    while (t < dist) {
      const end = Math.min(dist, t + dashLen);
      segments.push({
        x1: Number((a.x + ux * t).toFixed(1)),
        y1: Number((a.y + uy * t).toFixed(1)),
        x2: Number((a.x + ux * end).toFixed(1)),
        y2: Number((a.y + uy * end).toFixed(1)),
      });
      t += dashLen + gapLen;
    }
  }
  return segments;
}

/**
 * 5. NexoraTrendChart — Native Proportional Bars in Email, Native <Svg> Multi-Series Chart in Web/Document/Canvas
 */
export const NexoraTrendChart = defineElement({
  type: 'nexora.TrendChart',
  label: 'NEXORA Monthly Trend Chart',
  description:
    'Monthly financial trajectory featuring proportional email bars and native SVG Revenue/Expenses bars, Rolling 3M Avg benchmark, and Net Profit curve.',
  props: {
    payloadJson: prop.text({ label: 'Report Payload JSON', required: true }),
    target: prop.choice(['email', 'web', 'document', 'canvas'], {
      label: 'Render Target',
      default: 'web',
    }),
  },
  render: ({ payloadJson, target }) => {
    const data = parsePayload(payloadJson);
    if (!data) {
      return (
        <Column style={{ padding: 12 }}>
          <Text>Invalid report payload</Text>
        </Column>
      );
    }

    const { report, metrics } = data;
    const theme = resolveBrandTheme(report);
    const audience = getAudienceEdition(report.audienceEdition);
    const c = theme.colors;
    const cur = report.currency;
    const series = metrics.monthlyWithProfit;
    const redact = audience.redactInternalExpenses;
    const radius = getThemeRadiusPx(theme, 'md');

    if (series.length === 0) {
      return (
        <Column style={{ padding: 14, backgroundColor: c.surface, borderRadius: radius }}>
          <Text style={{ color: c.textMuted }}>No monthly financial series provided.</Text>
        </Column>
      );
    }

    if (target === 'email') {
      const maxVal = Math.max(
        ...series.map((m) => (redact ? m.revenue : Math.max(m.revenue, m.expenses))),
        1
      );

      return (
        <Column
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: radius,
            padding: [16, 18],
            gap: 10,
          }}
        >
          <Column style={{ gap: 3 }}>
            <Heading
              level={3}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: c.text,
              }}
            >
              {redact ? 'Monthly Revenue Trajectory Sparkline' : 'Monthly Revenue vs. Expenses Sparkline'}
            </Heading>
            <Text style={{ fontSize: 11, color: c.textMuted }}>
              {redact
                ? 'Bar: Monthly Revenue · Right: Period Revenue'
                : 'Rev / Exp proportional sparkline · Right: Revenue / Net Profit'}
            </Text>
          </Column>

          <Table
            style={{
              cellPadding: [5, 4],
              rowBorder: { width: 1, style: 'solid', color: c.border },
              fontSize: 11,
            }}
          >
            <TableRow header style={{ color: c.textMuted }}>
              <TableCell style={{ width: 64, fontWeight: 700 }}>Month</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Trajectory</TableCell>
              <TableCell style={{ width: 142, textAlign: 'right', fontWeight: 700 }}>
                {redact ? 'Revenue' : 'Rev / Net Profit'}
              </TableCell>
            </TableRow>
            {series.map((m) => {
              const revBars =
                m.revenue <= 0 ? 0 : Math.max(1, Math.min(16, Math.round((m.revenue / maxVal) * 16)));
              const expBars =
                m.expenses <= 0
                  ? 0
                  : Math.max(1, Math.min(16, Math.round((m.expenses / maxVal) * 16)));
              return (
                <TableRow key={m.month}>
                  <TableCell style={{ fontFamily: theme.typography.monoFont, color: c.text }}>
                    {m.month}
                  </TableCell>
                  <TableCell style={{ fontFamily: theme.typography.monoFont, fontSize: 11 }}>
                    <Span style={{ color: revBars > 0 ? c.chartRevenue : c.textMuted }}>
                      {revBars > 0 ? '█'.repeat(revBars) : '—'}
                    </Span>
                    {!redact ? (
                      <Span style={{ color: expBars > 0 ? c.chartExpense : c.textMuted }}>
                        {` / ${expBars > 0 ? '▓'.repeat(expBars) : '—'}`}
                      </Span>
                    ) : null}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: 'right',
                      fontFamily: theme.typography.monoFont,
                      color: c.text,
                    }}
                  >
                    {formatCurrency(m.revenue, cur, { compact: true })}
                    {!redact ? (
                      <Span style={{ color: c.textMuted }}>
                        {` / ${formatCurrency(m.netProfit, cur, { compact: true })}`}
                      </Span>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </Column>
      );
    }

    // Native SVG vector chart for Page (Web), Document (Print/PDF), and Canvas (PNG/SVG)
    const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
    const rollingPts = rawTrend.rollingSeries;

    const svgW = target === 'document' ? 580 : 660;
    const svgH = 200;
    const padTop = 14;
    const padBottom = 10;
    const plotH = svgH - padTop - padBottom;

    const rawVals = series.flatMap((m) =>
      redact ? [m.revenue] : [m.revenue, m.expenses, m.netProfit]
    );
    const maxPositive = Math.max(...rawVals, 1) * 1.12;
    const minNegative = redact ? 0 : Math.min(0, ...series.map((m) => m.netProfit));
    const minVal = minNegative < 0 ? minNegative * 1.15 : 0;
    const valSpan = Math.max(maxPositive - minVal, 1);

    const yForVal = (v: number): number =>
      padTop + plotH - ((v - minVal) / valSpan) * plotH;
    const zeroY = yForVal(0);

    const groupW = svgW / series.length;
    const barW = Math.min(30, Math.max(8, groupW * (redact ? 0.42 : 0.28)));

    const gridYs = [0, 0.25, 0.5, 0.75, 1].map((r) => yForVal(minVal + valSpan * r));
    const yTickValues = [maxPositive, minVal + valSpan * 0.5, minVal];

    const rollingCoords = rollingPts.map((pt, idx) => ({
      x: idx * groupW + groupW / 2,
      y: yForVal(pt.rolling3MoRevenueAvg),
    }));
    const rollingDashes =
      series.length > 1 ? buildDashedSegments(rollingCoords, 7, 5) : [];

    const profitCoords = series.map((m, idx) => ({
      x: Number((idx * groupW + groupW / 2).toFixed(1)),
      y: Number(yForVal(m.netProfit).toFixed(1)),
    }));
    const profitSegments = profitCoords.slice(0, -1).map((p, idx) => ({
      x1: p.x,
      y1: p.y,
      x2: profitCoords[idx + 1].x,
      y2: profitCoords[idx + 1].y,
    }));

    const revPeak = metrics.bestRevenueMonth ?? metrics.bestMonth;
    const showDenseLabels = series.length > 6;

    return (
      <Column
        style={{
          backgroundColor: c.surface,
          border: { width: 1, style: 'solid', color: c.border },
          borderRadius: radius,
          padding: [20, 22],
          gap: 14,
        }}
      >
        <Row stackOnMobile={true} style={{ gap: 12, alignItems: 'center' }}>
          <Column style={{ flex: 2, gap: 4 }}>
            <Heading
              level={3}
              style={{
                fontFamily: theme.typography.headingFont,
                fontSize: 17,
                fontWeight: 600,
                color: c.text,
              }}
            >
              {redact
                ? 'Monthly Revenue Trajectory'
                : 'Monthly Revenue, Expenses & Net Profit Trajectory'}
            </Heading>
            <Text
              style={{
                fontFamily: theme.typography.bodyFont,
                fontSize: 12,
                color: c.textMuted,
              }}
            >
              {`Average monthly revenue: ${formatCurrency(metrics.averageMonthlyRevenue, cur)}${
                redact
                  ? ''
                  : ` · Average net profit: ${formatCurrency(metrics.averageMonthlyProfit, cur)}`
              }`}
            </Text>
          </Column>

          <Column style={{ width: redact ? 220 : 320, flex: 'none', gap: 4 }}>
            <Text
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: 11,
                color: c.textMuted,
                textAlign: 'right',
                ...(target === 'web' ? { mobile: { textAlign: 'left' } } : {}),
              }}
            >
              <Span style={{ color: c.chartRevenue, fontWeight: 700 }}>■ Revenue</Span>
              {series.length > 1 ? (
                <Span style={{ color: c.accentInk, fontWeight: 700 }}>{'  -- Rolling 3M Avg'}</Span>
              ) : null}
              {!redact ? (
                <Span style={{ color: c.chartExpense, fontWeight: 700 }}>{'  ■ Expenses'}</Span>
              ) : null}
              {!redact ? (
                <Span style={{ color: c.chartProfit, fontWeight: 700 }}>{'  ● Net Profit'}</Span>
              ) : null}
            </Text>
          </Column>
        </Row>

        <Row stackOnMobile={false} style={{ gap: 8, alignItems: 'stretch' }}>
          <Column
            style={{
              width: 64,
              flex: 'none',
              justifyContent: 'space-between',
              padding: [Math.max(2, padTop - 4), 0, Math.max(2, padBottom - 4), 0],
            }}
          >
            {yTickValues.map((val, idx) => (
              <Text
                key={idx}
                style={{
                  fontFamily: theme.typography.monoFont,
                  fontSize: 10,
                  color: c.textMuted,
                  textAlign: 'right',
                }}
              >
                {formatCurrency(val, cur, { compact: true })}
              </Text>
            ))}
          </Column>

          <Column style={{ flex: 1, gap: 6 }}>
            <Svg
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              title="Monthly Financial Trajectory chart"
            >
              {gridYs.map((gy, idx) => (
                <Line
                  key={`grid-${idx}`}
                  x1={0}
                  y1={Number(gy.toFixed(1))}
                  x2={svgW}
                  y2={Number(gy.toFixed(1))}
                  style={{ stroke: c.border, strokeWidth: 1, opacity: 0.55 }}
                />
              ))}

              {minVal < 0 ? (
                <Line
                  x1={0}
                  y1={Number(zeroY.toFixed(1))}
                  x2={svgW}
                  y2={Number(zeroY.toFixed(1))}
                  style={{ stroke: c.textMuted, strokeWidth: 1.2 }}
                />
              ) : null}

              {series.map((m, idx) => {
                const revVal = Math.max(0, m.revenue);
                if (revVal <= 0) return null;
                const cx = idx * groupW + groupW / 2;
                const revTopY = yForVal(revVal);
                const revH = Math.max(2, zeroY - revTopY);

                if (redact) {
                  return (
                    <Rect
                      key={`rev-${m.month}`}
                      x={Number((cx - barW / 2).toFixed(1))}
                      y={Number(revTopY.toFixed(1))}
                      width={Number(barW.toFixed(1))}
                      height={Number(revH.toFixed(1))}
                      rx={3}
                      style={{ fill: c.chartRevenue }}
                    />
                  );
                }

                return (
                  <Rect
                    key={`rev-${m.month}`}
                    x={Number((cx - barW - 2).toFixed(1))}
                    y={Number(revTopY.toFixed(1))}
                    width={Number(barW.toFixed(1))}
                    height={Number(revH.toFixed(1))}
                    rx={3}
                    style={{ fill: c.chartRevenue }}
                  />
                );
              })}

              {!redact
                ? series.map((m, idx) => {
                    const expVal = Math.max(0, m.expenses);
                    if (expVal <= 0) return null;
                    const cx = idx * groupW + groupW / 2;
                    const expTopY = yForVal(expVal);
                    const expH = Math.max(2, zeroY - expTopY);
                    return (
                      <Rect
                        key={`exp-${m.month}`}
                        x={Number((cx + 2).toFixed(1))}
                        y={Number(expTopY.toFixed(1))}
                        width={Number(barW.toFixed(1))}
                        height={Number(expH.toFixed(1))}
                        rx={3}
                        style={{ fill: c.chartExpense, opacity: 0.88 }}
                      />
                    );
                  })
                : null}

              {rollingDashes.map((seg, idx) => (
                <Line
                  key={`roll-${idx}`}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  style={{ stroke: c.accent, strokeWidth: 2 }}
                />
              ))}

              {!redact && series.length > 1
                ? profitSegments.map((seg, idx) => (
                    <Line
                      key={`profit-${idx}`}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      style={{ stroke: c.chartProfit, strokeWidth: 2.2 }}
                    />
                  ))
                : null}

              {!redact
                ? profitCoords.map((p, idx) => (
                    <Circle
                      key={`dot-${idx}`}
                      cx={Number(p.x.toFixed(1))}
                      cy={Number(p.y.toFixed(1))}
                      r={4}
                      style={{
                        fill: c.surface,
                        stroke: c.chartProfit,
                        strokeWidth: 2.5,
                      }}
                    />
                  ))
                : null}
            </Svg>

            <Row stackOnMobile={false} style={{ gap: 2 }}>
              {series.map((m, idx) => (
                <Column key={`lbl-${m.month}-${idx}`} style={{ flex: 1, alignItems: 'center', gap: 1 }}>
                  <Text
                    style={{
                      fontFamily: theme.typography.monoFont,
                      fontSize: showDenseLabels ? 9 : 10,
                      fontWeight: 700,
                      color: c.text,
                      textAlign: 'center',
                    }}
                  >
                    {showDenseLabels ? m.month.slice(0, 3) : m.month}
                  </Text>
                  {series.length <= 8 ? (
                    <Text
                      style={{
                        fontFamily: theme.typography.monoFont,
                        fontSize: 9,
                        color: c.textMuted,
                        textAlign: 'center',
                      }}
                    >
                      {formatCurrency(m.revenue, cur, { compact: true })}
                    </Text>
                  ) : null}
                </Column>
              ))}
            </Row>
          </Column>
        </Row>

        {revPeak ? (
          <Text
            style={{
              fontFamily: theme.typography.monoFont,
              fontSize: 11,
              color: c.textMuted,
            }}
          >
            {`Peak revenue month: ${revPeak.month} (${formatCurrency(revPeak.revenue, cur, { compact: true })})${
              !redact && metrics.bestMonth
                ? ` · Best profit month: ${metrics.bestMonth.month} (${formatCurrency(metrics.bestMonth.netProfit, cur, { compact: true })})`
                : ''
            }`}
          </Text>
        ) : null}
      </Column>
    );
  },
});
