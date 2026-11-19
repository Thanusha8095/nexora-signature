import React from 'react';
import {
  Column,
  ColumnLayouts,
  Divider,
  Document,
  Email,
  Heading,
  Html,
  Page,
  PageBreak,
  Paragraph,
  Row,
  Table,
  UnlayerProvider,
} from '@unlayer/react-elements';
import { getAudienceEdition, type ReportSectionKey } from '../core/audiences.ts';
import {
  computeReportMetrics,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../core/calculations.ts';
import {
  computeTrendAnalysis,
  generateExecutiveInsights,
  generateStrategicRecommendations,
} from '../core/intelligence.ts';
import { escapeHtml, toSafeHtmlBasic } from '../core/security.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type { ReportInputData } from '../core/types.ts';
import {
  buildClosingFooterHtml,
  NexoraBreakdownChart,
  NexoraCoverBanner,
  NexoraHeroKpi,
  NexoraInsightsBlock,
  NexoraKpiStrip,
  NexoraSimulationAppendix,
  NexoraStoryArc,
  NexoraTrendChart,
  type SerializedReportPayload,
} from './tools.tsx';

export type UnlayerRootMode = 'email' | 'web' | 'document';

const ROMAN_NUMERALS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.'];

function sectionHeading(
  index: number,
  title: string,
  layoutStyle: string,
  headingFont: string,
  textColor: string,
  accentColor: string
): React.ReactNode {
  const roman = ROMAN_NUMERALS[index] ?? `${index + 1}.`;
  const numeric = `0${index + 1}`;
  const prefix =
    layoutStyle === 'editorial-broadsheet'
      ? `${roman} `
      : layoutStyle === 'swiss-precision'
        ? `${numeric} / `
        : '';
  return (
    <Heading
      level="h2"
      fontFamily={headingFont}
      fontSize="20px"
      fontWeight="600"
      color={textColor}
      containerPadding="10px 0 6px 0"
    >
      {prefix ? <span style={{ color: accentColor }}>{prefix}</span> : null}
      {title}
    </Heading>
  );
}

export function buildNexoraReportTree(
  report: ReportInputData,
  mode: UnlayerRootMode
): React.ReactElement {
  const metrics = computeReportMetrics(report);
  const trendAnalysis = computeTrendAnalysis(report, metrics);
  const insights = generateExecutiveInsights(report, metrics);
  const recommendations = generateStrategicRecommendations(report, metrics, insights);
  const theme = resolveBrandTheme(report);
  const audience = getAudienceEdition(report.audienceEdition);
  const c = theme.colors;
  const cur = report.currency;

  const payload: SerializedReportPayload = {
    report,
    metrics,
    trendAnalysis,
    insights,
    recommendations,
    accentOverride: report.branding.accentColor,
  };
  const payloadJson = JSON.stringify(payload);

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
        formatCurrency(report.currentPeriod.revenue, cur),
        formatCurrency(report.previousPeriod.revenue, cur),
        formatPercent(metrics.revenueGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: true,
      row: [
        'Operating Expenses',
        formatCurrency(report.currentPeriod.expenses, cur),
        formatCurrency(report.previousPeriod.expenses, cur),
        formatPercent(metrics.expenseGrowthPct, { signed: true }),
      ],
    },
    {
      sensitive: true,
      row: [
        'Net Profit',
        formatCurrency(metrics.netProfit, cur),
        formatCurrency(metrics.previousNetProfit, cur),
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
        metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A',
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
          formatCurrency(seg.revenue, cur),
          `${seg.sharePct.toFixed(1)}%`,
          formatPercent(seg.growthPct, { signed: true }),
        ]
      : [
          seg.name,
          formatCurrency(seg.revenue, cur),
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

  const padRow = mode === 'email' ? '10px 14px' : '12px 24px';
  const fonts = [{ url: theme.typography.googleFontsUrl }];
  const previewText = `${report.branding.companyName} (${audience.name}) · ${report.reportingPeriod} — Revenue ${formatCurrency(report.currentPeriod.revenue, cur)}, ${formatNumber(report.currentPeriod.customerCount)} customers.`;

  const cardBorder = {
    borderTopWidth: '1px',
    borderTopStyle: 'solid' as const,
    borderTopColor: c.border,
    borderRightWidth: '1px',
    borderRightStyle: 'solid' as const,
    borderRightColor: c.border,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: c.border,
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid' as const,
    borderLeftColor: c.border,
  };

  let headingCounter = 0;

  const renderSection = (key: ReportSectionKey): React.ReactNode => {
    if (key === 'story-arc') {
      return (
        <Row key="story-arc" padding={padRow}>
          <Column>
            <NexoraStoryArc payloadJson={payloadJson} />
          </Column>
        </Row>
      );
    }

    if (key === 'summary') {
      const idx = headingCounter++;
      return (
        <Row key="summary" padding={padRow}>
          <Column
            backgroundColor={c.surface}
            padding={mode === 'email' ? '16px' : '22px'}
            borderRadius="8px"
            border={cardBorder}
          >
            {sectionHeading(idx, 'Executive Summary', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
            <Paragraph
              fontFamily={theme.typography.bodyFont}
              fontSize="14px"
              lineHeight="1.65"
              color={c.text}
              containerPadding="4px 0 10px 0"
              html={`<strong>Overview:</strong> ${escapeHtml(report.narrative.overview)}`}
            />
            <Paragraph
              fontFamily={theme.typography.bodyFont}
              fontSize="14px"
              lineHeight="1.65"
              color={c.textMuted}
              containerPadding="0 0 8px 0"
              html={`<strong style="color:${c.text};">Key Achievements:</strong> ${escapeHtml(report.narrative.achievements)}`}
            />
            <Paragraph
              fontFamily={theme.typography.bodyFont}
              fontSize="14px"
              lineHeight="1.65"
              color={c.textMuted}
              containerPadding="0"
              html={`<strong style="color:${c.text};">Operational Challenges:</strong> ${escapeHtml(report.narrative.challenges)}`}
            />
          </Column>
        </Row>
      );
    }

    if (key === 'trends') {
      const idx = headingCounter++;
      return (
        <Row key="trends" padding={padRow}>
          <Column>
            {sectionHeading(
              idx,
              audience.redactInternalExpenses
                ? 'Revenue Trajectory'
                : 'Financial Performance & Monthly Trajectory',
              theme.layoutStyle,
              theme.typography.headingFont,
              c.text,
              c.accent
            )}
            <NexoraTrendChart payloadJson={payloadJson} />
          </Column>
        </Row>
      );
    }

    if (key === 'breakdowns') {
      return (
        <Row key="breakdowns" padding={padRow}>
          <Column>
            <NexoraBreakdownChart payloadJson={payloadJson} />
          </Column>
        </Row>
      );
    }

    if (key === 'comparison') {
      const idx = headingCounter++;
      return (
        <Row key="comparison" padding={padRow}>
          <Column
            backgroundColor={c.surface}
            padding={mode === 'email' ? '14px' : '20px'}
            borderRadius="8px"
            border={cardBorder}
          >
            {sectionHeading(idx, 'Period-over-Period Comparison', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
            <Table
              headers={comparisonHeaders}
              data={comparisonRows}
              enableHeader={true}
              repeatHeaderOnEachPage={true}
              stripedRows={true}
              stripedRowsBackgroundColor={c.tableStripeBg}
              headerBackgroundColor={c.tableHeaderBg}
              headerColor={c.tableHeaderText}
              headerPadding="10px 12px"
              contentBackgroundColor={c.surface}
              contentColor={c.text}
              contentFontSize="13px"
              contentPadding="10px 12px"
              border={cardBorder}
            />
          </Column>
        </Row>
      );
    }

    if (key === 'segments') {
      if (segmentRows.length === 0) return null;
      const idx = headingCounter++;
      return (
        <Row key="segments" padding={padRow}>
          <Column
            backgroundColor={c.surface}
            padding={mode === 'email' ? '14px' : '20px'}
            borderRadius="8px"
            border={cardBorder}
          >
            {sectionHeading(
              idx,
              audience.redactInternalExpenses
                ? 'Operating Segment Reach'
                : 'Segment Contribution & Unit Margin',
              theme.layoutStyle,
              theme.typography.headingFont,
              c.text,
              c.accent
            )}
            <Table
              headers={segmentHeaders}
              data={segmentRows}
              enableHeader={true}
              repeatHeaderOnEachPage={true}
              stripedRows={true}
              stripedRowsBackgroundColor={c.tableStripeBg}
              headerBackgroundColor={c.tableHeaderBg}
              headerColor={c.tableHeaderText}
              headerPadding="10px 12px"
              contentBackgroundColor={c.surface}
              contentColor={c.text}
              contentFontSize="13px"
              contentPadding="10px 12px"
              border={cardBorder}
            />
          </Column>
        </Row>
      );
    }

    if (key === 'intelligence') {
      const idx = headingCounter++;
      return (
        <Row key="intelligence" padding={padRow}>
          <Column>
            {sectionHeading(idx, 'Executive Intelligence & Analytical Advisory', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
            <NexoraInsightsBlock payloadJson={payloadJson} />
          </Column>
        </Row>
      );
    }

    if (key === 'priorities') {
      const idx = headingCounter++;
      return (
        <Row key="priorities" padding={padRow}>
          <Column
            backgroundColor={c.surface}
            padding={mode === 'email' ? '14px' : '20px'}
            borderRadius="8px"
            border={cardBorder}
          >
            {sectionHeading(idx, 'Leadership Strategic Priorities', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
            <Table
              headers={prioritiesHeaders}
              data={prioritiesRows}
              enableHeader={true}
              repeatHeaderOnEachPage={true}
              stripedRows={true}
              stripedRowsBackgroundColor={c.tableStripeBg}
              headerBackgroundColor={c.tableHeaderBg}
              headerColor={c.tableHeaderText}
              headerPadding="10px 12px"
              contentBackgroundColor={c.surface}
              contentColor={c.text}
              contentFontSize="13px"
              contentPadding="10px 12px"
              border={cardBorder}
            />
          </Column>
        </Row>
      );
    }

    if (key === 'simulation') {
      if (!report.simulation?.includeInReport || audience.redactInternalExpenses) return null;
      return (
        <Row key="simulation" padding={padRow}>
          <Column>
            <NexoraSimulationAppendix payloadJson={payloadJson} />
          </Column>
        </Row>
      );
    }

    if (key === 'closing') {
      return (
        <Row key="closing" padding={padRow}>
          <Column
            backgroundColor={c.elevated}
            padding={mode === 'email' ? '16px' : '22px'}
            borderRadius="8px"
            border={cardBorder}
          >
            <Heading
              level="h3"
              fontFamily={theme.typography.headingFont}
              fontSize="16px"
              fontWeight="600"
              color={c.text}
              containerPadding="0 0 6px 0"
            >
              Closing Executive Takeaway
            </Heading>
            <Paragraph
              fontFamily={theme.typography.bodyFont}
              fontSize="14px"
              lineHeight="1.6"
              color={c.text}
              containerPadding="0 0 12px 0"
              text={report.narrative.closingTakeaway}
            />
            <Divider borderTopWidth="1px" borderTopColor={c.border} width="100%" containerPadding="4px 0 8px 0" />
            <Html
              html={buildClosingFooterHtml(report, theme, audience.showGovernanceDisclaimer)}
              containerPadding="0"
            />
          </Column>
        </Row>
      );
    }

    return null;
  };

  const renderSectionInsideColumn = (key: ReportSectionKey): React.ReactNode => {
    if (key === 'summary') {
      const idx = headingCounter++;
      return (
        <>
          {sectionHeading(idx, 'Executive Summary', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
          <Paragraph
            fontFamily={theme.typography.bodyFont}
            fontSize="14px"
            lineHeight="1.65"
            color={c.text}
            containerPadding="4px 0 10px 0"
            html={`<strong>Overview:</strong> ${escapeHtml(report.narrative.overview)}`}
          />
          <Paragraph
            fontFamily={theme.typography.bodyFont}
            fontSize="14px"
            lineHeight="1.65"
            color={c.textMuted}
            containerPadding="0 0 8px 0"
            html={`<strong style="color:${c.text};">Key Achievements:</strong> ${escapeHtml(report.narrative.achievements)}`}
          />
          <Paragraph
            fontFamily={theme.typography.bodyFont}
            fontSize="14px"
            lineHeight="1.65"
            color={c.textMuted}
            containerPadding="0"
            html={`<strong style="color:${c.text};">Operational Challenges:</strong> ${escapeHtml(report.narrative.challenges)}`}
          />
        </>
      );
    }
    if (key === 'comparison') {
      const idx = headingCounter++;
      return (
        <>
          {sectionHeading(idx, 'Period-over-Period Comparison', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
          <Table
            headers={comparisonHeaders}
            data={comparisonRows}
            enableHeader={true}
            repeatHeaderOnEachPage={true}
            stripedRows={true}
            stripedRowsBackgroundColor={c.tableStripeBg}
            headerBackgroundColor={c.tableHeaderBg}
            headerColor={c.tableHeaderText}
            headerPadding="10px 12px"
            contentBackgroundColor={c.surface}
            contentColor={c.text}
            contentFontSize="13px"
            contentPadding="10px 12px"
            border={cardBorder}
          />
        </>
      );
    }
    if (key === 'segments') {
      if (segmentRows.length === 0) return null;
      const idx = headingCounter++;
      return (
        <>
          {sectionHeading(
            idx,
            audience.redactInternalExpenses
              ? 'Operating Segment Reach'
              : 'Segment Contribution & Unit Margin',
            theme.layoutStyle,
            theme.typography.headingFont,
            c.text,
            c.accent
          )}
          <Table
            headers={segmentHeaders}
            data={segmentRows}
            enableHeader={true}
            repeatHeaderOnEachPage={true}
            stripedRows={true}
            stripedRowsBackgroundColor={c.tableStripeBg}
            headerBackgroundColor={c.tableHeaderBg}
            headerColor={c.tableHeaderText}
            headerPadding="10px 12px"
            contentBackgroundColor={c.surface}
            contentColor={c.text}
            contentFontSize="13px"
            contentPadding="10px 12px"
            border={cardBorder}
          />
        </>
      );
    }
    if (key === 'priorities') {
      const idx = headingCounter++;
      return (
        <>
          {sectionHeading(idx, 'Leadership Strategic Priorities', theme.layoutStyle, theme.typography.headingFont, c.text, c.accent)}
          <Table
            headers={prioritiesHeaders}
            data={prioritiesRows}
            enableHeader={true}
            repeatHeaderOnEachPage={true}
            stripedRows={true}
            stripedRowsBackgroundColor={c.tableStripeBg}
            headerBackgroundColor={c.tableHeaderBg}
            headerColor={c.tableHeaderText}
            headerPadding="10px 12px"
            contentBackgroundColor={c.surface}
            contentColor={c.text}
            contentFontSize="13px"
            contentPadding="10px 12px"
            border={cardBorder}
          />
        </>
      );
    }
    return null;
  };

  const renderCustomSectionContent = (key: ReportSectionKey): React.ReactNode => {
    if (key === 'story-arc') {
      return <NexoraStoryArc payloadJson={payloadJson} />;
    }
    if (key === 'trends') {
      const idx = headingCounter++;
      return (
        <>
          {sectionHeading(
            idx,
            audience.redactInternalExpenses
              ? 'Revenue Trajectory'
              : 'Financial Performance & Monthly Trajectory',
            theme.layoutStyle,
            theme.typography.headingFont,
            c.text,
            c.accent
          )}
          <NexoraTrendChart payloadJson={payloadJson} />
        </>
      );
    }
    if (key === 'breakdowns') {
      return <NexoraBreakdownChart payloadJson={payloadJson} />;
    }
    if (key === 'intelligence') {
      const idx = headingCounter++;
      return (
        <>
          {sectionHeading(
            idx,
            'Executive Intelligence & Analytical Advisory',
            theme.layoutStyle,
            theme.typography.headingFont,
            c.text,
            c.accent
          )}
          <NexoraInsightsBlock payloadJson={payloadJson} />
        </>
      );
    }
    if (key === 'simulation') {
      if (!report.simulation?.includeInReport || audience.redactInternalExpenses) return null;
      return <NexoraSimulationAppendix payloadJson={payloadJson} />;
    }
    return null;
  };

  const orderedSections = audience.sectionOrder;
  const breakAfterIndexA = 1;
  const breakAfterIndexB = Math.max(3, Math.floor(orderedSections.length * 0.65));

  const buildEmailNodes = (): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    let bufferedCustom: React.ReactNode[] = [];
    let bufferedSurface: React.ReactNode[] = [];
    let groupIdx = 0;

    const flushCustom = () => {
      if (bufferedCustom.length > 0) {
        out.push(
          <Row key={`email-custom-${groupIdx++}`} padding={padRow}>
            <Column>{bufferedCustom}</Column>
          </Row>
        );
        bufferedCustom = [];
      }
    };

    const flushSurface = () => {
      if (bufferedSurface.length > 0) {
        out.push(
          <Row key={`email-surface-${groupIdx++}`} padding={padRow}>
            <Column
              backgroundColor={c.surface}
              padding="14px"
              borderRadius="8px"
              border={cardBorder}
            >
              {bufferedSurface}
            </Column>
          </Row>
        );
        bufferedSurface = [];
      }
    };

    const remainingSections =
      orderedSections[0] === 'story-arc' ? orderedSections.slice(1) : orderedSections;

    for (const sectionKey of remainingSections) {
      if (
        sectionKey === 'story-arc' ||
        sectionKey === 'trends' ||
        sectionKey === 'breakdowns' ||
        sectionKey === 'intelligence' ||
        sectionKey === 'simulation'
      ) {
        flushSurface();
        const inner = renderCustomSectionContent(sectionKey);
        if (inner) {
          bufferedCustom.push(<React.Fragment key={sectionKey}>{inner}</React.Fragment>);
        }
      } else if (
        sectionKey === 'summary' ||
        sectionKey === 'comparison' ||
        sectionKey === 'segments' ||
        sectionKey === 'priorities'
      ) {
        flushCustom();
        const inner = renderSectionInsideColumn(sectionKey);
        if (inner) {
          if (bufferedSurface.length > 0) {
            bufferedSurface.push(
              <Divider
                key={`div-${sectionKey}`}
                borderTopWidth="1px"
                borderTopColor={c.border}
                width="100%"
                containerPadding="12px 0 4px 0"
              />
            );
          }
          bufferedSurface.push(<React.Fragment key={sectionKey}>{inner}</React.Fragment>);
        }
      } else {
        flushCustom();
        flushSurface();
        const node = renderSection(sectionKey);
        if (node) out.push(node);
      }
    }
    flushCustom();
    flushSurface();
    return out;
  };

  const innerRows =
    mode === 'email' ? (
      <>
        <Row padding="10px 10px 4px 10px">
          <Column>
            <NexoraCoverBanner payloadJson={payloadJson} />
            <NexoraHeroKpi payloadJson={payloadJson} />
            <NexoraKpiStrip payloadJson={payloadJson} />
            {orderedSections[0] === 'story-arc' ? (
              <NexoraStoryArc payloadJson={payloadJson} />
            ) : null}
          </Column>
        </Row>
        {buildEmailNodes()}
        <Row layout={ColumnLayouts.OneColumn} padding="8px 14px 20px 14px">
          <Column>
            <Paragraph
              fontFamily={theme.typography.monoFont}
              fontSize="11px"
              color={c.textMuted}
              textAlign="center"
              text={`Generated by NEXORA Signature · ${audience.name} · Theme: ${theme.name}`}
            />
          </Column>
        </Row>
      </>
    ) : (
      <>
        <Row padding="24px 24px 10px 24px">
          <Column>
            <NexoraCoverBanner payloadJson={payloadJson} />
          </Column>
        </Row>

        <Row padding={padRow}>
          <Column>
            <NexoraHeroKpi payloadJson={payloadJson} />
          </Column>
        </Row>

        <Row padding={padRow}>
          <Column>
            <NexoraKpiStrip payloadJson={payloadJson} />
          </Column>
        </Row>

        {orderedSections.map((sectionKey, i) => {
          const node = renderSection(sectionKey);
          if (!node) return null;
          const needsBreak =
            mode === 'document' && (i === breakAfterIndexA || i === breakAfterIndexB);
          return (
            <React.Fragment key={sectionKey}>
              {node}
              {needsBreak ? (
                <Row padding="0">
                  <Column>
                    <PageBreak />
                  </Column>
                </Row>
              ) : null}
            </React.Fragment>
          );
        })}

        <Row layout={ColumnLayouts.OneColumn} padding="8px 24px 28px 24px">
          <Column>
            <Paragraph
              fontFamily={theme.typography.monoFont}
              fontSize="11px"
              color={c.textMuted}
              textAlign="center"
              text={`Generated by NEXORA Signature · ${audience.name} · Theme: ${theme.name}`}
            />
          </Column>
        </Row>
      </>
    );

  if (mode === 'email') {
    return (
      <UnlayerProvider config={{ mode: 'email', toSafeHtml: toSafeHtmlBasic }}>
        <Email
          backgroundColor={c.canvas}
          contentWidth="640px"
          previewText={previewText}
          fonts={fonts}
          fontFamily={{ label: theme.typography.bodyFont, value: theme.typography.bodyFont }}
          textColor={c.text}
        >
          {innerRows}
        </Email>
      </UnlayerProvider>
    );
  }

  if (mode === 'document') {
    return (
      <UnlayerProvider config={{ mode: 'document', toSafeHtml: toSafeHtmlBasic }}>
        <Document
          backgroundColor={c.canvas}
          contentWidth="760px"
          documentSize="A4"
          documentOrientation="portrait"
          fonts={fonts}
          fontFamily={{ label: theme.typography.bodyFont, value: theme.typography.bodyFont }}
          textColor={c.text}
        >
          {innerRows}
        </Document>
      </UnlayerProvider>
    );
  }

  return (
    <UnlayerProvider config={{ mode: 'web', toSafeHtml: toSafeHtmlBasic }}>
      <Page
        backgroundColor={c.canvas}
        contentWidth="960px"
        fonts={fonts}
        fontFamily={{ label: theme.typography.bodyFont, value: theme.typography.bodyFont }}
        textColor={c.text}
      >
        {innerRows}
      </Page>
    </UnlayerProvider>
  );
}
