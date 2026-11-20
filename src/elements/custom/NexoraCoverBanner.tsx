import {
  Column,
  Divider,
  Heading,
  Image,
  Row,
  Text,
  defineElement,
  prop,
} from '@hyper-elements/react';
import { getAudienceEdition } from '../../core/audiences.ts';
import { resolveBrandTheme } from '../../core/themes.ts';
import { getLogoRadiusPx, parsePayload } from './shared.ts';

/**
 * 1. NexoraCoverBanner — Native @hyper-elements/react Cover Header (Midnight Luxe, Editorial Ivory, Modern Signal)
 */
export const NexoraCoverBanner = defineElement({
  type: 'nexora.CoverBanner',
  label: 'NEXORA Cover Banner',
  description:
    'Theme-specific executive cover header with Brand DNA logo, audience kicker, and reporting period metadata.',
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
        <Column style={{ padding: 16 }}>
          <Text>Invalid report payload</Text>
        </Column>
      );
    }

    const { report } = data;
    const theme = resolveBrandTheme(report);
    const audience = getAudienceEdition(report.audienceEdition);
    const c = theme.colors;
    const isCompact = target === 'email' || target === 'canvas';
    const isResponsive = target === 'email' || target === 'web';
    const logoUrl = report.branding.logoDataUrl || '';
    const logoRadius = getLogoRadiusPx(report.branding.logoShape);

    const footerMeta = report.isIllustrative
      ? `${audience.coverKicker} · Illustrative Sample Figures · Prepared by ${report.branding.preparedBy}`
      : `${audience.coverKicker} · ${report.branding.classification} · Prepared by ${report.branding.preparedBy}`;

    if (theme.layoutStyle === 'editorial-broadsheet') {
      return (
        <Column
          style={{
            backgroundColor: c.surface,
            border: {
              top: { width: 4, style: 'solid', color: c.text },
              bottom: { width: 2, style: 'solid', color: c.text },
              left: { width: 1, style: 'solid', color: c.border },
              right: { width: 1, style: 'solid', color: c.border },
            },
            padding: isCompact ? [22, 22] : [32, 32],
            gap: 12,
            alignItems: 'center',
          }}
        >
          {logoUrl ? (
            <Image
              src={{ src: logoUrl, width: 44, height: 44 }}
              alt={`${report.branding.companyName} logo`}
              style={{ width: 44, borderRadius: logoRadius, alignSelf: 'center' }}
            />
          ) : null}
          <Text
            style={{
              fontFamily: theme.typography.bodyFont,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: c.accent,
              textAlign: 'center',
            }}
          >
            {report.branding.companyName}
          </Text>
          <Text
            style={{
              fontFamily: theme.typography.monoFont,
              fontSize: 11,
              color: c.textMuted,
              textAlign: 'center',
            }}
          >
            {`${audience.coverKicker} · ${report.reportingPeriod} · ${report.reportDate}`}
          </Text>
          <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border }, width: '84%' }} />
          <Heading
            level={1}
            style={{
              fontFamily: theme.typography.headingFont,
              fontSize: isCompact ? 28 : 36,
              lineHeight: 1.15,
              fontWeight: 700,
              color: c.text,
              textAlign: 'center',
              ...(isResponsive ? { mobile: { fontSize: 23 } } : {}),
            }}
          >
            {report.title}
          </Heading>
          <Text
            style={{
              fontFamily: theme.typography.bodyFont,
              fontSize: isCompact ? 14 : 15,
              lineHeight: 1.58,
              color: c.textMuted,
              textAlign: 'center',
              maxWidth: 600,
            }}
          >
            {report.subtitle}
          </Text>
          <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border } }} />
          <Text
            style={{
              fontFamily: theme.typography.monoFont,
              fontSize: 11,
              color: c.textMuted,
              textAlign: 'center',
            }}
          >
            {footerMeta}
          </Text>
        </Column>
      );
    }

    const isSwiss = theme.layoutStyle === 'swiss-precision';

    return (
      <Column
        style={{
          backgroundColor: c.surface,
          border: {
            top: { width: isSwiss ? 5 : 1, style: 'solid', color: isSwiss ? c.accent : c.border },
            right: { width: 1, style: 'solid', color: c.border },
            bottom: { width: 1, style: 'solid', color: c.border },
            left: { width: 1, style: 'solid', color: c.border },
          },
          borderRadius: isSwiss ? 8 : 10,
          padding: isCompact ? [22, 22] : [30, 32],
          gap: 16,
        }}
      >
        <Row stackOnMobile={true} style={{ gap: 16, alignItems: 'center' }}>
          <Row stackOnMobile={false} style={{ gap: 14, alignItems: 'center', flex: 2 }}>
            {logoUrl ? (
              <Column style={{ width: 52, flex: 'none' }}>
                <Image
                  src={{ src: logoUrl, width: 48, height: 48 }}
                  alt={`${report.branding.companyName} logo`}
                  style={{
                    width: 48,
                    borderRadius: logoRadius,
                    border: { width: 1, style: 'solid', color: c.border },
                  }}
                />
              </Column>
            ) : null}
            <Column style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: theme.typography.bodyFont,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1.3,
                  textTransform: 'uppercase',
                  color: isSwiss ? c.text : c.accent,
                }}
              >
                {report.branding.companyName}
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.bodyFont,
                  fontSize: 12,
                  color: c.textMuted,
                }}
              >
                {report.branding.tagline}
              </Text>
            </Column>
          </Row>
          <Column style={{ width: 170, flex: 'none', gap: 2 }}>
            <Text
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: 12,
                fontWeight: 700,
                color: isSwiss ? c.accent : c.text,
                textAlign: 'right',
                ...(isResponsive ? { mobile: { textAlign: 'left' } } : {}),
              }}
            >
              {report.reportingPeriod}
            </Text>
            <Text
              style={{
                fontFamily: theme.typography.monoFont,
                fontSize: 11,
                color: c.textMuted,
                textAlign: 'right',
                ...(isResponsive ? { mobile: { textAlign: 'left' } } : {}),
              }}
            >
              {report.reportDate}
            </Text>
          </Column>
        </Row>

        <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border } }} />

        <Column style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: theme.typography.monoFont,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              color: isSwiss ? c.accent : c.textMuted,
            }}
          >
            {`${audience.coverKicker} · ${report.branding.classification}`}
          </Text>
          <Heading
            level={1}
            style={{
              fontFamily: theme.typography.headingFont,
              fontSize: isCompact ? 26 : 34,
              lineHeight: 1.16,
              fontWeight: isSwiss ? 700 : 600,
              color: c.text,
              ...(isResponsive ? { mobile: { fontSize: 23 } } : {}),
            }}
          >
            {report.title}
          </Heading>
          <Text
            style={{
              fontFamily: theme.typography.bodyFont,
              fontSize: isCompact ? 14 : 15,
              lineHeight: 1.58,
              color: c.textMuted,
            }}
          >
            {report.subtitle}
          </Text>
        </Column>

        <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border } }} />

        <Text
          style={{
            fontFamily: theme.typography.monoFont,
            fontSize: 11,
            color: c.textMuted,
          }}
        >
          {footerMeta}
        </Text>
      </Column>
    );
  },
});
