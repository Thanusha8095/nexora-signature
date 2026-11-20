import {
  Column,
  Grid,
  Heading,
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
import { formatCurrency } from '../../core/calculations.ts';
import { resolveBrandTheme } from '../../core/themes.ts';
import type { ComputedCategoryItem } from '../../core/types.ts';
import { parsePayload } from './shared.ts';

/**
 * 6. NexoraBreakdownChart — Revenue & Operating Cost Drivers Mix (Client edition redacts expenses)
 */
export const NexoraBreakdownChart = defineElement({
  type: 'nexora.BreakdownChart',
  label: 'NEXORA Category Breakdown',
  description:
    'Proportional horizontal bar breakdown across Revenue Streams and Operating Cost Drivers with automatic Client-edition redaction.',
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

    if (target === 'email') {
      const renderEmailTableCard = (
        title: string,
        subtitle: string,
        items: ComputedCategoryItem[],
        barColor: string
      ) => (
        <Column
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: 8,
            padding: [14, 16],
            gap: 8,
          }}
        >
          <Heading level={3} style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
            {title}
          </Heading>
          <Text style={{ fontFamily: theme.typography.monoFont, fontSize: 11, color: c.textMuted }}>
            {subtitle}
          </Text>
          <Table
            style={{
              cellPadding: [5, 4],
              rowBorder: { width: 1, style: 'solid', color: c.border },
              fontSize: 12,
            }}
          >
            <TableRow header style={{ color: c.textMuted }}>
              <TableCell style={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell style={{ width: 96, fontWeight: 700 }}>Mix</TableCell>
              <TableCell style={{ textAlign: 'right', fontWeight: 700 }}>Amount (Share)</TableCell>
            </TableRow>
            {items.map((item) => {
              const blocks = Math.max(1, Math.min(10, Math.round(item.sharePct / 10)));
              return (
                <TableRow key={item.name} style={{ color: c.text }}>
                  <TableCell style={{ fontWeight: 600 }}>{item.name}</TableCell>
                  <TableCell style={{ fontFamily: theme.typography.monoFont, fontSize: 11, color: barColor }}>
                    {'█'.repeat(blocks)}
                  </TableCell>
                  <TableCell
                    style={{
                      textAlign: 'right',
                      fontFamily: theme.typography.monoFont,
                      color: c.textMuted,
                    }}
                  >
                    {`${formatCurrency(item.amount, cur, { compact: true })} · ${item.sharePct.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </Column>
      );

      if (audience.redactInternalExpenses) {
        return renderEmailTableCard(
          'Revenue Streams & Product Adoption',
          `Category total: ${formatCurrency(metrics.revenueCategoryTotal, cur, { compact: true })} (Internal cost drivers redacted in Client Edition)`,
          metrics.revenueCategoriesComputed,
          c.chartRevenue
        );
      }

      return (
        <Column style={{ gap: 12 }}>
          {renderEmailTableCard(
            'Revenue Streams',
            `Category total: ${formatCurrency(metrics.revenueCategoryTotal, cur, { compact: true })}`,
            metrics.revenueCategoriesComputed,
            c.chartRevenue
          )}
          {renderEmailTableCard(
            'Operating Cost Drivers',
            `Category total: ${formatCurrency(metrics.expenseCategoryTotal, cur, { compact: true })}`,
            metrics.expenseCategoriesComputed,
            c.chartExpense
          )}
        </Column>
      );
    }

    const renderBreakdownCard = (
      title: string,
      subtitle: string,
      items: ComputedCategoryItem[],
      barColor: string
    ) => (
      <Column
        style={{
          backgroundColor: c.surface,
          border: { width: 1, style: 'solid', color: c.border },
          borderRadius: 8,
          padding: [20, 22],
          gap: 12,
        }}
      >
        <Column style={{ gap: 3 }}>
          <Heading
            level={3}
            style={{
              fontFamily: theme.typography.headingFont,
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
            }}
          >
            {title}
          </Heading>
          <Text
            style={{
              fontFamily: theme.typography.monoFont,
              fontSize: 11,
              color: c.textMuted,
            }}
          >
            {subtitle}
          </Text>
        </Column>

        <Column style={{ gap: 11 }}>
          {items.map((item) => {
            const pct = Math.max(2, Math.min(100, Math.round(item.sharePct)));
            return (
              <Column key={item.name} style={{ gap: 5 }}>
                <Row stackOnMobile={false} style={{ gap: 8, alignItems: 'center' }}>
                  <Column style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: theme.typography.bodyFont,
                        fontSize: 13,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      {item.name}
                    </Text>
                  </Column>
                  <Column style={{ flex: 'none' }}>
                    <Text
                      style={{
                        fontFamily: theme.typography.monoFont,
                        fontSize: 12,
                        color: c.textMuted,
                        textAlign: 'right',
                      }}
                    >
                      {`${formatCurrency(item.amount, cur)} · `}
                      <Span style={{ fontWeight: 700, color: c.text }}>
                        {`${item.sharePct.toFixed(1)}%`}
                      </Span>
                    </Text>
                  </Column>
                </Row>

                <Row
                  stackOnMobile={false}
                  style={{
                    backgroundColor: c.elevated,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Column
                    style={{
                      flex: pct,
                      height: 8,
                      backgroundColor: barColor,
                    }}
                  />
                  {pct < 100 ? (
                    <Column style={{ flex: 100 - pct, height: 8 }} />
                  ) : null}
                </Row>
              </Column>
            );
          })}
        </Column>
      </Column>
    );

    if (audience.redactInternalExpenses) {
      return renderBreakdownCard(
        'Revenue Streams & Product Adoption',
        `Category total: ${formatCurrency(metrics.revenueCategoryTotal, cur)} (Internal cost drivers redacted in Client Edition)`,
        metrics.revenueCategoriesComputed,
        c.chartRevenue
      );
    }

    return (
      <Grid columns={2} stackOnMobile={true} style={{ gap: 16, rowGap: 16 }}>
        {renderBreakdownCard(
          'Revenue Streams',
          `Category total: ${formatCurrency(metrics.revenueCategoryTotal, cur)}`,
          metrics.revenueCategoriesComputed,
          c.chartRevenue
        )}
        {renderBreakdownCard(
          'Operating Cost Drivers',
          `Category total: ${formatCurrency(metrics.expenseCategoryTotal, cur)}`,
          metrics.expenseCategoriesComputed,
          c.chartExpense
        )}
      </Grid>
    );
  },
});
