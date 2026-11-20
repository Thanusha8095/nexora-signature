// NEXORA report templates built with @unlayer/react-elements.
//
// ONE shared list of sections (`sections`) is mounted under three different
// roots: <Email>, <Page> and <Document>. Only the root changes per output.
// Only components and props confirmed in the package README / type
// declarations are used: Email, Page, Document, Row, Column, ColumnLayouts,
// Heading, Paragraph, Button, renderToHtml, renderToPlainText.
import React from 'react';
import {
  Email,
  Page,
  Document,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Button,
  renderToHtml,
  renderToPlainText,
} from '@unlayer/react-elements';
import { chartHtml, footerHtml, headerHtml, insightsHtml, kpiHtml, summaryHtml, themeOf } from './blocks.js';

function sectionTitle(report, text) {
  const t = themeOf(report);
  return (
    <Heading fontSize="18px" fontFamily={t.headingFont}>
      {text}
    </Heading>
  );
}

/** Builds the ordered <Row> list for a validated report. `mode` is email | web | document. */
export function sections(report, mode) {
  const t = themeOf(report);
  const rows = [];

  rows.push(
    <Row key="header" layout={ColumnLayouts.OneColumn} backgroundColor={t.cardBg} padding="0px">
      <Column>
        <Paragraph html={headerHtml(report)} />
      </Column>
    </Row>,
  );

  rows.push(
    <Row key="summary" layout={ColumnLayouts.OneColumn} backgroundColor={t.cardBg} padding="24px">
      <Column>
        {sectionTitle(report, 'Summary')}
        <Paragraph html={summaryHtml(report)} />
      </Column>
    </Row>,
  );

  rows.push(
    <Row key="kpi-a" layout={ColumnLayouts.ThreeEqual} backgroundColor={t.pageBg} padding="12px">
      <Column>
        <Paragraph html={kpiHtml(report, 'revenue')} />
      </Column>
      <Column>
        <Paragraph html={kpiHtml(report, 'expenses')} />
      </Column>
      <Column>
        <Paragraph html={kpiHtml(report, 'profit')} />
      </Column>
    </Row>,
  );

  rows.push(
    <Row key="kpi-b" layout={ColumnLayouts.TwoEqual} backgroundColor={t.pageBg} padding="12px">
      <Column>
        <Paragraph html={kpiHtml(report, 'customers')} />
      </Column>
      <Column>
        <Paragraph html={kpiHtml(report, 'growth')} />
      </Column>
    </Row>,
  );

  rows.push(
    <Row key="chart" layout={ColumnLayouts.OneColumn} backgroundColor={t.cardBg} padding="24px">
      <Column>
        {sectionTitle(report, report.chart.title)}
        <Paragraph html={chartHtml(report)} />
      </Column>
    </Row>,
  );

  if (report.insights.length > 0) {
    rows.push(
      <Row key="insights" layout={ColumnLayouts.OneColumn} backgroundColor={t.cardBg} padding="24px">
        <Column>
          {sectionTitle(report, 'Key insights')}
          <Paragraph html={insightsHtml(report)} />
        </Column>
      </Row>,
    );
  }

  if (mode !== 'document' && report.company.website) {
    rows.push(
      <Row key="cta" layout={ColumnLayouts.OneColumn} backgroundColor={t.cardBg} padding="16px">
        <Column>
          <Button href={report.company.website} backgroundColor={report.branding.primaryColor} color="#ffffff">
            Visit {report.company.name}
          </Button>
        </Column>
      </Row>,
    );
  }

  rows.push(
    <Row key="footer" layout={ColumnLayouts.OneColumn} backgroundColor={t.pageBg} padding="20px">
      <Column>
        <Paragraph html={footerHtml(report)} />
      </Column>
    </Row>,
  );

  return rows;
}

// Rows are passed as separate children (spread), not as one array.
export function buildEmail(report) {
  const t = themeOf(report);
  return React.createElement(Email, { backgroundColor: t.pageBg, contentWidth: '640px' }, ...sections(report, 'email'));
}

export function buildPage(report) {
  const t = themeOf(report);
  return React.createElement(Page, { backgroundColor: t.pageBg, contentWidth: '900px' }, ...sections(report, 'web'));
}

export function buildDocument(report) {
  const t = themeOf(report);
  return React.createElement(Document, { backgroundColor: t.pageBg, contentWidth: '720px' }, ...sections(report, 'document'));
}

/** Renders a validated report to HTML for one of: email | web | document. */
export function renderHtml(report, format) {
  if (format === 'email') return renderToHtml(buildEmail(report));
  if (format === 'web') return renderToHtml(buildPage(report));
  if (format === 'document') return renderToHtml(buildDocument(report));
  throw new Error(`Unknown format: ${format}`);
}

export function renderEmailText(report) {
  return renderToPlainText(buildEmail(report));
}
