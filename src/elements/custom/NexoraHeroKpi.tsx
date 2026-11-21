import {
  Column,
  Heading,
  Row,
  Span,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getAudienceEdition } from '../../core/audiences.ts';
import { computeTrendAnalysis, filterTrendForAudience } from '../../core/intelligence.ts';
import { getThemeRadiusPx, resolveBrandTheme } from '../../core/themes.ts';
import { parsePayload, resolveHeroDetails, signalHexColor, signalSymbol } from './shared.ts';

/**
 * 2. NexoraHeroKpi — Audience-Aware Dominant Hero KPI + Rolling 3M Signal + Health/Trajectory
 */
export const NexoraHeroKpi = defineElement({
  type: 'nexora.HeroKpi',
  label: 'NEXORA Hero KPI',
  description:
    'Audience-targeted flagship KPI card paired with Rolling 3-Month Momentum signal and Executive Health or Partner Delivery status.',
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
    const hero = resolveHeroDetails(report, metrics);
    const growthColor = hero.isPositive ? c.positive : c.critical;
    const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
    const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
    const momentumColor = signalHexColor(trend.overallSignal, c);
    const isCompact = target === 'email' || target === 'canvas';
    const isResponsive = target === 'email' || target === 'web';
    const radius = getThemeRadiusPx(theme, 'md');

    const statusLabel = audience.redactInternalExpenses
      ? 'Partner Delivery Assessment'
      : 'Executive Health Assessment';
    const statusValue = audience.redactInternalExpenses
      ? metrics.clientSafeTrajectory
      : metrics.healthStatus;

    return (
      <Column
        style={{
          backgroundColor: c.elevated,
          border: {
            top: { width: 2, style: 'solid', color: c.accent },
            right: { width: 1, style: 'solid', color: c.border },
            bottom: { width: 1, style: 'solid', color: c.border },
            left: { width: 1, style: 'solid', color: c.border },
          },
          borderRadius: radius,
          padding: isCompact ? [20, 20] : [24, 28],
          gap: 16,
        }}
      >
        <Row stackOnMobile={true} style={{ gap: 20, alignItems: 'center' }}>
          <Column style={{ flex: 2, gap: 6 }}>
            <Text
              style={{
                fontFamily: theme.typography.bodyFont,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: c.textMuted,
              }}
            >
              {hero.eyebrow}
            </Text>
            <Heading
              level={2}
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: isCompact ? 32 : 40,
                fontWeight: 700,
                lineHeight: 1.06,
                color: c.accentInk,
                ...(isResponsive ? { mobile: { fontSize: 28 } } : {}),
              }}
            >
              {hero.primaryFormatted}
            </Heading>
            <Text
              style={{
                fontFamily: theme.typography.bodyFont,
                fontSize: 13,
                color: c.text,
              }}
            >
              <Span
                style={{
                  fontFamily: theme.typography.monoFont,
                  fontWeight: 700,
                  color: growthColor,
                }}
              >
                {`${hero.isPositive ? '▲' : '▼'} ${hero.deltaFormatted} `}
              </Span>
              <Span style={{ color: c.textMuted }}>{`· ${hero.priorContext}`}</Span>
            </Text>
          </Column>

          {trend.hasSufficientData ? (
            <Column
              style={{
                width: isCompact ? 155 : 185,
                flex: 'none',
                border: { left: { width: 1, style: 'solid', color: c.border } },
                padding: [0, 0, 0, 16],
                gap: 4,
                ...(isResponsive
                  ? {
                      mobile: {
                        border: { top: { width: 1, style: 'solid', color: c.border } },
                        padding: [12, 0, 0, 0],
                      },
                    }
                  : {}),
              }}
            >
              <Text
                style={{
                  fontFamily: theme.typography.bodyFont,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.9,
                  textTransform: 'uppercase',
                  color: c.textMuted,
                }}
              >
                {`Rolling ${trend.windowMonthsCount}M Signal`}
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.monoFont,
                  fontSize: isCompact ? 15 : 17,
                  fontWeight: 700,
                  color: momentumColor,
                }}
              >
                {`${signalSymbol(trend.overallSignal)} ${trend.overallSignal}`}
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.monoFont,
                  fontSize: 11,
                  color: c.textMuted,
                }}
              >
                {trend.windowPeriodLabel}
              </Text>
            </Column>
          ) : null}

          <Column
            style={{
              width: isCompact ? 185 : 220,
              flex: 'none',
              border: { left: { width: 1, style: 'solid', color: c.border } },
              padding: [0, 0, 0, 16],
              gap: 4,
              ...(isResponsive
                ? {
                    mobile: {
                      border: { top: { width: 1, style: 'solid', color: c.border } },
                      padding: [12, 0, 0, 0],
                    },
                  }
                : {}),
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.bodyFont,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
                color: c.textMuted,
              }}
            >
              {statusLabel}
            </Text>
            <Text
              style={{
                fontFamily: theme.typography.headingFont,
                fontSize: isCompact ? 16 : 19,
                fontWeight: 700,
                color: c.text,
              }}
            >
              {statusValue}
            </Text>
            <Text
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: 11,
                color: c.textMuted,
              }}
            >
              {hero.secondaryLine}
            </Text>
          </Column>
        </Row>
      </Column>
    );
  },
});
