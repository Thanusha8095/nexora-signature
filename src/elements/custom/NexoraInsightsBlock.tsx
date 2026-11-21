import {
  Column,
  Divider,
  Grid,
  Heading,
  LineBreak,
  Row,
  Span,
  Table,
  TableCell,
  TableRow,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getAudienceEdition } from '../../core/audiences.ts';
import { computeTrendAnalysis, filterTrendForAudience } from '../../core/intelligence.ts';
import { getThemeRadiusPx, resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload, signalHexColor, signalSymbol } from './shared.ts';

/**
 * 7. NexoraInsightsBlock — Rolling 3-Month Trend Analysis + Verified Observations + Strategic Recommendations
 */
export const NexoraInsightsBlock = defineElement({
  type: 'nexora.InsightsBlock',
  label: 'NEXORA Executive Intelligence',
  description:
    'Deterministic Rolling 3-Month Trend Analysis table, verified financial observations with formula traces, and analytical recommendations.',
  props: {
    payloadJson: prop.text({ label: 'Report Payload JSON', required: true }),
    target: prop.choice(['email', 'web', 'document', 'canvas'], {
      label: 'Render Target',
      default: 'web',
    }),
    part: prop.choice(['all', 'trend-observations', 'recommendations'], {
      label: 'Document Section Split',
      default: 'all',
    }),
  },
  render: ({ payloadJson, target, part }) => {
    const data = parsePayload(payloadJson);
    if (!data) {
      return (
        <Column style={{ padding: 12 }}>
          <Text>Invalid report payload</Text>
        </Column>
      );
    }

    const showTrendAndObservations = part !== 'recommendations';
    const showRecommendations = part !== 'trend-observations';
    const { report, metrics, insights, recommendations } = data;
    const theme = resolveBrandTheme(report);
    const audience = getAudienceEdition(report.audienceEdition);
    const c = theme.colors;
    const radius = getThemeRadiusPx(theme, 'md');
    const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
    const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
    const windowLabel = trend.windowMonthsCount < 3 ? `${trend.windowMonthsCount}-Month` : '3-Month';
    const overallColor = signalHexColor(trend.overallSignal, c);
    const isCompact = target === 'email' || target === 'canvas';
    const emailMono = 'monospace';
    const observationsHeading = audience.redactInternalExpenses
      ? 'Verified Partner Highlights'
      : audience.id === 'investor'
        ? 'Unit Economics & Growth Signals'
        : 'Verified Financial Observations';
    const recsHeading =
      audience.id === 'ceo'
        ? 'Executive Operating Actions'
        : audience.id === 'investor'
          ? 'Value-Creation Catalysts'
          : audience.id === 'team'
            ? 'Team Operating Priorities'
            : 'Analytical Recommendations';

    if (target === 'email') {
      return (
        <Column style={{ gap: 14 }}>
          {trend.hasSufficientData ? (
            <Column
              style={{
                backgroundColor: c.surface,
                border: { width: 1, style: 'solid', color: c.border },
                borderRadius: radius,
                padding: [16, 16],
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: emailMono,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: c.accentInk,
                }}
              >
                {`Trend Analysis · Rolling ${windowLabel} Benchmark (${trend.windowPeriodLabel})`}
              </Text>
              <Heading level={3} style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
                {trend.summaryHeadline}
              </Heading>
              <Text style={{ fontSize: 12, lineHeight: 1.5, color: c.textMuted }}>
                {trend.summaryNarrative}
              </Text>
              <Table
                style={{
                  backgroundColor: c.canvas,
                  border: { width: 1, style: 'solid', color: c.border },
                  cellPadding: [6, 7],
                  rowBorder: { width: 1, style: 'solid', color: c.border },
                  fontSize: 11,
                }}
              >
                <TableRow header style={{ backgroundColor: c.tableHeaderBg, color: c.tableHeaderText }}>
                  <TableCell style={{ fontWeight: 700 }}>Metric</TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>
                    {trend.latestMonthLabel}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>
                    {`Rolling ${windowLabel} Avg`}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Variance</TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Signal</TableCell>
                </TableRow>
                {trend.metrics.map((tm) => {
                  const sColor = signalHexColor(tm.signal, c, tm.id);
                  return (
                    <TableRow key={tm.id} style={{ color: c.text }}>
                      <TableCell style={{ fontWeight: 600 }}>{tm.label}</TableCell>
                      <TableCell style={{ textAlign: 'right', fontFamily: theme.typography.monoFont }}>
                        {tm.currentMonthFormatted}
                      </TableCell>
                      <TableCell
                        style={{
                          textAlign: 'right',
                          fontFamily: theme.typography.monoFont,
                          color: c.textMuted,
                        }}
                      >
                        {tm.rolling3MoAvgFormatted}
                      </TableCell>
                      <TableCell
                        style={{
                          textAlign: 'right',
                          fontFamily: theme.typography.monoFont,
                          fontWeight: 700,
                          color: sColor,
                        }}
                      >
                        {tm.deltaFormatted}
                      </TableCell>
                      <TableCell
                        style={{
                          textAlign: 'right',
                          fontFamily: theme.typography.monoFont,
                          fontWeight: 700,
                          color: sColor,
                        }}
                      >
                        {`${signalSymbol(tm.signal)} ${tm.signal}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            </Column>
          ) : null}

          <Column
            style={{
              backgroundColor: c.surface,
              border: { width: 1, style: 'solid', color: c.border },
              borderRadius: radius,
              padding: [16, 16],
              gap: 8,
            }}
          >
            <Heading level={3} style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
              {observationsHeading}
            </Heading>
            <Table
              style={{
                cellPadding: [8, 4],
                rowBorder: { width: 1, style: 'solid', color: c.border },
                fontSize: 12,
              }}
            >
              {insights.map((ins) => {
                const sevColor =
                  ins.severity === 'positive'
                    ? c.positive
                    : ins.severity === 'critical'
                      ? c.critical
                      : ins.severity === 'warning'
                        ? c.warning
                        : c.textMuted;
                return (
                  <TableRow key={ins.id}>
                    <TableCell>
                      <Span
                        style={{
                          fontFamily: theme.typography.monoFont,
                          fontSize: 10,
                          fontWeight: 700,
                          color: sevColor,
                          textTransform: 'uppercase',
                        }}
                      >
                        {`${ins.category} · ${ins.supportingMetric}`}
                      </Span>
                      <LineBreak />
                      <Span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                        {ins.headline}
                      </Span>
                      <LineBreak />
                      <Span style={{ fontSize: 12, color: c.textMuted }}>{ins.explanation}</Span>
                      {ins.ruleTriggered ? (
                        <>
                          <LineBreak />
                          <Span
                            style={{
                              fontFamily: theme.typography.monoFont,
                              fontSize: 10,
                              color: c.textMuted,
                            }}
                          >
                            {`Rule: ${ins.ruleTriggered}${ins.formulaTrace ? ` | Formula: ${ins.formulaTrace}` : ''}`}
                          </Span>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          </Column>

          <Column
            style={{
              backgroundColor: c.elevated,
              border: { width: 1, style: 'solid', color: c.border },
              borderRadius: radius,
              padding: [16, 16],
              gap: 8,
            }}
          >
            <Heading level={3} style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
              {recsHeading}
            </Heading>
            <Table
              style={{
                cellPadding: [8, 4],
                rowBorder: { width: 1, style: 'solid', color: c.border },
                fontSize: 12,
              }}
            >
              {recommendations.map((rec, i) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    <Span
                      style={{
                        fontFamily: theme.typography.monoFont,
                        fontSize: 10,
                        fontWeight: 700,
                        color: c.accentInk,
                      }}
                    >
                      {`0${i + 1} · ${rec.priority} Priority · ${rec.basis}`}
                    </Span>
                    <LineBreak />
                    <Span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                      {rec.title}
                    </Span>
                    <LineBreak />
                    <Span style={{ fontSize: 12, color: c.textMuted }}>
                      {rec.suggestedAction}
                    </Span>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </Column>
        </Column>
      );
    }

    return (
      <Column style={{ gap: 18 }}>
        {showTrendAndObservations && trend.hasSufficientData ? (
          <Column
            style={{
              backgroundColor: c.surface,
              border: { width: 1, style: 'solid', color: c.border },
              borderRadius: radius,
              padding: isCompact ? [18, 18] : [22, 24],
              gap: 14,
            }}
          >
            <Row stackOnMobile={true} style={{ gap: 12, alignItems: 'center' }}>
              <Column style={{ flex: 2, gap: 4 }}>
                <Text
                  style={{
                    fontFamily: theme.typography.monoFont,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.0,
                    textTransform: 'uppercase',
                    color: c.accentInk,
                  }}
                >
                  {`Trend Analysis · Rolling ${windowLabel} Benchmark (${trend.windowPeriodLabel})`}
                </Text>
                <Heading
                  level={3}
                  style={{
                    fontFamily: theme.typography.headingFont,
                    fontSize: isCompact ? 16 : 18,
                    fontWeight: 700,
                    color: c.text,
                  }}
                >
                  {trend.summaryHeadline}
                </Heading>
                <Text
                  style={{
                    fontFamily: theme.typography.bodyFont,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: c.textMuted,
                  }}
                >
                  {trend.summaryNarrative}
                </Text>
              </Column>
              <Column style={{ width: 150, flex: 'none', gap: 3 }}>
                <Text
                  style={{
                    fontFamily: theme.typography.monoFont,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    color: c.textMuted,
                    textAlign: 'right',
                    ...(target === 'web' ? { mobile: { textAlign: 'left' } } : {}),
                  }}
                >
                  Overall Momentum
                </Text>
                <Text
                  style={{
                    fontFamily: theme.typography.monoFont,
                    fontSize: 15,
                    fontWeight: 700,
                    color: overallColor,
                    textAlign: 'right',
                    ...(target === 'web' ? { mobile: { textAlign: 'left' } } : {}),
                  }}
                >
                  {`${signalSymbol(trend.overallSignal)} ${trend.overallSignal}`}
                </Text>
              </Column>
            </Row>

            <Table
              style={{
                backgroundColor: c.canvas,
                border: { width: 1, style: 'solid', color: c.border },
                cellPadding: isCompact ? [7, 8] : [9, 11],
                rowBorder: { width: 1, style: 'solid', color: c.border },
                fontSize: isCompact ? 11 : 12,
              }}
            >
              <TableRow header style={{ backgroundColor: c.tableHeaderBg, color: c.tableHeaderText }}>
                <TableCell style={{ fontWeight: 700 }}>Metric</TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>
                  {trend.latestMonthLabel}
                </TableCell>
                {!isCompact ? (
                  <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Period Pace</TableCell>
                ) : null}
                <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>
                  {`Rolling ${windowLabel} Avg`}
                </TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Variance</TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Signal</TableCell>
              </TableRow>
              {trend.metrics.map((tm) => {
                const sColor = signalHexColor(tm.signal, c, tm.id);
                return (
                  <TableRow key={tm.id} style={{ color: c.text }}>
                    <TableCell style={{ fontWeight: 600 }}>{tm.label}</TableCell>
                    <TableCell
                      style={{
                        textAlign: 'right',
                        fontFamily: theme.typography.monoFont,
                        fontWeight: 600,
                      }}
                    >
                      {tm.currentMonthFormatted}
                    </TableCell>
                    {!isCompact ? (
                      <TableCell
                        style={{
                          textAlign: 'right',
                          fontFamily: theme.typography.monoFont,
                          color: c.textMuted,
                        }}
                      >
                        {tm.periodPaceFormatted}
                      </TableCell>
                    ) : null}
                    <TableCell
                      style={{
                        textAlign: 'right',
                        fontFamily: theme.typography.monoFont,
                        color: c.textMuted,
                      }}
                    >
                      {tm.rolling3MoAvgFormatted}
                    </TableCell>
                    <TableCell
                      style={{
                        textAlign: 'right',
                        fontFamily: theme.typography.monoFont,
                        fontWeight: 700,
                        color: sColor,
                      }}
                    >
                      {tm.deltaFormatted}
                    </TableCell>
                    <TableCell
                      style={{
                        textAlign: 'right',
                        fontFamily: theme.typography.monoFont,
                        fontWeight: 700,
                        color: sColor,
                      }}
                    >
                      {`${signalSymbol(tm.signal)} ${tm.signal}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>

            {trend.windowMonthsCount < 3 ? (
              <Text
                style={{
                  fontFamily: theme.typography.monoFont,
                  fontSize: 11,
                  color: c.textMuted,
                }}
              >
                {`Note: Rolling benchmark currently averages ${trend.windowMonthsCount} available monthly data points; add 3+ months for a full 3-month rolling average.`}
              </Text>
            ) : null}
          </Column>
        ) : null}

        {showTrendAndObservations ? (
          <Column
            style={{
              backgroundColor: c.surface,
              border: { width: 1, style: 'solid', color: c.border },
              borderRadius: radius,
              padding: isCompact ? [18, 18] : [22, 24],
              gap: 14,
            }}
          >
          <Row stackOnMobile={true} style={{ gap: 8, alignItems: 'center' }}>
            <Column style={{ flex: 1 }}>
              <Heading
                level={3}
                style={{
                  fontFamily: theme.typography.headingFont,
                  fontSize: isCompact ? 16 : 18,
                  fontWeight: 600,
                  color: c.text,
                }}
              >
                {observationsHeading}
              </Heading>
            </Column>
            <Column style={{ flex: 'none' }}>
              <Text style={{ fontSize: 12, color: c.textMuted }}>
                Transparent deterministic rules over period actuals
              </Text>
            </Column>
          </Row>

          <Grid columns={2} stackOnMobile={true} style={{ gap: 14, rowGap: 14 }}>
            {insights.map((ins) => {
              const sevColor =
                ins.severity === 'positive'
                  ? c.positive
                  : ins.severity === 'critical'
                    ? c.critical
                    : ins.severity === 'warning'
                      ? c.warning
                      : c.textMuted;

              return (
                <Column
                  key={ins.id}
                  style={{
                    backgroundColor: c.canvas,
                    border: { width: 1, style: 'solid', color: c.border },
                    borderRadius: radius,
                    padding: [14, 16],
                    gap: 8,
                  }}
                >
                  <Row stackOnMobile={false} style={{ gap: 8, alignItems: 'center' }}>
                    <Column style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: theme.typography.monoFont,
                          fontSize: 11,
                          fontWeight: 700,
                          color: sevColor,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ins.category}
                      </Text>
                    </Column>
                    <Column style={{ flex: 'none' }}>
                      <Text
                        style={{
                          fontFamily: theme.typography.monoFont,
                          fontSize: 11,
                          color: c.textMuted,
                        }}
                      >
                        {ins.supportingMetric}
                      </Text>
                    </Column>
                  </Row>

                  <Text
                    style={{
                      fontFamily: theme.typography.bodyFont,
                      fontSize: 14,
                      fontWeight: 700,
                      color: c.text,
                    }}
                  >
                    {ins.headline}
                  </Text>

                  <Text
                    style={{
                      fontFamily: theme.typography.bodyFont,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: c.textMuted,
                    }}
                  >
                    {ins.explanation}
                  </Text>

                  {ins.ruleTriggered ? (
                    <Column style={{ gap: 5 }}>
                      <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border } }} />
                      <Text
                        style={{
                          fontFamily: theme.typography.monoFont,
                          fontSize: 10,
                          lineHeight: 1.4,
                          color: c.textMuted,
                        }}
                      >
                        {`Rule: ${ins.ruleTriggered}${ins.formulaTrace ? ` | Calc: ${ins.formulaTrace}` : ''}`}
                      </Text>
                    </Column>
                  ) : null}
                </Column>
              );
            })}
          </Grid>
        </Column>
        ) : null}

        {showRecommendations ? (
          <Column
            style={{
              backgroundColor: c.elevated,
              border: { width: 1, style: 'solid', color: c.border },
              borderRadius: radius,
              padding: isCompact ? [18, 18] : [22, 24],
              gap: 12,
            }}
          >
          <Row stackOnMobile={true} style={{ gap: 8, alignItems: 'center' }}>
            <Column style={{ flex: 1 }}>
              <Heading
                level={3}
                style={{
                  fontFamily: theme.typography.headingFont,
                  fontSize: isCompact ? 16 : 18,
                  fontWeight: 600,
                  color: c.text,
                }}
              >
                {recsHeading}
              </Heading>
            </Column>
            <Column style={{ flex: 'none' }}>
              <Text style={{ fontSize: 12, color: c.textMuted }}>
                Advisory actions distinct from reported actuals
              </Text>
            </Column>
          </Row>

          <Column style={{ gap: 10 }}>
            {recommendations.map((rec, idx) => (
              <Column
                key={rec.id}
                style={{
                  backgroundColor: c.surface,
                  border: { width: 1, style: 'solid', color: c.border },
                  borderRadius: radius,
                  padding: [14, 16],
                  gap: 5,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.typography.monoFont,
                    fontSize: 11,
                    fontWeight: 700,
                    color: c.accentInk,
                  }}
                >
                  {`0${idx + 1} · ${rec.priority} Priority · ${rec.basis}`}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.typography.bodyFont,
                    fontSize: 14,
                    fontWeight: 700,
                    color: c.text,
                  }}
                >
                  {rec.title}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.typography.bodyFont,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: c.textMuted,
                  }}
                >
                  {`${rec.rationale} ${rec.suggestedAction}`}
                </Text>
              </Column>
            ))}
          </Column>
        </Column>
        ) : null}
      </Column>
    );
  },
});
