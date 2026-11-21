import {
  Column,
  Heading,
  Row,
  Table,
  TableCell,
  TableRow,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getAudienceEdition } from '../../core/audiences.ts';
import { formatCurrency, formatNumber, formatPercent } from '../../core/calculations.ts';
import { runWhatIfSimulation } from '../../core/simulator.ts';
import { getThemeRadiusPx, resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload } from './shared.ts';

/**
 * 8. NexoraSimulationAppendix — Strictly Separated Hypothetical What-If Scenario Appendix
 */
export const NexoraSimulationAppendix = defineElement({
  type: 'nexora.SimulationAppendix',
  label: 'NEXORA What-If Simulation Appendix',
  description:
    'Non-actual hypothetical scenario modeling table strictly separated from audited actual figures (excluded in Client edition).',
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

    const { report } = data;
    const audience = getAudienceEdition(report.audienceEdition);
    if (!report.simulation?.includeInReport || audience.redactInternalExpenses) {
      return <Column style={{ padding: 0 }} />;
    }

    const theme = resolveBrandTheme(report);
    const sim = runWhatIfSimulation(report, report.simulation);
    const c = theme.colors;
    const cur = report.currency;
    const isCompact = target === 'email' || target === 'canvas';
    const radius = getThemeRadiusPx(theme, 'md');

    const rows = [
      {
        label: 'Revenue (Simulated)',
        actual: formatCurrency(sim.actualRevenue, cur, { compact: isCompact }),
        projected: formatCurrency(sim.projectedRevenue, cur, { compact: isCompact }),
        variance: `${formatCurrency(sim.revenueVariance, cur, { signed: true, compact: isCompact })} (${sim.impliedRevenueDeltaPct >= 0 ? '+' : ''}${sim.impliedRevenueDeltaPct.toFixed(1)}%)`,
      },
      {
        label: 'Operating Expenses (Simulated)',
        actual: formatCurrency(sim.actualExpenses, cur, { compact: isCompact }),
        projected: formatCurrency(sim.projectedExpenses, cur, { compact: isCompact }),
        variance: formatCurrency(sim.expenseVariance, cur, { signed: true, compact: isCompact }),
      },
      {
        label: 'Net Profit (Simulated)',
        actual: formatCurrency(sim.actualNetProfit, cur, { compact: isCompact }),
        projected: formatCurrency(sim.projectedNetProfit, cur, { compact: isCompact }),
        variance: formatCurrency(sim.netProfitVariance, cur, { signed: true, compact: isCompact }),
      },
      {
        label: 'Net Profit Margin (Simulated)',
        actual: formatPercent(sim.actualMarginPct),
        projected: formatPercent(sim.projectedMarginPct),
        variance: `${sim.marginVariancePts >= 0 ? '+' : ''}${sim.marginVariancePts.toFixed(1)} pts`,
      },
      {
        label: 'Active Customers (Simulated)',
        actual: formatNumber(sim.actualCustomers),
        projected: formatNumber(sim.projectedCustomers),
        variance: `${sim.customerVariance >= 0 ? '+' : ''}${formatNumber(sim.customerVariance)}`,
      },
      {
        label: 'ARPU (Rev / Customer)',
        actual: sim.actualArpu !== null ? formatCurrency(sim.actualArpu, cur) : 'N/A',
        projected: sim.projectedArpu !== null ? formatCurrency(sim.projectedArpu, cur) : 'N/A',
        variance:
          sim.arpuVariance !== null
            ? formatCurrency(sim.arpuVariance, cur, { signed: true })
            : 'N/A',
      },
    ];

    const assumptionsText = `Drivers: Customers ${sim.assumptions.customerDeltaPct >= 0 ? '+' : ''}${sim.assumptions.customerDeltaPct}% · ARPU ${sim.assumptions.arpuDeltaPct >= 0 ? '+' : ''}${sim.assumptions.arpuDeltaPct}% · Implied Rev ${sim.impliedRevenueDeltaPct >= 0 ? '+' : ''}${sim.impliedRevenueDeltaPct.toFixed(1)}% · OpEx ${sim.assumptions.expenseDeltaPct >= 0 ? '+' : ''}${sim.assumptions.expenseDeltaPct}%`;

    const simFont = target === 'email' ? 'monospace' : theme.typography.monoFont;

    return (
      <Column
        style={{
          backgroundColor: c.warningBg,
          border: { width: 1, style: 'dashed', color: c.warning },
          borderRadius: radius,
          padding: isCompact ? [18, 18] : [22, 24],
          gap: 12,
        }}
      >
        <Row stackOnMobile={true} style={{ gap: 10, alignItems: 'center' }}>
          <Column style={{ flex: 2, gap: 4 }}>
            <Text
              style={{
                fontFamily: simFont,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: c.warning,
              }}
            >
              HYPOTHETICAL WHAT-IF PROJECTION — NON-ACTUAL SCENARIO
            </Text>
            <Heading
              level={3}
              style={{
                fontFamily: theme.typography.headingFont,
                fontSize: isCompact ? 16 : 18,
                fontWeight: 600,
                color: c.text,
              }}
            >
              {sim.assumptions.scenarioName}
            </Heading>
          </Column>
          <Column style={{ flex: 'none' }}>
            <Text
              style={{
                fontFamily: simFont,
                fontSize: 11,
                color: c.textMuted,
              }}
            >
              {assumptionsText}
            </Text>
          </Column>
        </Row>

        <Text
          style={{
            ...(target === 'email' ? {} : { fontFamily: theme.typography.bodyFont }),
            fontSize: 12,
            lineHeight: 1.5,
            color: c.textMuted,
          }}
        >
          Figures below satisfy Projected Revenue = Projected Customers × Projected ARPU from user-defined assumptions and are strictly separated from audited period actuals above.
        </Text>

        <Table
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            cellPadding: isCompact ? [7, 8] : [9, 12],
            rowBorder: { width: 1, style: 'solid', color: c.border },
            fontSize: isCompact ? 11 : 12,
          }}
        >
          <TableRow header style={{ backgroundColor: c.tableHeaderBg, color: c.tableHeaderText }}>
            <TableCell style={{ fontWeight: 700 }}>Simulated Metric</TableCell>
            <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Reported Actual</TableCell>
            <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Projected Result</TableCell>
            <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Scenario Variance</TableCell>
          </TableRow>
          {rows.map((r) => (
            <TableRow key={r.label} style={{ color: c.text }}>
              <TableCell style={{ fontWeight: 500 }}>{r.label}</TableCell>
              <TableCell
                style={{
                  textAlign: 'right',
                  fontFamily: simFont,
                  color: c.textMuted,
                }}
              >
                {r.actual}
              </TableCell>
              <TableCell
                style={{
                  textAlign: 'right',
                  fontFamily: simFont,
                  fontWeight: 700,
                }}
              >
                {r.projected}
              </TableCell>
              <TableCell
                style={{
                  textAlign: 'right',
                  fontFamily: simFont,
                  fontWeight: 700,
                  color: c.accentInk,
                }}
              >
                {r.variance}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Column>
    );
  },
});
