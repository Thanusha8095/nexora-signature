import {
  Column,
  Grid,
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
import { resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload } from './shared.ts';

/**
 * 3. NexoraKpiStrip — Native 4- or 5-Column KPI Dashboard Strip (Client edition redacts expenses & profit)
 */
export const NexoraKpiStrip = defineElement({
  type: 'nexora.KpiStrip',
  label: 'NEXORA KPI Strip',
  description:
    'Summary KPI grid across Revenue, Expenses, Net Profit, Profit Margin, and Customers with automatic Client-edition cost redaction.',
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
    const compactMoney = target === 'email';

    const cards = audience.redactInternalExpenses
      ? [
          {
            label: 'Total Revenue',
            val: formatCurrency(report.currentPeriod.revenue, cur, { compact: compactMoney }),
            sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
            positive: (metrics.revenueGrowthPct ?? 0) >= 0,
          },
          {
            label: 'Active Customers',
            val: formatNumber(report.currentPeriod.customerCount),
            sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
            positive: (metrics.customerGrowthPct ?? 0) >= 0,
          },
          {
            label: 'Revenue / Customer',
            val:
              metrics.revenuePerCustomer !== null
                ? formatCurrency(metrics.revenuePerCustomer, cur)
                : 'N/A',
            sub: `${formatPercent(metrics.arpuGrowthPct, { signed: true })} expansion`,
            positive: (metrics.arpuGrowthPct ?? 0) >= 0,
          },
          {
            label: 'Partner Trajectory',
            val: metrics.healthStatus,
            sub:
              report.currentPeriod.npsScore !== undefined
                ? `NPS ${report.currentPeriod.npsScore}`
                : report.reportingPeriod,
            positive: true,
          },
        ]
      : [
          {
            label: compactMoney ? 'Revenue' : 'Total Revenue',
            val: formatCurrency(report.currentPeriod.revenue, cur, { compact: compactMoney }),
            sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
            positive: (metrics.revenueGrowthPct ?? 0) >= 0,
          },
          {
            label: compactMoney ? 'Expenses' : 'Operating Expenses',
            val: formatCurrency(report.currentPeriod.expenses, cur, { compact: compactMoney }),
            sub: `${formatPercent(metrics.expenseGrowthPct, { signed: true })} vs prior`,
            positive: (metrics.expenseGrowthPct ?? 0) <= (metrics.revenueGrowthPct ?? 0),
          },
          {
            label: 'Net Profit',
            val: formatCurrency(metrics.netProfit, cur, { compact: compactMoney }),
            sub: `${formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior`,
            positive: metrics.netProfit >= 0 && (metrics.profitGrowthPct ?? 0) >= 0,
          },
          {
            label: 'Profit Margin',
            val: formatPercent(metrics.profitMarginPct),
            sub: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift`,
            positive: metrics.marginDeltaPts >= 0,
          },
          {
            label: compactMoney ? 'Customers' : 'Active Customers',
            val: formatNumber(report.currentPeriod.customerCount),
            sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
            positive: (metrics.customerGrowthPct ?? 0) >= 0,
          },
        ];

    return (
      <Grid
        columns={cards.length}
        stackOnMobile={true}
        style={{ gap: target === 'email' ? 8 : 12 }}
      >
        {cards.map((card) => (
          <Column
            key={card.label}
            style={{
              backgroundColor: c.surface,
              border: {
                top: { width: 2, style: 'solid', color: card.positive ? c.accent : c.warning },
                right: { width: 1, style: 'solid', color: c.border },
                bottom: { width: 1, style: 'solid', color: c.border },
                left: { width: 1, style: 'solid', color: c.border },
              },
              borderRadius: 8,
              padding: target === 'email' ? [12, 10] : [15, 14],
              gap: 6,
            }}
          >
            <Text
              style={{
                ...(compactMoney ? {} : { fontFamily: theme.typography.bodyFont }),
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.7,
                textTransform: 'uppercase',
                color: c.textMuted,
              }}
            >
              {card.label}
            </Text>
            <Text
              style={{
                fontFamily: compactMoney ? 'monospace' : theme.typography.monoFont,
                fontSize: target === 'email' ? 16 : 19,
                fontWeight: 700,
                lineHeight: 1.15,
                color: c.text,
              }}
            >
              {card.val}
            </Text>
            <Text
              style={{
                fontFamily: compactMoney ? 'monospace' : theme.typography.monoFont,
                fontSize: 11,
                fontWeight: 600,
                color: card.positive ? c.positive : c.warning,
              }}
            >
              {`${card.positive ? '▲' : '▼'} ${card.sub}`}
            </Text>
          </Column>
        ))}
      </Grid>
    );
  },
});
