import {
  Column,
  Grid,
  Heading,
  Row,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getAudienceEdition } from '../../core/audiences.ts';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../../core/calculations.ts';
import { computeTrendAnalysis, filterTrendForAudience } from '../../core/intelligence.ts';
import { resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload } from './shared.ts';

/**
 * 4. NexoraStoryArc — Four-Beat Financial Storytelling Narrative Bridge
 */
export const NexoraStoryArc = defineElement({
  type: 'nexora.StoryArc',
  label: 'NEXORA Executive Story Arc',
  description:
    'Four-beat deterministic financial narrative connecting scale, rolling 3M momentum, operating leverage, and forward mandate.',
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
    const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
    const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
    const revTrend = trend.metrics.find((m) => m.id === 'revenue');

    const spreadText =
      metrics.bestMonth && metrics.worstMonth && metrics.bestMonth.month !== metrics.worstMonth.month
        ? ` Intra-period monthly revenue spanned ${formatCurrency(metrics.worstMonth.revenue, cur, { compact: true })} (${metrics.worstMonth.month}) to ${formatCurrency(metrics.bestMonth.revenue, cur, { compact: true })} (${metrics.bestMonth.month}).`
        : '';

    const chapters = [
      {
        step: '01 · Scale & Demand',
        body: `${report.branding.companyName} recorded ${formatCurrency(report.currentPeriod.revenue, cur)} in revenue (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) across ${formatNumber(report.currentPeriod.customerCount)} accounts.`,
      },
      {
        step: `02 · Rolling ${trend.windowMonthsCount || 3}M Momentum`,
        body:
          trend.hasSufficientData && revTrend
            ? `${trend.overallSignal} signal: ${trend.latestMonthLabel} (${revTrend.currentMonthFormatted}) tracked ${revTrend.deltaFormatted} against the ${revTrend.rolling3MoAvgFormatted} trailing baseline.${spreadText}`
            : `Peak monthly velocity occurred in ${metrics.bestMonth?.month ?? 'the period'} at ${formatCurrency(metrics.bestMonth?.revenue ?? 0, cur)}.`,
      },
      {
        step: audience.redactInternalExpenses ? '03 · Account Expansion' : '03 · Operating Leverage',
        body: audience.redactInternalExpenses
          ? `Account economics reached ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'} revenue per customer (${formatPercent(metrics.arpuGrowthPct, { signed: true })} YoP).`
          : `Cost discipline yielded ${formatCurrency(metrics.netProfit, cur)} net profit at a ${formatPercent(metrics.profitMarginPct)} margin (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift; OpEx ratio ${metrics.operatingExpenseRatioPct.toFixed(1)}%).`,
      },
      {
        step: '04 · Forward Mandate',
        body: report.strategicPriorities[0]
          ? `${report.strategicPriorities[0].title} (${report.strategicPriorities[0].owner}) — targeting ${report.strategicPriorities[0].targetImpact}.`
          : report.narrative.closingTakeaway,
      },
    ];

    return (
      <Column
        style={{
          backgroundColor: c.surface,
          border: { width: 1, style: 'solid', color: c.border },
          borderRadius: 8,
          padding: target === 'email' ? [18, 18] : [22, 24],
          gap: 14,
        }}
      >
        <Row stackOnMobile={true} style={{ gap: 8, alignItems: 'center' }}>
          <Column style={{ flex: 1 }}>
            <Heading
              level={3}
              style={{
                fontFamily: theme.typography.headingFont,
                fontSize: 17,
                fontWeight: 600,
                color: c.text,
              }}
            >
              Executive Story Arc
            </Heading>
          </Column>
          <Column style={{ flex: 'none' }}>
            <Text
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: 11,
                color: c.accent,
              }}
            >
              {`${audience.name} · ${report.reportingPeriod}`}
            </Text>
          </Column>
        </Row>

        <Grid
          columns={target === 'email' ? 2 : 4}
          stackOnMobile={true}
          style={{ gap: 14, rowGap: 14 }}
        >
          {chapters.map((ch) => (
            <Column
              key={ch.step}
              style={{
                border: { top: { width: 2, style: 'solid', color: c.accent } },
                padding: [10, 0, 0, 0],
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.typography.monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.accent,
                }}
              >
                {ch.step}
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.bodyFont,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: c.textMuted,
                }}
              >
                {ch.body}
              </Text>
            </Column>
          ))}
        </Grid>
      </Column>
    );
  },
});
