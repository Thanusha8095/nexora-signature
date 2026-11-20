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
  computeReportMetrics,
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
import { sanitizeHttpUrl } from '../core/security.ts';
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
      {prefix ? <Span style={{ color: c.accent }}>{prefix}</Span> : null}
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

/**
 * Builds the canonical @hyper-elements/react root element (<Email>, <Page>, <Document>, or <Canvas>)
 * from the shared NEXORA ReportInputData model.
 */
export function buildNexoraReportTree(
  report: ReportInputData,
  mode: NexoraRootMode
): React.ReactElement {
  const rawMetrics = computeReportMetrics(report);
  const { spec: theme, theme: hyperTheme } = buildHyperTheme(report);
  const audience = getAudienceEdition(report.audienceEdition);
  const redact = audience.redactInternalExpenses;

  const trendAnalysis = filterTrendForAudience(
    computeTrendAnalysis(report, rawMetrics),
    redact
  );
  const rawInsights = generateExecutiveInsights(report, rawMetrics);
  const insights = filterInsightsForAudience(rawInsights, trendAnalysis, redact);
  const recommendations = filterRecommendationsForAudience(
    generateStrategicRecommendations(report, rawMetrics, rawInsights),
    redact
  );

  const safeReportForPayload: ReportInputData = redact
    ? {
        ...report,
        currentPeriod: { ...report.currentPeriod, expenses: 0 },
        previousPeriod: { ...report.previousPeriod, expenses: 0 },
        monthlySeries: report.monthlySeries.map((m) => ({ ...m, expenses: 0 })),
        expenseCategories: [],
        segments: report.segments.map((s) => ({ ...s, marginPct: 0 })),
        simulation: undefined,
      }
    : report;

  const metrics = redact
    ? {
        ...rawMetrics,
        netProfit: 0,
        previousNetProfit: 0,
        profitMarginPct: 0,
        previousProfitMarginPct: 0,
        marginDeltaPts: 0,
        expenseGrowthPct: null,
        profitGrowthPct: null,
        operatingExpenseRatioPct: 0,
        averageMonthlyProfit: 0,
        monthlyWithProfit: rawMetrics.monthlyWithProfit.map((m) => ({
          ...m,
          expenses: 0,
          netProfit: 0,
          marginPct: 0,
        })),
        expenseCategoriesComputed: [],
        expenseCategoryTotal: 0,
        segmentsComputed: rawMetrics.segmentsComputed.map((s) => ({ ...s, marginPct: 0 })),
        bestMonth: rawMetrics.bestMonth
          ? { ...rawMetrics.bestMonth, expenses: 0, netProfit: 0, marginPct: 0 }
          : null,
        worstMonth: rawMetrics.worstMonth
          ? { ...rawMetrics.worstMonth, expenses: 0, netProfit: 0, marginPct: 0 }
          : null,
      }
    : rawMetrics;

  const c = theme.colors;
  const cur = report.currency;

  const payload: SerializedReportPayload = {
    report: safeReportForPayload,
    metrics,
    trendAnalysis,
    insights,
    recommendations,
    accentOverride: report.branding.accentColor,
  };
  const payloadJson = JSON.stringify(payload);
  const compact = mode === 'email';

  const comparisonHeaders = [
    'Financial Metric',
    report.reportingPeriod,
    report.previousPeriodLabel,
    'Period Change',
  ];

  const rawComparisonRows: { sensitive: boolean; row: string[] }[] = [
    {
      sensitive: false,
      row: [
        'Total Revenue',
        formatCurrency(report.currentPeriod.revenue, cur, { compact }),
        formatCurrency(report.previousPeriod.revenue, cur, { compact }),
        formatPercent(metrics.revenueGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: true,
      row: [
        'Operating Expenses',
        formatCurrency(report.currentPeriod.expenses, cur, { compact }),
        formatCurrency(report.previousPeriod.expenses, cur, { compact }),
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
        formatNumber(report.currentPeriod.customerCount),
        formatNumber(report.previousPeriod.customerCount),
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
    .filter((entry) => !(audience.redactInternalExpenses && entry.sensitive))
    .map((entry) => entry.row);

  const segmentHeaders = audience.redactInternalExpenses
    ? ['Operating Segment', 'Segment Revenue', 'Mix Share', 'YoP Growth']
    : ['Operating Segment', 'Segment Revenue', 'Mix Share', 'YoP Growth', 'Net Margin'];

  const segmentRows: string[][] = metrics.segmentsComputed.map((seg) =>
    audience.redactInternalExpenses
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

  const prioritiesHeaders = ['Priority Initiative', 'Horizon', 'Owner', 'Expected Impact'];
  const prioritiesRows: string[][] = report.strategicPriorities.map((sp) => [
    sp.title,
    sp.horizon,
    sp.owner,
    sp.targetImpact,
  ]);

  const safeWebsite = sanitizeHttpUrl(report.branding.website);
  const previewText = `${report.branding.companyName} (${audience.name}) · ${report.reportingPeriod} — Revenue ${formatCurrency(report.currentPeriod.revenue, cur)}, ${formatNumber(report.currentPeriod.customerCount)} customers.`;
  const reportDocTitle = `${report.branding.companyName} — ${report.title}`;

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
            borderRadius: 8,
            padding: compact ? [16, 18] : [22, 24],
            gap: 10,
          }}
        >
          {renderSectionHeading(idx, 'Executive Summary', theme)}
          <Text style={{ fontSize: 14, lineHeight: 1.6, color: c.text }}>
            <Span style={{ fontWeight: 700 }}>Overview: </Span>
            {report.narrative.overview}
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: c.textMuted }}>
            <Span style={{ fontWeight: 700, color: c.text }}>Key Achievements: </Span>
            {report.narrative.achievements}
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: c.textMuted }}>
            <Span style={{ fontWeight: 700, color: c.text }}>Operational Challenges: </Span>
            {report.narrative.challenges}
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
            audience.redactInternalExpenses
              ? 'Revenue Trajectory'
              : 'Financial Performance & Monthly Trajectory',
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
      const idx = headingCounter++;
      return (
        <Column
          key="comparison"
          style={{
            backgroundColor: c.surface,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: 8,
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
            borderRadius: 8,
            padding: compact ? [14, 16] : [20, 22],
            gap: 12,
          }}
        >
          {renderSectionHeading(
            idx,
            audience.redactInternalExpenses
              ? 'Operating Segment Reach'
              : 'Segment Contribution & Unit Margin',
            theme
          )}
          {renderDataTable(segmentHeaders, segmentRows, theme, compact)}
        </Column>
      );
    }

    if (key === 'intelligence') {
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
            borderRadius: 8,
            padding: compact ? [14, 16] : [20, 22],
            gap: 12,
          }}
        >
          {renderSectionHeading(idx, 'Leadership Strategic Priorities', theme)}
          {renderDataTable(prioritiesHeaders, prioritiesRows, theme, compact)}
        </Column>
      );
    }

    if (key === 'simulation') {
      if (!report.simulation?.includeInReport || audience.redactInternalExpenses) return null;
      return <NexoraSimulationAppendix key="simulation" payloadJson={payloadJson} target={mode} />;
    }

    if (key === 'closing') {
      return (
        <Column
          key="closing"
          style={{
            backgroundColor: c.elevated,
            border: { width: 1, style: 'solid', color: c.border },
            borderRadius: 8,
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
            Closing Executive Takeaway
          </Heading>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: c.text }}>
            {report.narrative.closingTakeaway}
          </Text>
          <Divider style={{ borderTop: { width: 1, style: 'solid', color: c.border } }} />
          <Column style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: c.text }}>
              {`${report.branding.companyName} · ${report.branding.preparedBy}`}
            </Text>
            <Text style={{ fontSize: 12, color: c.textMuted }}>
              {report.branding.contactEmail}
              {safeWebsite ? (
                <>
                  {' · '}
                  <Link href={safeWebsite} style={{ color: c.accent }}>
                    {safeWebsite}
                  </Link>
                </>
              ) : null}
            </Text>
            {audience.showGovernanceDisclaimer ? (
              <Text style={{ fontSize: 11, color: c.textMuted }}>
                {report.branding.disclaimer}
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
    return (
      <Canvas
        theme={hyperTheme}
        width={1200}
        height={800}
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
    const page1Keys: ReportSectionKey[] = [];
    const page2Keys: ReportSectionKey[] = [];
    const page3Nodes: React.ReactNode[] = [];
    const page4Nodes: React.ReactNode[] = [];
    const hasSimulationAppendix = Boolean(
      report.simulation?.includeInReport && !audience.redactInternalExpenses
    );

    for (const key of orderedSections) {
      if (key === 'story-arc' || key === 'summary') {
        page1Keys.push(key);
      } else if (key === 'trends' || key === 'breakdowns' || key === 'comparison' || key === 'segments') {
        page2Keys.push(key);
      } else if (key === 'intelligence') {
        page3Nodes.push(renderSectionNode('intelligence', 'trend-observations'));
        page4Nodes.push(renderSectionNode('intelligence', 'recommendations'));
      } else if (key === 'priorities' || (!hasSimulationAppendix && key === 'closing')) {
        page4Nodes.push(renderSectionNode(key));
      } else if (key === 'simulation' || (hasSimulationAppendix && key === 'closing')) {
        // Rendered on Page 5 when simulation appendix is active
      } else {
        page4Nodes.push(renderSectionNode(key));
      }
    }

    return (
      <Document
        theme={hyperTheme}
        size="A4"
        orientation="portrait"
        margin={[14, 12, 16, 12]}
        title={reportDocTitle}
        lang="en"
        style={{ gap: 16 }}
      >
        <PageHeader style={{ padding: [0, 0, 8, 0] }}>
          <Row stackOnMobile={false} style={{ gap: 8, alignItems: 'center' }}>
            <Column style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.typography.monoFont, fontSize: 10, color: c.textMuted }}>
                {`${report.branding.companyName} · ${audience.name}`}
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
                {report.reportingPeriod}
              </Text>
            </Column>
          </Row>
        </PageHeader>

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

        <NexoraCoverBanner payloadJson={payloadJson} target="document" />
        <NexoraHeroKpi payloadJson={payloadJson} target="document" />
        <NexoraKpiStrip payloadJson={payloadJson} target="document" />
        {page1Keys.map((k) => renderSectionNode(k))}

        <PageBreak />
        {page2Keys.map((k) => renderSectionNode(k))}

        <PageBreak />
        {page3Nodes}

        <PageBreak />
        {page4Nodes}

        {hasSimulationAppendix ? (
          <>
            <PageBreak />
            {renderSectionNode('simulation')}
            {renderSectionNode('closing')}
          </>
        ) : null}
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
