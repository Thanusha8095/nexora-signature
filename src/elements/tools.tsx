import { registerTool } from '@unlayer/react-elements';
import { getAudienceEdition } from '../core/audiences.ts';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../core/calculations.ts';
import { computeTrendAnalysis, filterTrendForAudience } from '../core/intelligence.ts';
import { escapeHtml, sanitizeHttpUrl } from '../core/security.ts';
import { runWhatIfSimulation } from '../core/simulator.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type {
  ComputedMetrics,
  ExecutiveInsight,
  LogoShape,
  MomentumSignal,
  ReportInputData,
  StrategicRecommendation,
  ThemeSpec,
  TrendAnalysisResult,
} from '../core/types.ts';

export interface SerializedReportPayload {
  report: ReportInputData;
  metrics: ComputedMetrics;
  trendAnalysis?: TrendAnalysisResult;
  insights: ExecutiveInsight[];
  recommendations: StrategicRecommendation[];
  accentOverride?: string;
}

function parsePayload(raw: string): SerializedReportPayload | null {
  try {
    return JSON.parse(raw) as SerializedReportPayload;
  } catch {
    return null;
  }
}

function getLogoRadius(shape?: LogoShape): string {
  if (shape === 'circle') return '9999px';
  if (shape === 'square') return '2px';
  return '8px';
}

/**
 * 1. NexoraCoverBanner — Theme-specific Executive Cover Header + Brand DNA + Audience Kicker
 */
export const NexoraCoverBanner = registerTool({
  name: 'nexora_cover_banner',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const company = escapeHtml(report.branding.companyName);
        const tagline = escapeHtml(report.branding.tagline);
        const title = escapeHtml(report.title);
        const subtitle = escapeHtml(report.subtitle);
        const period = escapeHtml(report.reportingPeriod);
        const date = escapeHtml(report.reportDate);
        const classification = escapeHtml(report.branding.classification);
        const kicker = escapeHtml(audience.coverKicker);
        const logoUrl = report.branding.logoDataUrl || '';
        const logoRadius = getLogoRadius(report.branding.logoShape);

        const logoCell = logoUrl
          ? `<td width="56" valign="top" style="padding-right:16px;"><img src="${escapeHtml(logoUrl)}" width="48" height="48" alt="${company} logo" style="display:block;width:48px;height:48px;border-radius:${logoRadius};border:1px solid ${c.border};" /></td>`
          : '';

        const illustrativeNote = report.isIllustrative
          ? `<div style="margin-top:12px;font-size:11px;line-height:1.4;color:${c.textMuted};border-top:1px solid ${c.border};padding-top:8px;">Illustrative sample dataset · Prepared for executive reporting demonstration</div>`
          : '';

        if (theme.layoutStyle === 'editorial-broadsheet') {
          return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border-top:3px solid ${c.text};border-bottom:1px solid ${c.border};">
              <tr>
                <td style="padding:28px 28px 24px 28px;text-align:center;">
                  ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="${company}" style="display:inline-block;width:44px;height:44px;border-radius:${logoRadius};margin-bottom:10px;" />` : ''}
                  <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${c.accent};font-weight:700;">${company}</div>
                  <div style="font-size:11px;color:${c.textMuted};margin-top:4px;">${kicker} · ${classification} · ${period}</div>
                  <div style="height:1px;background-color:${c.border};margin:18px auto;width:84%;"></div>
                  <h1 style="margin:0;font-family:${theme.typography.headingFont};font-size:28px;line-height:1.2;color:${c.text};font-weight:700;">${title}</h1>
                  <p style="margin:10px auto 0 auto;max-width:480px;font-size:14px;line-height:1.5;color:${c.textMuted};">${subtitle}</p>
                  <div style="margin-top:16px;font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};">Published ${date} · ${escapeHtml(report.branding.preparedBy)}</div>
                  ${illustrativeNote}
                </td>
              </tr>
            </table>
          `;
        }

        const topStripe =
          theme.layoutStyle === 'swiss-precision'
            ? `<tr><td style="height:5px;background-color:${c.accent};font-size:1px;line-height:1px;">&nbsp;</td></tr>`
            : '';

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;">
            ${topStripe}
            <tr>
              <td style="padding:26px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${logoCell}
                    <td valign="top">
                      <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${c.accent};">${company}</div>
                      <div style="font-size:12px;color:${c.textMuted};margin-top:2px;">${tagline}</div>
                    </td>
                    <td valign="top" align="right" style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};white-space:nowrap;">
                      ${period}<br/>${date}
                    </td>
                  </tr>
                </table>
                <div style="height:1px;background-color:${c.border};margin:18px 0;"></div>
                <div style="font-size:11px;color:${c.textMuted};margin-bottom:6px;">${kicker} · ${classification}</div>
                <h1 style="margin:0;font-family:${theme.typography.headingFont};font-size:26px;line-height:1.22;color:${c.text};font-weight:700;">${title}</h1>
                <p style="margin:10px 0 0 0;font-size:14px;line-height:1.55;color:${c.textMuted};">${subtitle}</p>
                ${illustrativeNote}
              </td>
            </tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const company = escapeHtml(report.branding.companyName);
        const tagline = escapeHtml(report.branding.tagline);
        const title = escapeHtml(report.title);
        const subtitle = escapeHtml(report.subtitle);
        const period = escapeHtml(report.reportingPeriod);
        const date = escapeHtml(report.reportDate);
        const classification = escapeHtml(report.branding.classification);
        const kicker = escapeHtml(audience.coverKicker);
        const preparedBy = escapeHtml(report.branding.preparedBy);
        const logoUrl = report.branding.logoDataUrl || '';
        const logoRadius = getLogoRadius(report.branding.logoShape);

        const illustrativeBanner = report.isIllustrative
          ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid ${c.border};font-size:12px;color:${c.textMuted};display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;"><span>${kicker} &middot; Illustrative Sample Figures</span><span>Prepared by ${preparedBy}</span></div>`
          : `<div style="margin-top:16px;padding-top:12px;border-top:1px solid ${c.border};font-size:12px;color:${c.textMuted};display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;"><span>${kicker} &middot; ${classification}</span><span>Prepared by ${preparedBy}</span></div>`;

        if (theme.layoutStyle === 'editorial-broadsheet') {
          return `
            <header style="background:${c.surface};border-top:4px solid ${c.text};border-bottom:2px solid ${c.text};padding:38px 34px;text-align:center;">
              <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px;">
                ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${company}" style="width:42px;height:42px;border-radius:${logoRadius};object-fit:contain;" />` : ''}
                <span style="font-family:${theme.typography.bodyFont};font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${c.accent};">${company}</span>
              </div>
              <div style="font-family:${theme.typography.monoFont};font-size:11.5px;color:${c.textMuted};margin-bottom:18px;letter-spacing:0.04em;">${kicker} &middot; ${period} &middot; ${date}</div>
              <h1 style="margin:0 auto;max-width:740px;font-family:${theme.typography.headingFont};font-size:38px;line-height:1.12;color:${c.text};font-weight:700;letter-spacing:-0.02em;">${title}</h1>
              <p style="margin:14px auto 0;max-width:620px;font-family:${theme.typography.bodyFont};font-size:15px;line-height:1.62;color:${c.textMuted};">${subtitle}</p>
              ${illustrativeBanner}
            </header>
          `;
        }

        if (theme.layoutStyle === 'swiss-precision') {
          return `
            <header style="background:${c.surface};border:1px solid ${c.border};border-radius:8px;overflow:hidden;">
              <div style="height:6px;background:linear-gradient(90deg, #0B1120 0%, ${c.accent} 65%, ${c.secondary} 100%);"></div>
              <div style="padding:32px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;">
                  <div style="display:flex;align-items:center;gap:14px;">
                    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${company}" style="width:48px;height:48px;border-radius:${logoRadius};border:1px solid ${c.border};object-fit:contain;" />` : ''}
                    <div>
                      <div style="font-family:${theme.typography.headingFont};font-size:15px;font-weight:700;color:${c.text};letter-spacing:-0.01em;">${company}</div>
                      <div style="font-size:12px;color:${c.textMuted};margin-top:2px;">${tagline}</div>
                    </div>
                  </div>
                  <div style="text-align:right;font-family:${theme.typography.monoFont};font-size:12px;color:${c.textMuted};">
                    <div style="color:${c.accent};font-weight:700;">${period}</div>
                    <div style="margin-top:2px;">${date}</div>
                  </div>
                </div>
                <div style="margin-top:24px;">
                  <div style="font-family:${theme.typography.monoFont};font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${c.accent};margin-bottom:6px;font-weight:600;">${kicker}</div>
                  <h1 style="margin:0;font-family:${theme.typography.headingFont};font-size:33px;line-height:1.15;color:${c.text};font-weight:700;letter-spacing:-0.025em;">${title}</h1>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.58;color:${c.textMuted};max-width:680px;">${subtitle}</p>
                </div>
                ${illustrativeBanner}
              </div>
            </header>
          `;
        }

        return `
          <header style="background:${c.surface};border:1px solid ${c.border};border-radius:10px;padding:34px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding-bottom:20px;border-bottom:1px solid ${c.border};">
              <div style="display:flex;align-items:center;gap:14px;">
                ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${company}" style="width:48px;height:48px;border-radius:${logoRadius};border:1px solid ${c.border};object-fit:contain;" />` : ''}
                <div>
                  <div style="font-family:${theme.typography.bodyFont};font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${c.accent};">${company}</div>
                  <div style="font-size:12px;color:${c.textMuted};margin-top:2px;">${tagline}</div>
                </div>
              </div>
              <div style="font-family:${theme.typography.monoFont};font-size:12px;color:${c.text};text-align:right;">
                <div style="font-weight:600;">${period}</div>
                <div style="color:${c.textMuted};margin-top:2px;">${date}</div>
              </div>
            </div>
            <div style="margin-top:24px;">
              <div style="font-family:${theme.typography.monoFont};font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${c.textMuted};margin-bottom:6px;">${kicker}</div>
              <h1 style="margin:0;font-family:${theme.typography.headingFont};font-size:36px;line-height:1.14;color:${c.text};font-weight:600;letter-spacing:-0.02em;">${title}</h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.62;color:${c.textMuted};max-width:680px;">${subtitle}</p>
            </div>
            ${illustrativeBanner}
          </header>
        `;
      },
    },
  },
});

function resolveHeroDetails(
  report: ReportInputData,
  metrics: ComputedMetrics
): {
  eyebrow: string;
  primaryFormatted: string;
  deltaFormatted: string;
  priorContext: string;
  secondaryLine: string;
  isPositive: boolean;
} {
  const audience = getAudienceEdition(report.audienceEdition);
  const cur = report.currency;

  if (audience.heroMetric === 'netProfit') {
    const delta = metrics.netProfit - metrics.previousNetProfit;
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatCurrency(metrics.netProfit, cur),
      deltaFormatted: formatPercent(metrics.profitGrowthPct, { signed: true }),
      priorContext: `${formatCurrency(delta, cur, { signed: true })} vs ${report.previousPeriodLabel} (${formatCurrency(metrics.previousNetProfit, cur)})`,
      secondaryLine: `Revenue: ${formatCurrency(report.currentPeriod.revenue, cur)} · Margin: ${formatPercent(metrics.profitMarginPct)}`,
      isPositive: (metrics.profitGrowthPct ?? 0) >= 0,
    };
  }

  if (audience.heroMetric === 'margin') {
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatPercent(metrics.profitMarginPct),
      deltaFormatted: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts`,
      priorContext: `vs ${formatPercent(metrics.previousProfitMarginPct)} in ${report.previousPeriodLabel}`,
      secondaryLine: `Revenue: ${formatCurrency(report.currentPeriod.revenue, cur)} · Net Profit: ${formatCurrency(metrics.netProfit, cur)}`,
      isPositive: metrics.marginDeltaPts >= 0,
    };
  }

  if (audience.heroMetric === 'customers') {
    const custDelta = report.currentPeriod.customerCount - report.previousPeriod.customerCount;
    const revStr = formatCurrency(report.currentPeriod.revenue, cur);
    const second = audience.redactInternalExpenses
      ? `Total Revenue: ${revStr} · Revenue Growth: ${formatPercent(metrics.revenueGrowthPct, { signed: true })}`
      : `Total Revenue: ${revStr} · Net Margin: ${formatPercent(metrics.profitMarginPct)}`;
    return {
      eyebrow: audience.heroLabel,
      primaryFormatted: formatNumber(report.currentPeriod.customerCount),
      deltaFormatted: formatPercent(metrics.customerGrowthPct, { signed: true }),
      priorContext: `${custDelta >= 0 ? '+' : ''}${formatNumber(custDelta)} vs ${report.previousPeriodLabel} (${formatNumber(report.previousPeriod.customerCount)})`,
      secondaryLine: second,
      isPositive: (metrics.customerGrowthPct ?? 0) >= 0,
    };
  }

  const revDelta = report.currentPeriod.revenue - report.previousPeriod.revenue;
  return {
    eyebrow: audience.heroLabel,
    primaryFormatted: formatCurrency(report.currentPeriod.revenue, cur),
    deltaFormatted: formatPercent(metrics.revenueGrowthPct, { signed: true }),
    priorContext: `${formatCurrency(revDelta, cur, { signed: true })} vs ${report.previousPeriodLabel} (${formatCurrency(report.previousPeriod.revenue, cur)})`,
    secondaryLine: `Net Profit: ${formatCurrency(metrics.netProfit, cur)} · Margin: ${formatPercent(metrics.profitMarginPct)}`,
    isPositive: (metrics.revenueGrowthPct ?? 0) >= 0,
  };
}

/**
 * 2. NexoraHeroKpi — Audience-Aware Dominant Hero KPI + Health Status
 */
export const NexoraHeroKpi = registerTool({
  name: 'nexora_hero_kpi',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const hero = resolveHeroDetails(report, metrics);
        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
        const momentumColor = signalHexColor(trend.overallSignal, c);

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.elevated};border:1px solid ${c.border};border-top:2px solid ${c.accent};border-radius:8px;">
            <tr>
              <td style="padding:22px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="top">
                      <div style="font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${c.textMuted};">${escapeHtml(hero.eyebrow)}</div>
                      <div style="font-family:${theme.typography.monoFont};font-size:32px;font-weight:700;color:${c.accent};margin-top:6px;line-height:1.1;">${escapeHtml(hero.primaryFormatted)}</div>
                      <div style="font-size:13px;color:${c.text};margin-top:8px;">
                        <strong>${escapeHtml(hero.deltaFormatted)}</strong> · ${escapeHtml(hero.priorContext)}
                      </div>
                    </td>
                    <td valign="top" align="right" style="padding-left:16px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:${c.textMuted};">Business Health</div>
                      <div style="font-size:14px;font-weight:700;color:${c.text};margin-top:4px;">${escapeHtml(metrics.healthStatus)}</div>
                      ${
                        trend.hasSufficientData
                          ? `<div style="font-family:${theme.typography.monoFont};font-size:11px;font-weight:700;color:${momentumColor};margin-top:4px;">${signalSymbol(trend.overallSignal)} ${escapeHtml(trend.overallSignal)} vs ${trend.windowMonthsCount}M Avg</div>`
                          : ''
                      }
                      <div style="font-family:${theme.typography.monoFont};font-size:12px;color:${c.textMuted};margin-top:6px;">${escapeHtml(hero.secondaryLine)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const hero = resolveHeroDetails(report, metrics);
        const growthColor = hero.isPositive ? c.positive : c.critical;
        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
        const momentumColor = signalHexColor(trend.overallSignal, c);

        return `
          <section style="background:${c.elevated};border:1px solid ${c.border};border-top:2px solid ${c.accent};border-radius:10px;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;page-break-inside:avoid;break-inside:avoid;">
            <div style="min-width:260px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${c.textMuted};">${escapeHtml(hero.eyebrow)}</div>
              <div style="font-family:${theme.typography.monoFont};font-size:42px;font-weight:700;color:${c.accent};margin-top:6px;line-height:1.04;letter-spacing:-0.025em;font-variant-numeric:tabular-nums;">${escapeHtml(hero.primaryFormatted)}</div>
              <div style="margin-top:10px;font-size:13px;color:${c.text};display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <span style="font-family:${theme.typography.monoFont};font-weight:700;color:${growthColor};">${hero.isPositive ? '▲' : '▼'} ${escapeHtml(hero.deltaFormatted)}</span>
                <span style="color:${c.textMuted};">${escapeHtml(hero.priorContext)}</span>
              </div>
            </div>
            <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;">
              ${
                trend.hasSufficientData
                  ? `<div style="border-left:1px solid ${c.border};padding-left:20px;min-width:170px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${c.textMuted};">Rolling ${trend.windowMonthsCount}M Signal</div>
                      <div style="font-family:${theme.typography.monoFont};font-size:18px;font-weight:700;color:${momentumColor};margin-top:4px;">${signalSymbol(trend.overallSignal)} ${escapeHtml(trend.overallSignal)}</div>
                      <div style="margin-top:6px;font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};">${escapeHtml(trend.windowPeriodLabel)}</div>
                    </div>`
                  : ''
              }
              <div style="border-left:1px solid ${c.border};padding-left:20px;min-width:210px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${c.textMuted};">Executive Health Assessment</div>
                <div style="font-family:${theme.typography.headingFont};font-size:20px;font-weight:700;color:${c.text};margin-top:4px;">${escapeHtml(metrics.healthStatus)}</div>
                <div style="margin-top:6px;font-family:${theme.typography.monoFont};font-size:12px;color:${c.textMuted};font-variant-numeric:tabular-nums;">
                  ${escapeHtml(hero.secondaryLine)}
                </div>
              </div>
            </div>
          </section>
        `;
      },
    },
  },
});

/**
 * 3. NexoraKpiStrip — KPI Dashboard Strip (Client edition redacts internal expenses/profit)
 */
export const NexoraKpiStrip = registerTool({
  name: 'nexora_kpi_strip',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;

        const cards = audience.redactInternalExpenses
          ? [
              {
                label: 'Total Revenue',
                val: formatCurrency(report.currentPeriod.revenue, cur, { compact: true }),
                delta: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} YoP`,
              },
              {
                label: 'Active Customers',
                val: formatNumber(report.currentPeriod.customerCount),
                delta: `${formatPercent(metrics.customerGrowthPct, { signed: true })} YoP`,
              },
              {
                label: 'Rev / Customer',
                val: metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A',
                delta: `${formatPercent(metrics.arpuGrowthPct, { signed: true })} YoP`,
              },
              {
                label: 'Retention',
                val:
                  report.currentPeriod.retentionRatePct !== undefined
                    ? `${report.currentPeriod.retentionRatePct.toFixed(1)}%`
                    : metrics.healthStatus,
                delta: 'Platform Stability',
              },
            ]
          : [
              {
                label: 'Revenue',
                val: formatCurrency(report.currentPeriod.revenue, cur, { compact: true }),
                delta: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} YoP`,
              },
              {
                label: 'Expenses',
                val: formatCurrency(report.currentPeriod.expenses, cur, { compact: true }),
                delta: `${formatPercent(metrics.expenseGrowthPct, { signed: true })} YoP`,
              },
              {
                label: 'Net Profit',
                val: formatCurrency(metrics.netProfit, cur, { compact: true }),
                delta: `${formatPercent(metrics.profitGrowthPct, { signed: true })} YoP`,
              },
              {
                label: 'Net Margin',
                val: formatPercent(metrics.profitMarginPct),
                delta: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts`,
              },
              {
                label: 'Customers',
                val: formatNumber(report.currentPeriod.customerCount),
                delta: `${formatPercent(metrics.customerGrowthPct, { signed: true })} YoP`,
              },
            ];

        const colWidth = Math.floor(100 / cards.length);
        const cellsHtml = cards
          .map(
            (card) => `
            <td width="${colWidth}%" valign="top" style="padding:12px 10px;border:1px solid ${c.border};background-color:${c.surface};">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.6px;color:${c.textMuted};">${escapeHtml(card.label)}</div>
              <div style="font-family:${theme.typography.monoFont};font-size:16px;font-weight:700;color:${c.text};margin-top:5px;">${escapeHtml(card.val)}</div>
              <div style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.accent};margin-top:4px;">${escapeHtml(card.delta)}</div>
            </td>`
          )
          .join('');

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="4" border="0">
            <tr>${cellsHtml}</tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;

        const cards = audience.redactInternalExpenses
          ? [
              {
                label: 'Total Revenue',
                val: formatCurrency(report.currentPeriod.revenue, cur),
                sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
                positive: (metrics.revenueGrowthPct ?? 0) >= 0,
              },
              {
                label: 'Active Customers',
                val: formatNumber(report.currentPeriod.customerCount),
                sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
                positive: (metrics.customerGrowthPct ?? 0) >= 0,
              },
              {
                label: 'Revenue / Customer',
                val: metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A',
                sub: `${formatPercent(metrics.arpuGrowthPct, { signed: true })} expansion`,
                positive: (metrics.arpuGrowthPct ?? 0) >= 0,
              },
              {
                label: 'Partner Trajectory',
                val: metrics.healthStatus,
                sub: report.currentPeriod.npsScore !== undefined ? `NPS ${report.currentPeriod.npsScore}` : report.reportingPeriod,
                positive: true,
              },
            ]
          : [
              {
                label: 'Total Revenue',
                val: formatCurrency(report.currentPeriod.revenue, cur),
                sub: `${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs prior`,
                positive: (metrics.revenueGrowthPct ?? 0) >= 0,
              },
              {
                label: 'Operating Expenses',
                val: formatCurrency(report.currentPeriod.expenses, cur),
                sub: `${formatPercent(metrics.expenseGrowthPct, { signed: true })} vs prior`,
                positive: (metrics.expenseGrowthPct ?? 0) <= (metrics.revenueGrowthPct ?? 0),
              },
              {
                label: 'Net Profit',
                val: formatCurrency(metrics.netProfit, cur),
                sub: `${formatPercent(metrics.profitGrowthPct, { signed: true })} vs prior`,
                positive: metrics.netProfit >= 0 && (metrics.profitGrowthPct ?? 0) >= 0,
              },
              {
                label: 'Profit Margin',
                val: formatPercent(metrics.profitMarginPct),
                sub: `${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift`,
                positive: metrics.marginDeltaPts >= 0,
              },
              {
                label: 'Active Customers',
                val: formatNumber(report.currentPeriod.customerCount),
                sub: `${formatPercent(metrics.customerGrowthPct, { signed: true })} growth`,
                positive: (metrics.customerGrowthPct ?? 0) >= 0,
              },
            ];

        return `
          <div class="nexora-kpi-grid" style="display:grid;grid-template-columns:repeat(${cards.length},minmax(0,1fr));gap:12px;page-break-inside:avoid;break-inside:avoid;">
            ${cards
              .map(
                (card) => `
              <div style="background:${c.surface};border:1px solid ${c.border};border-top:2px solid ${card.positive ? c.accent : c.warning};border-radius:8px;padding:15px 14px;">
                <div style="font-size:10.5px;font-weight:700;color:${c.textMuted};text-transform:uppercase;letter-spacing:0.07em;">${escapeHtml(card.label)}</div>
                <div style="font-family:${theme.typography.monoFont};font-size:20px;font-weight:700;color:${c.text};margin-top:8px;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;">${escapeHtml(card.val)}</div>
                <div style="font-family:${theme.typography.monoFont};font-size:11px;font-weight:600;color:${card.positive ? c.positive : c.warning};margin-top:6px;">${card.positive ? '▲' : '▼'} ${escapeHtml(card.sub)}</div>
              </div>`
              )
              .join('')}
          </div>
        `;
      },
    },
    head: {
      css: () => `
        @media (max-width: 760px) {
          .nexora-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `,
    },
  },
});

/**
 * 3B. NexoraStoryArc — Four-Beat Financial Storytelling Narrative Bridge
 */
export const NexoraStoryArc = registerTool({
  name: 'nexora_story_arc',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;
        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
        const revTrend = trend.metrics.find((m) => m.id === 'revenue');

        const lead = `${report.branding.companyName} delivered ${formatCurrency(report.currentPeriod.revenue, cur)} in revenue (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) across ${formatNumber(report.currentPeriod.customerCount)} active customers.`;
        const momentum = trend.hasSufficientData && revTrend
          ? `${trend.overallSignal} cadence: ${trend.latestMonthLabel} finished ${revTrend.deltaFormatted} vs the rolling ${trend.windowMonthsCount}M average (${revTrend.rolling3MoAvgFormatted}).`
          : `Peak monthly volume occurred in ${metrics.bestMonth?.month ?? 'the period'} (${formatCurrency(metrics.bestMonth?.revenue ?? 0, cur)}).`;
        const middle = audience.redactInternalExpenses
          ? `Average revenue per customer reached ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'} (${formatPercent(metrics.arpuGrowthPct, { signed: true })} expansion).`
          : `Operating leverage yielded ${formatCurrency(metrics.netProfit, cur)} net profit at a ${formatPercent(metrics.profitMarginPct)} margin (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift).`;
        const mandate = report.strategicPriorities[0]
          ? `${report.strategicPriorities[0].title} (${report.strategicPriorities[0].horizon} · ${report.strategicPriorities[0].targetImpact}).`
          : report.narrative.closingTakeaway;

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.9px;text-transform:uppercase;color:${c.accent};margin-bottom:8px;">Executive Story Arc · ${escapeHtml(audience.name)}</div>
                <div style="font-size:13px;line-height:1.6;color:${c.text};">
                  <strong>1. Scale &amp; Demand:</strong> ${escapeHtml(lead)}<br/>
                  <strong>2. Rolling Momentum:</strong> ${escapeHtml(momentum)}<br/>
                  <strong>3. ${audience.redactInternalExpenses ? 'Partner Value' : 'Quality of Earnings'}:</strong> ${escapeHtml(middle)}<br/>
                  <strong>4. Strategic Mandate:</strong> ${escapeHtml(mandate)}
                </div>
              </td>
            </tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;
        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
        const revTrend = trend.metrics.find((m) => m.id === 'revenue');

        const spreadText =
          metrics.bestMonth && metrics.worstMonth && metrics.bestMonth.month !== metrics.worstMonth.month
            ? ` Intra-period monthly revenue spanned ${formatCurrency(metrics.worstMonth.revenue, cur, { compact: true })} (${metrics.worstMonth.month}) to ${formatCurrency(metrics.bestMonth.revenue, cur, { compact: true })} (${metrics.bestMonth.month}).`
            : '';

        const chapters = [
          {
            step: '01 · Scale & Demand',
            body: `${report.branding.companyName} recorded ${formatCurrency(report.currentPeriod.revenue, cur)} in revenue (${formatPercent(metrics.revenueGrowthPct, { signed: true })} vs ${report.previousPeriodLabel}) across ${formatNumber(report.currentPeriod.customerCount)} accounts.`,
          },
          {
            step: `02 · Rolling ${trend.windowMonthsCount || 3}M Momentum`,
            body:
              trend.hasSufficientData && revTrend
                ? `${trend.overallSignal} signal: ${trend.latestMonthLabel} (${revTrend.currentMonthFormatted}) tracked ${revTrend.deltaFormatted} against the ${revTrend.rolling3MoAvgFormatted} trailing baseline.${spreadText}`
                : `Peak monthly velocity occurred in ${metrics.bestMonth?.month ?? 'the period'} at ${formatCurrency(metrics.bestMonth?.revenue ?? 0, cur)}.`,
          },
          {
            step: audience.redactInternalExpenses ? '03 · Account Expansion' : '03 · Operating Leverage',
            body: audience.redactInternalExpenses
              ? `Account economics reached ${metrics.revenuePerCustomer !== null ? formatCurrency(metrics.revenuePerCustomer, cur) : 'N/A'} revenue per customer (${formatPercent(metrics.arpuGrowthPct, { signed: true })} YoP).`
              : `Cost discipline yielded ${formatCurrency(metrics.netProfit, cur)} net profit at a ${formatPercent(metrics.profitMarginPct)} margin (${metrics.marginDeltaPts >= 0 ? '+' : ''}${metrics.marginDeltaPts.toFixed(1)} pts shift; OpEx ratio ${metrics.operatingExpenseRatioPct.toFixed(1)}%).`,
          },
          {
            step: '04 · Forward Mandate',
            body: report.strategicPriorities[0]
              ? `${report.strategicPriorities[0].title} (${report.strategicPriorities[0].owner}) — targeting ${report.strategicPriorities[0].targetImpact}.`
              : report.narrative.closingTakeaway,
          },
        ];

        return `
          <section style="background:${c.surface};border:1px solid ${c.border};border-radius:10px;padding:22px 24px;page-break-inside:avoid;break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
              <h3 style="margin:0;font-family:${theme.typography.headingFont};font-size:17px;font-weight:600;color:${c.text};letter-spacing:-0.01em;">Executive Story Arc</h3>
              <span style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.accent};">${escapeHtml(audience.name)} &middot; ${escapeHtml(report.reportingPeriod)}</span>
            </div>
            <div class="nexora-four-col" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;">
              ${chapters
                .map(
                  (ch) => `
                <div style="border-top:2px solid ${c.accent};padding-top:10px;">
                  <div style="font-family:${theme.typography.monoFont};font-size:11px;font-weight:700;color:${c.accent};">${escapeHtml(ch.step)}</div>
                  <p style="margin:6px 0 0;font-size:12.5px;line-height:1.58;color:${c.textMuted};">${escapeHtml(ch.body)}</p>
                </div>`
                )
                .join('')}
            </div>
          </section>
        `;
      },
    },
    head: {
      css: () => `
        @media (max-width: 820px) {
          .nexora-four-col { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 520px) {
          .nexora-four-col { grid-template-columns: 1fr !important; }
        }
      `,
    },
  },
});

/**
 * 4. NexoraTrendChart — Table-based sparklines in Email, SVG Dual-Series + Profit Trend with tooltips in Web/Document
 */
export const NexoraTrendChart = registerTool({
  name: 'nexora_trend_chart',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;
        const series = metrics.monthlyWithProfit;
        const maxRev = Math.max(
          ...series.map((m) =>
            audience.redactInternalExpenses ? m.revenue : Math.max(m.revenue, m.expenses)
          ),
          1
        );

        const rowsHtml = series
          .map((m) => {
            const revPct = Math.max(4, Math.round((m.revenue / maxRev) * 100));
            const expPct = Math.max(4, Math.round((m.expenses / maxRev) * 100));
            return `
              <tr>
                <td width="86" style="padding:7px 8px 7px 0;font-family:${theme.typography.monoFont};font-size:11px;color:${c.text};white-space:nowrap;">${escapeHtml(m.month)}</td>
                <td style="padding:7px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom:3px;">
                        <table role="presentation" width="${revPct}%" cellpadding="0" cellspacing="0" border="0">
                          <tr><td height="7" style="background-color:${c.chartRevenue};font-size:1px;line-height:1px;border-radius:2px;">&nbsp;</td></tr>
                        </table>
                      </td>
                    </tr>
                    ${
                      audience.redactInternalExpenses
                        ? ''
                        : `<tr>
                      <td>
                        <table role="presentation" width="${expPct}%" cellpadding="0" cellspacing="0" border="0">
                          <tr><td height="6" style="background-color:${c.chartExpense};font-size:1px;line-height:1px;border-radius:2px;">&nbsp;</td></tr>
                        </table>
                      </td>
                    </tr>`
                    }
                  </table>
                </td>
                <td width="150" align="right" style="padding:7px 0 7px 8px;font-family:${theme.typography.monoFont};font-size:11px;color:${c.text};white-space:nowrap;">
                  ${escapeHtml(formatCurrency(m.revenue, cur, { compact: true }))}${
                    audience.redactInternalExpenses
                      ? ''
                      : ` / <span style="color:${c.textMuted};">${escapeHtml(formatCurrency(m.netProfit, cur, { compact: true }))} net</span>`
                  }
                </td>
              </tr>`;
          })
          .join('');

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;">
            <tr>
              <td style="padding:18px 20px;">
                <div style="font-size:12px;font-weight:700;color:${c.text};margin-bottom:4px;">${
                  audience.redactInternalExpenses
                    ? 'Monthly Revenue Trajectory Sparkline'
                    : 'Monthly Revenue vs. Expenses Sparkline'
                }</div>
                <div style="font-size:11px;color:${c.textMuted};margin-bottom:12px;">
                  ${
                    audience.redactInternalExpenses
                      ? 'Bar: Monthly Revenue · Right: Period Total'
                      : 'Top bar: Revenue &nbsp;|&nbsp; Bottom bar: Expenses &nbsp;|&nbsp; Right: Revenue / Net Profit'
                  }
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${rowsHtml}
                </table>
              </td>
            </tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;
        const series = metrics.monthlyWithProfit;
        if (series.length === 0) return '';

        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const rollingPts = rawTrend.rollingSeries;

        const width = 740;
        const height = 264;
        const padLeft = 60;
        const padRight = 22;
        const padTop = 28;
        const padBottom = 38;
        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        const rawVals = series.flatMap((m) =>
          audience.redactInternalExpenses
            ? [m.revenue]
            : [m.revenue, m.expenses, m.netProfit]
        );
        const maxPositive = Math.max(...rawVals, 1) * 1.16;
        const minNegative = audience.redactInternalExpenses
          ? 0
          : Math.min(0, ...series.map((m) => m.netProfit));
        const minVal = minNegative < 0 ? minNegative * 1.15 : 0;
        const valSpan = Math.max(maxPositive - minVal, 1);

        const yForVal = (v: number): number =>
          padTop + chartH - ((v - minVal) / valSpan) * chartH;
        const zeroY = yForVal(0);

        const groupW = chartW / series.length;
        const barW = Math.min(
          28,
          Math.max(10, groupW * (audience.redactInternalExpenses ? 0.42 : 0.28))
        );

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const val = minVal + valSpan * ratio;
          const y = yForVal(val);
          return { val, y };
        });

        const showBarLabels = series.length <= 8;

        const barsSvg = series
          .map((m, idx) => {
            const cx = padLeft + idx * groupW + groupW / 2;
            const revTopY = yForVal(Math.max(0, m.revenue));
            const expTopY = yForVal(Math.max(0, m.expenses));
            const revH = Math.max(2, zeroY - revTopY);
            const expH = Math.max(2, zeroY - expTopY);
            const tooltip = escapeHtml(
              audience.redactInternalExpenses
                ? `${m.month}: Revenue ${formatCurrency(m.revenue, cur)}`
                : `${m.month}: Revenue ${formatCurrency(m.revenue, cur)} · Expenses ${formatCurrency(m.expenses, cur)} · Net Profit ${formatCurrency(m.netProfit, cur)} (${formatPercent(m.marginPct)})`
            );
            const revCompact = escapeHtml(formatCurrency(m.revenue, cur, { compact: true }));

            if (audience.redactInternalExpenses) {
              return `
                <g class="nexora-chart-group" data-tooltip="${tooltip}" style="cursor:pointer;">
                  <rect x="${cx - barW / 2}" y="${revTopY.toFixed(1)}" width="${barW}" height="${revH.toFixed(1)}" rx="3" fill="${c.chartRevenue}" />
                  ${showBarLabels ? `<text x="${cx}" y="${(revTopY - 6).toFixed(1)}" text-anchor="middle" fill="${c.textMuted}" font-size="9.5" font-family="${theme.typography.monoFont}">${revCompact}</text>` : ''}
                  <text x="${cx}" y="${height - 12}" text-anchor="middle" fill="${c.textMuted}" font-size="11" font-family="${theme.typography.monoFont}">${escapeHtml(m.month)}</text>
                </g>
              `;
            }

            return `
              <g class="nexora-chart-group" data-tooltip="${tooltip}" style="cursor:pointer;">
                <rect x="${cx - barW - 2}" y="${revTopY.toFixed(1)}" width="${barW}" height="${revH.toFixed(1)}" rx="3" fill="${c.chartRevenue}" />
                <rect x="${cx + 2}" y="${expTopY.toFixed(1)}" width="${barW}" height="${expH.toFixed(1)}" rx="3" fill="${c.chartExpense}" opacity="0.88" />
                ${showBarLabels ? `<text x="${cx - barW / 2 - 2}" y="${(revTopY - 6).toFixed(1)}" text-anchor="middle" fill="${c.textMuted}" font-size="9.5" font-family="${theme.typography.monoFont}">${revCompact}</text>` : ''}
                <text x="${cx}" y="${height - 12}" text-anchor="middle" fill="${c.textMuted}" font-size="11" font-family="${theme.typography.monoFont}">${escapeHtml(m.month)}</text>
              </g>
            `;
          })
          .join('');

        // Rolling 3-month revenue average dashed benchmark polyline
        const rollingRevCoords = rollingPts.map((pt, idx) => {
          const cx = padLeft + idx * groupW + groupW / 2;
          const ry = yForVal(pt.rolling3MoRevenueAvg);
          return { cx, ry, pt };
        });
        const rollingRevPolyline = rollingRevCoords
          .map((p) => `${p.cx.toFixed(1)},${p.ry.toFixed(1)}`)
          .join(' ');

        const profitPts = series.map((m, idx) => {
          const cx = padLeft + idx * groupW + groupW / 2;
          const py = yForVal(m.netProfit);
          return { cx, py, m };
        });

        const polylinePoints = profitPts.map((p) => `${p.cx.toFixed(1)},${p.py.toFixed(1)}`).join(' ');
        const profitDotsSvg = audience.redactInternalExpenses
          ? ''
          : profitPts
              .map(
                (p) =>
                  `<circle cx="${p.cx.toFixed(1)}" cy="${p.py.toFixed(1)}" r="4" fill="${c.surface}" stroke="${c.chartProfit}" stroke-width="2.5" data-tooltip="${escapeHtml(`${p.m.month} Net Profit: ${formatCurrency(p.m.netProfit, cur)} (${formatPercent(p.m.marginPct)})`)}" />`
              )
              .join('');

        return `
          <section style="background:${c.surface};border:1px solid ${c.border};border-radius:10px;padding:22px 24px;page-break-inside:avoid;break-inside:avoid;position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
              <div>
                <h3 style="margin:0;font-family:${theme.typography.headingFont};font-size:17px;color:${c.text};font-weight:600;letter-spacing:-0.01em;">${
                  audience.redactInternalExpenses
                    ? 'Monthly Revenue Trajectory'
                    : 'Monthly Revenue, Expenses &amp; Net Profit Trajectory'
                }</h3>
                <p style="margin:4px 0 0;font-size:12px;color:${c.textMuted};">Average monthly revenue: ${escapeHtml(formatCurrency(metrics.averageMonthlyRevenue, cur))}${
                  audience.redactInternalExpenses
                    ? ''
                    : ` &middot; Average net profit: ${escapeHtml(formatCurrency(metrics.averageMonthlyProfit, cur))}`
                }</p>
              </div>
              <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:11px;color:${c.textMuted};">
                <span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:${c.chartRevenue};display:inline-block;"></span>Revenue</span>
                ${
                  series.length > 1
                    ? `<span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:14px;height:0;border-top:2px dashed ${c.accent};display:inline-block;"></span>Rolling 3M Rev Avg</span>`
                    : ''
                }
                ${
                  audience.redactInternalExpenses
                    ? ''
                    : `<span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:${c.chartExpense};display:inline-block;"></span>Expenses</span>
                       <span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:12px;height:2px;background:${c.chartProfit};display:inline-block;"></span>Net Profit</span>`
                }
              </div>
            </div>
            <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly Financial Trajectory chart" style="display:block;width:100%;height:auto;overflow:visible;">
              ${yTicks
                .map(
                  (t) => `
                <line x1="${padLeft}" y1="${t.y.toFixed(1)}" x2="${width - padRight}" y2="${t.y.toFixed(1)}" stroke="${c.border}" stroke-dasharray="3 3" />
                <text x="${padLeft - 8}" y="${(t.y + 4).toFixed(1)}" text-anchor="end" fill="${c.textMuted}" font-size="10" font-family="${theme.typography.monoFont}">${escapeHtml(formatCurrency(t.val, cur, { compact: true }))}</text>
              `
                )
                .join('')}
              ${minVal < 0 ? `<line x1="${padLeft}" y1="${zeroY.toFixed(1)}" x2="${width - padRight}" y2="${zeroY.toFixed(1)}" stroke="${c.textMuted}" stroke-width="1.2" />` : ''}
              ${barsSvg}
              ${rollingRevCoords.length > 1 ? `<polyline fill="none" stroke="${c.accent}" stroke-width="1.8" stroke-dasharray="5 4" points="${rollingRevPolyline}" />` : ''}
              ${!audience.redactInternalExpenses && series.length > 1 ? `<polyline fill="none" stroke="${c.chartProfit}" stroke-width="2.2" points="${polylinePoints}" />` : ''}
              ${profitDotsSvg}
            </svg>
            <div class="nexora-tooltip-bar" style="margin-top:8px;min-height:18px;font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};">Hover over any period bar for exact monthly breakdown.</div>
          </section>
        `;
      },
    },
    head: {
      js: () => `
        (function() {
          if (typeof document === 'undefined') return;
          document.addEventListener('mouseover', function(e) {
            var target = e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null;
            if (!target) return;
            var container = target.closest('section');
            if (!container) return;
            var bar = container.querySelector('.nexora-tooltip-bar');
            if (bar) bar.textContent = target.getAttribute('data-tooltip') || '';
          });
        })();
      `,
    },
  },
});

/**
 * 5. NexoraBreakdownChart — Revenue & Expense Category Mix (Client edition redacts expenses)
 */
export const NexoraBreakdownChart = registerTool({
  name: 'nexora_breakdown_chart',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;

        const renderTableBars = (
          title: string,
          items: { name: string; amount: number; sharePct: number }[],
          barColor: string
        ) => {
          const rows = items
            .map(
              (item) => `
              <tr>
                <td style="padding:6px 0;font-size:12px;color:${c.text};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size:12px;color:${c.text};">${escapeHtml(item.name)}</td>
                      <td align="right" style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};">${escapeHtml(formatCurrency(item.amount, cur, { compact: true }))} (${item.sharePct.toFixed(1)}%)</td>
                    </tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;background-color:${c.elevated};">
                    <tr>
                      <td width="${Math.max(2, Math.round(item.sharePct))}%" height="6" style="background-color:${barColor};font-size:1px;line-height:1px;">&nbsp;</td>
                      <td></td>
                    </tr>
                  </table>
                </td>
              </tr>`
            )
            .join('');

          return `
            <div style="font-size:12px;font-weight:700;color:${c.text};margin-bottom:8px;">${escapeHtml(title)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
          `;
        };

        if (audience.redactInternalExpenses) {
          return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;">
              <tr>
                <td style="padding:18px 20px;">
                  ${renderTableBars('Revenue Portfolio Mix', metrics.revenueCategoriesComputed, c.chartRevenue)}
                </td>
              </tr>
            </table>
          `;
        }

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;">
            <tr>
              <td width="50%" valign="top" style="padding:18px 14px 18px 20px;border-right:1px solid ${c.border};">
                ${renderTableBars('Revenue Mix', metrics.revenueCategoriesComputed, c.chartRevenue)}
              </td>
              <td width="50%" valign="top" style="padding:18px 20px 18px 14px;">
                ${renderTableBars('Expense Structure', metrics.expenseCategoriesComputed, c.chartExpense)}
              </td>
            </tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const cur = report.currency;

        const renderCard = (
          title: string,
          subtitle: string,
          items: { name: string; amount: number; sharePct: number }[],
          barColor: string
        ) => `
          <div style="background:${c.surface};border:1px solid ${c.border};border-radius:10px;padding:20px 22px;">
            <div style="font-family:${theme.typography.headingFont};font-size:16px;font-weight:600;color:${c.text};letter-spacing:-0.01em;">${escapeHtml(title)}</div>
            <div style="font-family:${theme.typography.monoFont};font-size:11.5px;color:${c.textMuted};margin-top:3px;margin-bottom:15px;font-variant-numeric:tabular-nums;">${escapeHtml(subtitle)}</div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${items
                .map(
                  (item) => `
                <div data-tooltip="${escapeHtml(`${item.name}: ${formatCurrency(item.amount, cur)} (${item.sharePct.toFixed(1)}% share)`)}">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:13px;gap:8px;">
                    <span style="color:${c.text};font-weight:500;">${escapeHtml(item.name)}</span>
                    <span style="font-family:${theme.typography.monoFont};font-size:12px;color:${c.textMuted};white-space:nowrap;font-variant-numeric:tabular-nums;">${escapeHtml(formatCurrency(item.amount, cur))} &middot; <strong style="color:${c.text};">${item.sharePct.toFixed(1)}%</strong></span>
                  </div>
                  <div style="height:8px;background:${c.elevated};border-radius:4px;overflow:hidden;margin-top:6px;">
                    <div style="height:100%;width:${Math.min(100, Math.max(2, item.sharePct)).toFixed(1)}%;background:${barColor};border-radius:4px;"></div>
                  </div>
                </div>`
                )
                .join('')}
            </div>
          </div>
        `;

        if (audience.redactInternalExpenses) {
          return `
            <div style="page-break-inside:avoid;break-inside:avoid;">
              ${renderCard(
                'Revenue Streams & Product Adoption',
                `Category total: ${formatCurrency(metrics.revenueCategoryTotal, cur)} (Internal cost drivers redacted in Client Edition)`,
                metrics.revenueCategoriesComputed,
                c.chartRevenue
              )}
            </div>
          `;
        }

        return `
          <div class="nexora-two-col" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;page-break-inside:avoid;break-inside:avoid;">
            ${renderCard(
              'Revenue Streams',
              `Category total: ${formatCurrency(metrics.revenueCategoryTotal, cur)}`,
              metrics.revenueCategoriesComputed,
              c.chartRevenue
            )}
            ${renderCard(
              'Operating Cost Drivers',
              `Category total: ${formatCurrency(metrics.expenseCategoryTotal, cur)}`,
              metrics.expenseCategoriesComputed,
              c.chartExpense
            )}
          </div>
        `;
      },
    },
    head: {
      css: () => `
        @media (max-width: 720px) {
          .nexora-two-col { grid-template-columns: 1fr !important; }
        }
      `,
    },
  },
});

function signalSymbol(signal: MomentumSignal): string {
  if (signal === 'Accelerating') return '▲';
  if (signal === 'Decelerating') return '▼';
  return '—';
}

function signalHexColor(signal: MomentumSignal, c: ThemeSpec['colors'], metricId?: string): string {
  if (metricId === 'expenses') {
    if (signal === 'Accelerating') return c.warning;
    if (signal === 'Decelerating') return c.positive;
    return c.textMuted;
  }
  if (signal === 'Accelerating') return c.positive;
  if (signal === 'Decelerating') return c.warning;
  return c.textMuted;
}

/**
 * 6. NexoraInsightsBlock — Trend Analysis (Rolling 3-Month Benchmark), Observations & Recommendations
 */
export const NexoraInsightsBlock = registerTool({
  name: 'nexora_insights_block',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics, insights, recommendations } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
        const windowLabel = trend.windowMonthsCount < 3 ? `${trend.windowMonthsCount}-Month` : '3-Month';

        const trendTableHtml = trend.hasSufficientData
          ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;margin-bottom:14px;">
            <tr>
              <td style="padding:14px 14px 8px 14px;">
                <div style="font-family:${theme.typography.monoFont};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${c.accent};">
                  Trend Analysis · Rolling ${windowLabel} Benchmark (${escapeHtml(trend.windowPeriodLabel)})
                </div>
                <div style="font-family:${theme.typography.headingFont};font-size:16px;font-weight:700;color:${c.text};margin-top:4px;">
                  ${escapeHtml(trend.summaryHeadline)}
                </div>
                <div style="font-size:12px;line-height:1.5;color:${c.textMuted};margin-top:4px;">
                  ${escapeHtml(trend.summaryNarrative)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 14px 14px 14px;">
                <table role="presentation" width="100%" cellpadding="7" cellspacing="0" border="0" style="border:1px solid ${c.border};font-size:12px;color:${c.text};">
                  <tr style="background-color:${c.tableHeaderBg};color:${c.tableHeaderText};">
                    <td style="font-weight:700;">Metric</td>
                    <td align="right" style="font-weight:700;">${escapeHtml(trend.latestMonthLabel)}</td>
                    <td align="right" style="font-weight:700;">Rolling ${windowLabel} Avg</td>
                    <td align="right" style="font-weight:700;">Variance</td>
                    <td align="right" style="font-weight:700;">Signal</td>
                  </tr>
                  ${trend.metrics
                    .map((tm) => {
                      const sColor = signalHexColor(tm.signal, c, tm.id);
                      return `
                      <tr style="border-top:1px solid ${c.border};">
                        <td style="font-weight:600;color:${c.text};">${escapeHtml(tm.label)}</td>
                        <td align="right" style="font-family:${theme.typography.monoFont};">${escapeHtml(tm.currentMonthFormatted)}</td>
                        <td align="right" style="font-family:${theme.typography.monoFont};color:${c.textMuted};">${escapeHtml(tm.rolling3MoAvgFormatted)}</td>
                        <td align="right" style="font-family:${theme.typography.monoFont};font-weight:700;color:${sColor};">${escapeHtml(tm.deltaFormatted)}</td>
                        <td align="right" style="font-family:${theme.typography.monoFont};font-weight:700;color:${sColor};white-space:nowrap;">${signalSymbol(tm.signal)} ${escapeHtml(tm.signal)}</td>
                      </tr>`;
                    })
                    .join('')}
                </table>
              </td>
            </tr>
          </table>
          `
          : '';

        const insightsRows = insights
          .map((ins) => {
            const sevColor =
              ins.severity === 'positive'
                ? c.positive
                : ins.severity === 'critical'
                  ? c.critical
                  : ins.severity === 'warning'
                    ? c.warning
                    : c.textMuted;
            return `
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid ${c.border};">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${sevColor};">${escapeHtml(ins.category)} · ${escapeHtml(ins.supportingMetric)}</div>
                  <div style="font-size:14px;font-weight:700;color:${c.text};margin-top:3px;">${escapeHtml(ins.headline)}</div>
                  <div style="font-size:13px;line-height:1.5;color:${c.textMuted};margin-top:4px;">${escapeHtml(ins.explanation)}</div>
                  ${
                    ins.ruleTriggered
                      ? `<div style="font-family:${theme.typography.monoFont};font-size:10px;color:${c.textMuted};margin-top:5px;">Rule: ${escapeHtml(ins.ruleTriggered)}${ins.formulaTrace ? ` | Formula: ${escapeHtml(ins.formulaTrace)}` : ''}</div>`
                      : ''
                  }
                </td>
              </tr>`;
          })
          .join('');

        const recsRows = recommendations
          .map(
            (rec, i) => `
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid ${c.border};">
                <div style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.accent};">0${i + 1} · ${escapeHtml(rec.priority)} Priority · ${escapeHtml(rec.basis)}</div>
                <div style="font-size:14px;font-weight:700;color:${c.text};margin-top:3px;">${escapeHtml(rec.title)}</div>
                <div style="font-size:13px;line-height:1.5;color:${c.textMuted};margin-top:4px;">${escapeHtml(rec.suggestedAction)}</div>
              </td>
            </tr>`
          )
          .join('');

        return `
          ${trendTableHtml}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:8px;margin-bottom:14px;">
            <tr><td style="padding:14px 14px 6px 14px;font-family:${theme.typography.headingFont};font-size:16px;font-weight:700;color:${c.text};">Verified Financial Observations</td></tr>
            ${insightsRows}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.elevated};border:1px solid ${c.border};border-radius:8px;">
            <tr><td style="padding:14px 14px 6px 14px;font-family:${theme.typography.headingFont};font-size:16px;font-weight:700;color:${c.text};">Rule-Derived Strategic Recommendations</td></tr>
            ${recsRows}
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data) return '';
        const { report, metrics, insights, recommendations } = data;
        const theme = resolveBrandTheme(report);
        const audience = getAudienceEdition(report.audienceEdition);
        const c = theme.colors;
        const rawTrend = data.trendAnalysis ?? computeTrendAnalysis(report, metrics);
        const trend = filterTrendForAudience(rawTrend, audience.redactInternalExpenses);
        const windowLabel = trend.windowMonthsCount < 3 ? `${trend.windowMonthsCount}-Month` : '3-Month';
        const overallColor = signalHexColor(trend.overallSignal, c);

        const trendSectionHtml = trend.hasSufficientData
          ? `
            <section style="background:${c.surface};border:1px solid ${c.border};border-radius:10px;padding:22px 24px;page-break-inside:avoid;break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
                <div>
                  <div style="font-family:${theme.typography.monoFont};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${c.accent};">
                    Trend Analysis &middot; Rolling ${windowLabel} Benchmark (${escapeHtml(trend.windowPeriodLabel)})
                  </div>
                  <h3 style="margin:4px 0 0;font-family:${theme.typography.headingFont};font-size:18px;color:${c.text};font-weight:600;">
                    ${escapeHtml(trend.summaryHeadline)}
                  </h3>
                  <p style="margin:5px 0 0;font-size:13px;line-height:1.5;color:${c.textMuted};max-width:680px;">
                    ${escapeHtml(trend.summaryNarrative)}
                  </p>
                </div>
                <div style="text-align:right;font-family:${theme.typography.monoFont};">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${c.textMuted};">Overall Momentum</div>
                  <div style="font-size:15px;font-weight:700;color:${overallColor};margin-top:3px;">
                    ${signalSymbol(trend.overallSignal)} ${escapeHtml(trend.overallSignal)}
                  </div>
                </div>
              </div>

              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid ${c.border};background:${c.canvas};">
                  <thead>
                    <tr style="background:${c.tableHeaderBg};color:${c.tableHeaderText};text-align:left;">
                      <th style="padding:10px 12px;">Performance Metric</th>
                      <th style="padding:10px 12px;text-align:right;">${escapeHtml(trend.latestMonthLabel)}</th>
                      <th style="padding:10px 12px;text-align:right;">Period Pace</th>
                      <th style="padding:10px 12px;text-align:right;">Rolling ${windowLabel} Avg</th>
                      <th style="padding:10px 12px;text-align:right;">Delta vs Avg</th>
                      <th style="padding:10px 12px;text-align:right;">Momentum Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${trend.metrics
                      .map((tm) => {
                        const sColor = signalHexColor(tm.signal, c, tm.id);
                        return `
                        <tr style="border-top:1px solid ${c.border};color:${c.text};">
                          <td style="padding:10px 12px;">
                            <div style="font-weight:600;color:${c.text};">${escapeHtml(tm.label)}</div>
                            <div style="font-family:${theme.typography.monoFont};font-size:10px;color:${c.textMuted};margin-top:2px;">${escapeHtml(tm.formulaTrace)}</div>
                          </td>
                          <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};font-weight:600;font-variant-numeric:tabular-nums;">${escapeHtml(tm.currentMonthFormatted)}</td>
                          <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};color:${c.textMuted};font-variant-numeric:tabular-nums;">${escapeHtml(tm.periodPaceFormatted)}</td>
                          <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};color:${c.textMuted};font-variant-numeric:tabular-nums;">${escapeHtml(tm.rolling3MoAvgFormatted)}</td>
                          <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};font-weight:700;color:${sColor};font-variant-numeric:tabular-nums;">${escapeHtml(tm.deltaFormatted)}</td>
                          <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};font-weight:700;color:${sColor};white-space:nowrap;">${signalSymbol(tm.signal)} ${escapeHtml(tm.signal)}</td>
                        </tr>`;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
              ${
                trend.windowMonthsCount < 3
                  ? `<div style="margin-top:10px;font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};">Note: Rolling benchmark currently averages ${trend.windowMonthsCount} available monthly data points; add 3+ months for a full 3-month rolling average.</div>`
                  : ''
              }
            </section>
          `
          : '';

        return `
          <div style="display:flex;flex-direction:column;gap:20px;">
            ${trendSectionHtml}

            <section style="background:${c.surface};border:1px solid ${c.border};border-radius:10px;padding:22px 24px;page-break-inside:avoid;break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                <h3 style="margin:0;font-family:${theme.typography.headingFont};font-size:18px;color:${c.text};font-weight:600;">Verified Financial Observations</h3>
                <span style="font-size:12px;color:${c.textMuted};">Transparent deterministic rules over period actuals</span>
              </div>
              <div class="nexora-two-col" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
                ${insights
                  .map((ins) => {
                    const sevColor =
                      ins.severity === 'positive'
                        ? c.positive
                        : ins.severity === 'critical'
                          ? c.critical
                          : ins.severity === 'warning'
                            ? c.warning
                            : c.textMuted;
                    return `
                    <div style="border:1px solid ${c.border};border-radius:8px;padding:14px 16px;background:${c.canvas};display:flex;flex-direction:column;justify-content:space-between;gap:8px;">
                      <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:${theme.typography.monoFont};font-size:11px;">
                          <span style="color:${sevColor};font-weight:600;">${escapeHtml(ins.category)}</span>
                          <span style="color:${c.textMuted};">${escapeHtml(ins.supportingMetric)}</span>
                        </div>
                        <div style="font-size:14px;font-weight:700;color:${c.text};margin-top:6px;">${escapeHtml(ins.headline)}</div>
                        <p style="margin:6px 0 0;font-size:13px;line-height:1.55;color:${c.textMuted};">${escapeHtml(ins.explanation)}</p>
                      </div>
                      ${
                        ins.ruleTriggered
                          ? `<div style="border-top:1px solid ${c.border};padding-top:7px;font-family:${theme.typography.monoFont};font-size:10px;color:${c.textMuted};line-height:1.4;">Rule: ${escapeHtml(ins.ruleTriggered)}${ins.formulaTrace ? `<br/>Calc: ${escapeHtml(ins.formulaTrace)}` : ''}</div>`
                          : ''
                      }
                    </div>`;
                  })
                  .join('')}
              </div>
            </section>

            <section style="background:${c.elevated};border:1px solid ${c.border};border-radius:10px;padding:22px 24px;page-break-inside:avoid;break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                <h3 style="margin:0;font-family:${theme.typography.headingFont};font-size:18px;color:${c.text};font-weight:600;">Analytical Recommendations</h3>
                <span style="font-size:12px;color:${c.textMuted};">Advisory actions distinct from reported actuals</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                ${recommendations
                  .map(
                    (rec, idx) => `
                  <div style="border:1px solid ${c.border};border-radius:8px;padding:14px 16px;background:${c.surface};">
                    <div style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.accent};">0${idx + 1} &middot; ${escapeHtml(rec.priority)} Priority &middot; ${escapeHtml(rec.basis)}</div>
                    <div style="font-size:14px;font-weight:700;color:${c.text};margin-top:4px;">${escapeHtml(rec.title)}</div>
                    <p style="margin:5px 0 0;font-size:13px;line-height:1.55;color:${c.textMuted};">${escapeHtml(rec.rationale)} <strong style="color:${c.text};">${escapeHtml(rec.suggestedAction)}</strong></p>
                  </div>`
                  )
                  .join('')}
              </div>
            </section>
          </div>
        `;
      },
    },
  },
});

/**
 * 7. NexoraSimulationAppendix — Strictly Labeled Hypothetical What-If Scenario Appendix
 */
export const NexoraSimulationAppendix = registerTool({
  name: 'nexora_simulation_appendix',
  values: {
    payloadJson: '',
  },
  renderer: {
    exporters: {
      email: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data || !data.report.simulation?.includeInReport) return '';
        const { report } = data;
        const theme = resolveBrandTheme(report);
        const sim = runWhatIfSimulation(report, report.simulation!);
        const c = theme.colors;
        const cur = report.currency;

        return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.warningBg};border:1px dashed ${c.warning};border-radius:8px;">
            <tr>
              <td style="padding:18px 20px;">
                <div style="font-family:${theme.typography.monoFont};font-size:11px;font-weight:700;color:${c.warning};letter-spacing:0.8px;text-transform:uppercase;">
                  HYPOTHETICAL WHAT-IF PROJECTION — NON-ACTUAL SCENARIO
                </div>
                <div style="font-family:${theme.typography.headingFont};font-size:16px;font-weight:700;color:${c.text};margin-top:4px;">
                  ${escapeHtml(sim.assumptions.scenarioName)}
                </div>
                <div style="font-family:${theme.typography.bodyFont};font-size:12px;color:${c.textMuted};margin-top:4px;">
                  Assumptions: Revenue ${sim.assumptions.revenueDeltaPct >= 0 ? '+' : ''}${sim.assumptions.revenueDeltaPct}% · OpEx ${sim.assumptions.expenseDeltaPct >= 0 ? '+' : ''}${sim.assumptions.expenseDeltaPct}% · Customers ${sim.assumptions.customerDeltaPct >= 0 ? '+' : ''}${sim.assumptions.customerDeltaPct}% · ARPU ${sim.assumptions.arpuDeltaPct >= 0 ? '+' : ''}${sim.assumptions.arpuDeltaPct}%
                </div>
                <table role="presentation" width="100%" cellpadding="6" cellspacing="0" border="0" style="margin-top:12px;border-top:1px solid ${c.border};font-family:${theme.typography.monoFont};font-size:12px;color:${c.text};">
                  <tr>
                    <td><strong>Metric</strong></td>
                    <td align="right"><strong>Reported Actual</strong></td>
                    <td align="right"><strong>Hypothetical Projection</strong></td>
                    <td align="right"><strong>Variance</strong></td>
                  </tr>
                  <tr>
                    <td>Revenue</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.actualRevenue, cur))}</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.projectedRevenue, cur))}</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.revenueVariance, cur, { signed: true }))}</td>
                  </tr>
                  <tr>
                    <td>Expenses</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.actualExpenses, cur))}</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.projectedExpenses, cur))}</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.expenseVariance, cur, { signed: true }))}</td>
                  </tr>
                  <tr>
                    <td>Net Profit</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.actualNetProfit, cur))}</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.projectedNetProfit, cur))}</td>
                    <td align="right">${escapeHtml(formatCurrency(sim.netProfitVariance, cur, { signed: true }))}</td>
                  </tr>
                  <tr>
                    <td>Margin</td>
                    <td align="right">${escapeHtml(formatPercent(sim.actualMarginPct))}</td>
                    <td align="right">${escapeHtml(formatPercent(sim.projectedMarginPct))}</td>
                    <td align="right">${sim.marginVariancePts >= 0 ? '+' : ''}${sim.marginVariancePts.toFixed(1)} pts</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;
      },
      web: (values) => {
        const data = parsePayload(values.payloadJson);
        if (!data || !data.report.simulation?.includeInReport) return '';
        const { report } = data;
        const theme = resolveBrandTheme(report);
        const sim = runWhatIfSimulation(report, report.simulation!);
        const c = theme.colors;
        const cur = report.currency;

        const rows = [
          {
            label: 'Revenue (Simulated)',
            actual: formatCurrency(sim.actualRevenue, cur),
            projected: formatCurrency(sim.projectedRevenue, cur),
            variance: formatCurrency(sim.revenueVariance, cur, { signed: true }),
          },
          {
            label: 'Operating Expenses (Simulated)',
            actual: formatCurrency(sim.actualExpenses, cur),
            projected: formatCurrency(sim.projectedExpenses, cur),
            variance: formatCurrency(sim.expenseVariance, cur, { signed: true }),
          },
          {
            label: 'Net Profit (Simulated)',
            actual: formatCurrency(sim.actualNetProfit, cur),
            projected: formatCurrency(sim.projectedNetProfit, cur),
            variance: formatCurrency(sim.netProfitVariance, cur, { signed: true }),
          },
          {
            label: 'Net Profit Margin (Simulated)',
            actual: formatPercent(sim.actualMarginPct),
            projected: formatPercent(sim.projectedMarginPct),
            variance: `${sim.marginVariancePts >= 0 ? '+' : ''}${sim.marginVariancePts.toFixed(1)} pts`,
          },
        ];

        return `
          <section style="background:${c.warningBg};border:1px dashed ${c.warning};border-radius:10px;padding:22px 24px;page-break-inside:avoid;break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-family:${theme.typography.monoFont};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${c.warning};">
                  HYPOTHETICAL WHAT-IF PROJECTION &mdash; NON-ACTUAL SCENARIO
                </div>
                <h3 style="margin:4px 0 0;font-family:${theme.typography.headingFont};font-size:18px;font-weight:600;color:${c.text};">
                  ${escapeHtml(sim.assumptions.scenarioName)}
                </h3>
              </div>
              <div style="font-family:${theme.typography.monoFont};font-size:11px;color:${c.textMuted};">
                Rev ${sim.assumptions.revenueDeltaPct >= 0 ? '+' : ''}${sim.assumptions.revenueDeltaPct}% &middot; OpEx ${sim.assumptions.expenseDeltaPct >= 0 ? '+' : ''}${sim.assumptions.expenseDeltaPct}% &middot; Cust ${sim.assumptions.customerDeltaPct >= 0 ? '+' : ''}${sim.assumptions.customerDeltaPct}% &middot; ARPU ${sim.assumptions.arpuDeltaPct >= 0 ? '+' : ''}${sim.assumptions.arpuDeltaPct}%
              </div>
            </div>
            <p style="margin:8px 0 14px;font-size:12px;color:${c.textMuted};line-height:1.5;">
              Figures below are forward-looking model projections computed from user-defined assumptions and are strictly separated from audited period actuals above.
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;background:${c.surface};border:1px solid ${c.border};">
              <thead>
                <tr style="background:${c.tableHeaderBg};color:${c.tableHeaderText};text-align:left;">
                  <th style="padding:10px 12px;">Simulated Metric</th>
                  <th style="padding:10px 12px;text-align:right;">Reported Actual</th>
                  <th style="padding:10px 12px;text-align:right;">Projected Result</th>
                  <th style="padding:10px 12px;text-align:right;">Scenario Variance</th>
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (r) => `
                  <tr style="border-top:1px solid ${c.border};color:${c.text};">
                    <td style="padding:10px 12px;font-weight:500;">${escapeHtml(r.label)}</td>
                    <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};color:${c.textMuted};">${escapeHtml(r.actual)}</td>
                    <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};font-weight:700;">${escapeHtml(r.projected)}</td>
                    <td style="padding:10px 12px;text-align:right;font-family:${theme.typography.monoFont};color:${c.accent};">${escapeHtml(r.variance)}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </section>
        `;
      },
    },
  },
});

export function buildClosingFooterHtml(
  report: ReportInputData,
  theme: ThemeSpec,
  includeDisclaimer = true
): string {
  const c = theme.colors;
  const safeWebsite = sanitizeHttpUrl(report.branding.website);
  const websiteLink = safeWebsite
    ? `<a href="${escapeHtml(safeWebsite)}" style="color:${c.accent};text-decoration:underline;">${escapeHtml(safeWebsite)}</a>`
    : '';
  return `
    <div style="border-top:1px solid ${c.border};padding-top:16px;font-family:${theme.typography.bodyFont};font-size:12px;line-height:1.6;color:${c.textMuted};">
      <div style="font-weight:600;color:${c.text};margin-bottom:4px;">${escapeHtml(report.branding.companyName)} &middot; ${escapeHtml(report.branding.preparedBy)}</div>
      <div>${escapeHtml(report.branding.contactEmail)}${websiteLink ? ` &middot; ${websiteLink}` : ''}</div>
      ${includeDisclaimer ? `<div style="margin-top:8px;font-size:11px;">${escapeHtml(report.branding.disclaimer)}</div>` : ''}
    </div>
  `;
}
