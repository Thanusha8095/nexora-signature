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
import { computeTrendAnalysis, filterTrendForAudience } from '../../core/intelligence.ts';
import { getThemeRadiusPx, resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload, resolveStoryArcChapters } from './shared.ts';

/**
 * 4. NexoraStoryArc — Edition-Tailored Four-Beat Financial Storytelling Narrative Bridge
 */
export const NexoraStoryArc = defineElement({
  type: 'nexora.StoryArc',
  label: 'NEXORA Executive Story Arc',
  description:
    'Four-beat deterministic stakeholder narrative tailored to Board, CEO, Investor, Team, and Client editions.',
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
    const radius = getThemeRadiusPx(theme, 'md');
    const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
    const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
    const chapters = resolveStoryArcChapters(report, metrics, trend);

    const headingTitle =
      audience.id === 'client'
        ? 'Partner Journey Arc'
        : audience.id === 'team'
          ? 'Execution Story Arc'
          : audience.id === 'investor'
            ? 'Growth Story Arc'
            : 'Executive Story Arc';

    return (
      <Column
        style={{
          backgroundColor: c.surface,
          border: { width: 1, style: 'solid', color: c.border },
          borderRadius: radius,
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
              {headingTitle}
            </Heading>
          </Column>
          <Column style={{ flex: 'none' }}>
            <Text
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: 11,
                color: c.accentInk,
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
                  color: c.accentInk,
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
