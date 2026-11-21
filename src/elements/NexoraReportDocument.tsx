import React from 'react';
import {
  Canvas,
  Column,
  Divider,
  Document,
  Email,
  Heading,
  Link,
  Page,
  PageBreak,
  PageFooter,
  PageHeader,
  PageNumber,
  Row,
  Span,
  Table,
  TableCell,
  TableRow,
  Text,
} from '@hyper-elements/react';
import { getAudienceEdition, type ReportSectionKey } from '../core/audiences.ts';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../core/calculations.ts';
import {
  computeTrendAnalysis,
  filterInsightsForAudience,
  filterRecommendationsForAudience,
  filterTrendForAudience,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../core/intelligence.ts';
import { sanitizeReportForAudience } from '../core/redaction.ts';
import { sanitizeHttpUrl } from '../core/security.ts';
import { getThemeRadiusPx } from '../core/themes.ts';
import type { ReportInputData, ThemeSpec } from '../core/types.ts';
import { buildHyperTheme } from './hyperTheme.ts';
import {
  NexoraBreakdownChart,
  NexoraCoverBanner,
  NexoraHeroKpi,
  NexoraInsightsBlock,
  NexoraKpiStrip,
  NexoraSimulationAppendix,
  NexoraStoryArc,
  NexoraTrendChart,
  type HyperTarget,
  type SerializedReportPayload,
} from './custom/index.ts';

export type NexoraRootMode = HyperTarget;

export interface BuildNexoraTreeOptions {
  omitDomRunningChrome?: boolean;
}

const ROMAN_NUMERALS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.'];

function renderSectionHeading(
  index: number,
  title: string,
  theme: ThemeSpec
): React.ReactElement {
  const c = theme.colors;
  const roman = ROMAN_NUMERALS[index] ?? `${index + 1}.`;
  const numeric = `0${index + 1}`;
  const prefix =
    theme.layoutStyle === 'editorial-broadsheet'
      ? `${roman} `
      : theme.layoutStyle === 'swiss-precision'
        ? `${numeric} / `
        : '';

  return (
    <Heading
      level={2}
      style={{
        fontFamily: theme.typography.headingFont,
        fontSize: 19,
        fontWeight: 600,
        color: c.text,
      }}
    >
      {prefix ? <Span style={{ color: c.accentInk }}>{prefix}</Span> : null}
      {title}
    </Heading>
  );
}

function renderDataTable(
  headers: string[],
  rows: string[][],
  theme: ThemeSpec,
  compact: boolean
): React.ReactElement {
  const c = theme.colors;
  return (
    <Table
      style={{
        backgroundColor: c.surface,
        border: { width: 1, style: 'solid', color: c.border },
        cellPadding: compact ? [6, 8] : [9, 12],
        rowBorder: { width: 1, style: 'solid', color: c.border },
        fontSize: compact ? 12 : 13,
      }}
    >
      <TableRow header style={{ backgroundColor: c.tableHeaderBg, color: c.tableHeaderText }}>
        {headers.map((h, i) => (
          <TableCell
            key={h}
            style={{
              fontWeight: 700,
              textAlign: i > 0 ? 'right' : 'left',
            }}
          >
            {h}
          </TableCell>
        ))}
      </TableRow>
      {rows.map((r, rIdx) => (
        <TableRow
          key={`row-${rIdx}`}
          style={{
            backgroundColor: rIdx % 2 === 1 ? c.tableStripeBg : c.surface,
            color: c.text,
          }}
        >
          {r.map((cell, cIdx) => (
            <TableCell
              key={`cell-${rIdx}-${cIdx}`}
              style={{
                fontWeight: cIdx === 0 ? 600 : 400,
                ...(cIdx > 0
                  ? { fontFamily: compact ? 'monospace' : theme.typography.monoFont }
                  : compact
                    ? {}
                    : { fontFamily: theme.typography.bodyFont }),
                textAlign: cIdx > 0 ? 'right' : 'left',
              }}
            >
              {cell}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </Table>
  );
}

const SECTION_WEIGHTS: Record<
  ReportSectionKey | 'intelligence-observations' | 'intelligence-recommendations',
  number
> = {
  'story-arc': 24,
  summary: 30,
  comparison: 38,
  trends: 52,
  breakdowns: 46,
  segments: 34,
  intelligence: 86,
  'intelligence-observations': 52,
  'intelligence-recommendations': 38,
  priorities: 36,
  simulation: 52,
  closing: 26,
};

/**
 * Builds the canonical @hyper-elements/react root element (<Email>, <Page>, <Document>, or <Canvas>)
 * from the shared NEXORA ReportInputData model with automatic Client pre-render redaction.
 */
export function buildNexoraReportTree(
  rawReport: ReportInputData,
  mode: NexoraRootMode,
  options?: BuildNexoraTreeOptions
): React.ReactElement {
  const { report: safeReport, metrics, isRedacted: redact } = sanitizeReportForAudience(rawReport);
  const { spec: theme, theme: hyperTheme } = buildHyperTheme(safeReport);
  const audience = getAudienceEdition(safeReport.audienceEdition);
  const radius = getThemeRadiusPx(theme, 'md');

  const trendAnalysis = filterTrendForAudience(
    computeTrendAnalysis(safeReport, metrics),
    redact
  );
  const rawInsights = generateExecutiveInsights(safeReport, metrics);
  const insights = filterInsightsForAudience(rawInsights, trendAnalysis, redact, audience.id);
  const recommendations = filterRecommendationsForAudience(
    generateStrategicRecommendations(safeReport, metrics, rawInsights, audience.id),
    redact
  );

  const c = theme.colors;
  const cur = safeReport.currency;

  const payload: SerializedReportPayload = {
    report: safeReport,
    metrics,
    trendAnalysis,
    insights,
    recommendations,
    accentOverride: safeReport.branding.accentColor,
  };
  const payloadJson = JSON.stringify(payload);
  const compact = mode === 'email';

  const comparisonHeaders = [
    'Financial Metric',
    safeReport.reportingPeriod,
    safeReport.previousPeriodLabel,
    'Period Change',
  ];

  const rawComparisonRows: { sensitive: boolean; row: string[] }[] = [
    {
      sensitive: false,
      row: [
        'Total Revenue',
        formatCurrency(safeReport.currentPeriod.revenue, cur, { compact }),
        formatCurrency(safeReport.previousPeriod.revenue, cur, { compact }),
        formatPercent(metrics.revenueGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: true,
      row: [
        'Operating Expenses',
        formatCurrency(safeReport.currentPeriod.expenses, cur, { compact }),
        formatCurrency(safeReport.previousPeriod.expenses, cur, { compact }),
        formatPercent(metrics.expenseGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: true,
      row: [
        'Net Profit',
        formatCurrency(metrics.netProfit, cur, { compact }),
        formatCurrency(metrics.previousNetProfit, cur, { compact }),
        formatPercent(metrics.profitGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: true,
      row: [
        'Net Profit Margin',
        formatPercent(metrics.profitMarginPct),
        formatPercent(metrics.previousProfitMarginPct),
        `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts`,
      ],
    },
    {
      sensitive: false,
      row: [
        'Active Customers',
        formatNumber(safeReport.currentPeriod.customerCount),
        formatNumber(safeReport.previousPeriod.customerCount),
        formatPercent(metrics.customerGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: false,
      row: [
        'Revenue / Customer',
        metrics.revenuePerCustomer !== null
          ? formatCurrency(metrics.revenuePerCustomer, cur)
          : 'N/A',
        metrics.previousRevenuePerCustomer !== null
          ? formatCurrency(metrics.previousRevenuePerCustomer, cur)
          : 'N/A',
        formatPercent(metrics.arpuGrowthPct, { signed: true }),
      ],
    },
  ];

  const comparisonRows = rawComparisonRows
    .filter((entry) => !(redact && entry.sensitive))
    .map((entry) => entry.row);

  const segmentHeaders = redact
    ? ['Operating Segment', 'Partner Reach Revenue', 'Mix Share', 'YoP Growth']
    : ['Operating Segment', 'Segment Revenue', 'Mix Share', 'YoP Growth', 'Net Margin'];

  const segmentRows: string[][] = metrics.segmentsComputed.map((seg) =>
    redact
      ? [
          seg.name,
          formatCurrency(seg.revenue, cur, { compact }),
          `${seg.sharePct.toFixed(1)}%`,
          formatPercent(seg.growthPct, { signed: true }),
        ]
      : [
          seg.name,
          formatCurrency(seg.revenue, cur, { compact }),
          `${seg.sharePct.toFixed(1)}%`,
          formatPercent(seg.growthPct, { signed: true }),
          `${seg.marginPct.toFixed(1)}%`,
        ]
  );

  const prioritiesHeaders = redact
    ? ['Partnership Initiative', 'Horizon', 'Client Impact']
    : ['Priority Initiative', 'Horizon', 'Owner', 'Expected Impact'];
  const prioritiesRows: string[][] = safeReport.strategicPriorities.map((sp) =>
    redact
      ? [sp.title, sp.horizon, sp.targetImpact]
      : [sp.title, sp.horizon, sp.owner, sp.targetImpact]
  );

  const safeWebsite = sanitizeHttpUrl(safeReport.branding.website);
  const previewText = `${safeReport.branding.companyName} (${audience.name}) · ${safeReport.reportingPeriod} — Revenue ${formatCurrency(safeReport.currentPeriod.revenue, cur)}, ${formatNumber(safeReport.currentPeriod.customerCount)} customers.`;
  const reportDocTitle = `${safeReport.branding.companyName} — ${safeReport.title}`;

  let headingCounter = 0;

  const renderSectionNode = (
    key: ReportSectionKey,
    insightsPart: 'all' | 'trend-observations' | 'recommendations' = 'all'
  ): React.ReactNode => {
    if (key === 'story-arc') {
      return <NexoraStoryArc key="story-arc" payloadJson={payloadJson} target={mode} />;
    }

    if (key === 'summary') {
      const idx = headingCounter++;
      return (
        <Column
          key="summary"
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: radius,
            padding: compact ? [16, 18] : [22, 24],
            gap: 10,
          }}
        >
          {renderSectionHeading(idx, audience.summaryHeading, theme)}
          <Text style={{ fontSize: 14, lineHeight: 1.6, color: c.text }}>
            <Span style={{ fontWeight: 700 }}>Overview: </Span>
            {safeReport.narrative.overview}
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: c.textMuted }}>
            <Span style={{ fontWeight: 700, color: c.text }}>
              {redact ? 'Partner Highlights: ' : 'Key Achievements: '}
            </Span>
            {safeReport.narrative.achievements}
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: c.textMuted }}>
            <Span style={{ fontWeight: 700, color: c.text }}>
              {redact ? 'Delivery Priorities: ' : 'Operational Challenges: '}
            </Span>
            {safeReport.narrative.challenges}
          </Text>
        </Column>
      );
    }

    if (key === 'trends') {
      const idx = headingCounter++;
      return (
        <Column key="trends" style={{ gap: 10 }}>
          {renderSectionHeading(
            idx,
            redact ? 'Revenue Trajectory' : 'Financial Performance & Monthly Trajectory',
            theme
          )}
          <NexoraTrendChart payloadJson={payloadJson} target={mode} />
        </Column>
      );
    }

    if (key === 'breakdowns') {
      return <NexoraBreakdownChart key="breakdowns" payloadJson={payloadJson} target={mode} />;
    }

    if (key === 'comparison') {
      if (redact || comparisonRows.length === 0) return null;
      const idx = headingCounter++;
      return (
        <Column
          key="comparison"
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: radius,
            padding: compact ? [14, 16] : [20, 22],
            gap: 12,
          }}
        >
          {renderSectionHeading(idx, 'Period-over-Period Comparison', theme)}
          {renderDataTable(comparisonHeaders, comparisonRows, theme, compact)}
        </Column>
      );
    }

    if (key === 'segments') {
      if (segmentRows.length === 0) return null;
      const idx = headingCounter++;
      return (
        <Column
          key="segments"
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: radius,
            padding: compact ? [14, 16] : [20, 22],
            gap: 12,
          }}
        >
          {renderSectionHeading(
            idx,
            redact ? 'Operating Segment Reach' : 'Segment Contribution & Unit Margin',
            theme
          )}
          {renderDataTable(segmentHeaders, segmentRows, theme, compact)}
        </Column>
      );
    }

    if (key === 'intelligence') {
      if (redact) return null;
      if (insightsPart === 'recommendations') {
        return (
          <NexoraInsightsBlock
            key="intelligence-recommendations"
            payloadJson={payloadJson}
            target={mode}
            part="recommendations"
          />
        );
      }
      const idx = headingCounter++;
      return (
        <Column key="intelligence" style={{ gap: 10 }}>
          {renderSectionHeading(idx, 'Executive Intelligence & Analytical Advisory', theme)}
          <NexoraInsightsBlock payloadJson={payloadJson} target={mode} part={insightsPart} />
        </Column>
      );
    }

    if (key === 'priorities') {
      if (prioritiesRows.length === 0) return null;
      const idx = headingCounter++;
      return (
        <Column
          key="priorities"
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: radius,
            padding: compact ? [14, 16] : [20, 22],
            gap: 12,
          }}
        >
          {renderSectionHeading(idx, audience.prioritiesHeading, theme)}
          {renderDataTable(prioritiesHeaders, prioritiesRows, theme, compact)}
        </Column>
      );
    }

    if (key === 'simulation') {
      if (!safeReport.simulation?.includeInReport || redact) return null;
      return <NexoraSimulationAppendix key="simulation" payloadJson={payloadJson} target={mode} />;
    }

    if (key === 'closing') {
      return (
        <Column
          key="closing"
          style={{
            backgroundColor: c.elevated,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: radius,
            padding: compact ? [16, 18] : [22, 24],
            gap: 10,
          }}
        >
          <Heading
            level={3}
            style={{
              fontFamily: theme.typography.headingFont,
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
            }}
          >
            {audience.closingHeading}
          </Heading>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: c.text }}>
            {safeReport.narrative.closingTakeaway}
          </Text>
          <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border } }} />
          <Column style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: c.text }}>
              {`${safeReport.branding.companyName} · ${safeReport.branding.preparedBy}`}
            </Text>
            <Text style={{ fontSize: 12, color: c.textMuted }}>
              {safeReport.branding.contactEmail}
              {safeWebsite ? (
                <>
                  {' · '}
                  <Link href={safeWebsite} style={{ color: c.accentInk }}>
                    {safeWebsite}
                  </Link>
                </>
              ) : null}
            </Text>
            {audience.showGovernanceDisclaimer ? (
              <Text style={{ fontSize: 11, color: c.textMuted }}>
                {safeReport.branding.disclaimer}
              </Text>
            ) : null}
          </Column>
        </Column>
      );
    }

    return null;
  };

  const orderedSections = audience.sectionOrder;

  if (mode === 'canvas') {
    const extraTitleLines = Math.max(0, Math.ceil(safeReport.title.length / 56) - 1);
    const extraSubtitleLines = Math.max(0, Math.ceil(safeReport.subtitle.length / 88) - 1);
    const dynamicHeight = Math.max(800, 800 + extraTitleLines * 36 + extraSubtitleLines * 24);

    return (
      <Canvas
        theme={hyperTheme}
        width={1200}
        height={dynamicHeight}
        title={reportDocTitle}
        lang="en"
      >
        <Column style={{ padding: [24, 28], gap: 16 }}>
          <NexoraCoverBanner payloadJson={payloadJson} target="canvas" />
          <NexoraHeroKpi payloadJson={payloadJson} target="canvas" />
          <NexoraKpiStrip payloadJson={payloadJson} target="canvas" />
          <Text
            style={{
              fontFamily: theme.typography.monoFont,
              fontSize: 11,
              color: c.textMuted,
              textAlign: 'center',
            }}
          >
            {`Generated by NEXORA Signature · ${audience.name} · Theme: ${theme.name}`}
          </Text>
        </Column>
      </Canvas>
    );
  }

  if (mode === 'document') {
    // Dynamic, weighted pagination honoring exact stakeholder sectionOrder & emitting zero empty pages
    const pageBuckets: React.ReactNode[][] = [];
    let currentBucket: React.ReactNode[] = [
      <NexoraCoverBanner key="cover" payloadJson={payloadJson} target="document" />,
      <NexoraHeroKpi key="hero" payloadJson={payloadJson} target="document" />,
      <NexoraKpiStrip key="kpi-strip" payloadJson={payloadJson} target="document" />,
    ];
    let currentWeight = 62;
    const maxPageWeight = 88;

    const pushItem = (node: React.ReactNode, weight: number) => {
      if (!node) return;
      if (currentBucket.length > 0 && currentWeight + weight > maxPageWeight) {
        pageBuckets.push(currentBucket);
        currentBucket = [];
        currentWeight = 0;
      }
      currentBucket.push(node);
      currentWeight += weight;
    };

    for (const key of orderedSections) {
      if (key === 'intelligence') {
        const obsNode = renderSectionNode('intelligence', 'trend-observations');
        if (obsNode) pushItem(obsNode, SECTION_WEIGHTS['intelligence-observations']);
        const recNode = renderSectionNode('intelligence', 'recommendations');
        if (recNode) pushItem(recNode, SECTION_WEIGHTS['intelligence-recommendations']);
      } else {
        const node = renderSectionNode(key);
        if (node) pushItem(node, SECTION_WEIGHTS[key] ?? 32);
      }
    }

    if (currentBucket.length > 0) {
      pageBuckets.push(currentBucket);
    }

    const nonEmptyBuckets = pageBuckets.filter((b) => b.length > 0);
    const omitChrome = options?.omitDomRunningChrome === true;

    return (
      <Document
        theme={hyperTheme}
        size="A4"
        orientation="portrait"
        margin={[16, 12, 16, 12]}
        title={reportDocTitle}
        lang="en"
        style={{ gap: 16 }}
      >
        {!omitChrome ? (
          <PageHeader style={{ padding: [0, 0, 8, 0] }}>
            <Row stackOnMobile={false} style={{ gap: 8, alignItems: 'center' }}>
              <Column style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.typography.monoFont, fontSize: 10, color: c.textMuted }}>
                  {`${safeReport.branding.companyName} · ${audience.name}`}
                </Text>
              </Column>
              <Column style={{ flex: 'none' }}>
                <Text
                  style={{
                    fontFamily: theme.typography.monoFont,
                    fontSize: 10,
                    color: c.textMuted,
                    textAlign: 'right',
                  }}
                >
                  {safeReport.reportingPeriod}
                </Text>
              </Column>
            </Row>
          </PageHeader>
        ) : null}

        {!omitChrome ? (
          <PageFooter style={{ padding: [8, 0, 0, 0] }}>
            <Row stackOnMobile={false} style={{ gap: 8, alignItems: 'center' }}>
              <Column style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.typography.monoFont, fontSize: 10, color: c.textMuted }}>
                  {`Generated by NEXORA Signature · Theme: ${theme.name}`}
                </Text>
              </Column>
              <Column style={{ flex: 'none' }}>
                <Text
                  style={{
                    fontFamily: theme.typography.monoFont,
                    fontSize: 10,
                    color: c.textMuted,
                    textAlign: 'right',
                  }}
                >
                  Page <PageNumber /> of <PageNumber total />
                </Text>
              </Column>
            </Row>
          </PageFooter>
        ) : null}

        {nonEmptyBuckets.map((bucket, idx) => (
          <React.Fragment key={`doc-page-${idx}`}>
            {idx > 0 ? <PageBreak /> : null}
            {bucket}
          </React.Fragment>
        ))}
      </Document>
    );
  }

  const footerAttribution = (
    <Text
      style={{
        fontFamily: theme.typography.monoFont,
        fontSize: 11,
        color: c.textMuted,
        textAlign: 'center',
        padding: [6, 0, 14, 0],
      }}
    >
      {`Generated by NEXORA Signature · ${audience.name} · Theme: ${theme.name}`}
    </Text>
  );

  if (mode === 'email') {
    return (
      <Email
        theme={hyperTheme}
        width={640}
        previewText={previewText}
        title={reportDocTitle}
        lang="en"
        style={{ gap: 12 }}
      >
        <NexoraCoverBanner payloadJson={payloadJson} target="email" />
        <NexoraHeroKpi payloadJson={payloadJson} target="email" />
        <NexoraKpiStrip payloadJson={payloadJson} target="email" />
        {orderedSections.map((k) => renderSectionNode(k))}
        {footerAttribution}
      </Email>
    );
  }

  return (
    <Page
      theme={hyperTheme}
      width={1000}
      title={reportDocTitle}
      description={previewText}
      lang="en"
      style={{ gap: 18 }}
    >
      <Column style={{ padding: [18, 0, 0, 0] }}>
        <NexoraCoverBanner payloadJson={payloadJson} target="web" />
      </Column>
      <NexoraHeroKpi payloadJson={payloadJson} target="web" />
      <NexoraKpiStrip payloadJson={payloadJson} target="web" />
      {orderedSections.map((k) => renderSectionNode(k))}
      {footerAttribution}
    </Page>
  );
}
