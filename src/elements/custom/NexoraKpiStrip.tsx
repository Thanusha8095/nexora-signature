import {
  Column,
  Grid,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getThemeRadiusPx, resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload, resolveKpiStripCards } from './shared.ts';

/**
 * 3. NexoraKpiStrip — Native 4- or 5-Column Edition-Differentiated KPI Dashboard Strip
 */
export const NexoraKpiStrip = defineElement({
  type: 'nexora.KpiStrip',
  label: 'NEXORA KPI Strip',
  description:
    'Stakeholder-differentiated summary KPI strip across Board, CEO, Investor, Team, and redacted Client editions.',
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
    const c = theme.colors;
    const compactMoney = target === 'email';
    const radius = getThemeRadiusPx(theme, 'md');
    const cards = resolveKpiStripCards(report, metrics, compactMoney);

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
              borderRadius: radius,
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
