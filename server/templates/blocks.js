// Pure functions that return table-based HTML strings for <Paragraph html="...">.
// Table markup with inline styles is used so the same blocks are safe in email,
// web and print output. Every user-supplied string goes through escapeHtml.
import { THEMES, escapeHtml as e, formatCompact, kpisOf, textOn } from '../../shared/report.js';

export function themeOf(report) {
  return THEMES[report.theme];
}

export function headerHtml(report) {
  const t = themeOf(report);
  const { primaryColor, secondaryColor } = report.branding;
  const solid = report.theme === 'executive';
  const bg = solid ? secondaryColor : '#FFFFFF';
  const fg = solid ? textOn(secondaryColor) : secondaryColor;
  const sub = solid ? fg : t.muted;
  const rule = solid ? '' : `border-bottom:3px solid ${primaryColor};`;
  const initial = e((report.company.name.trim()[0] || 'N').toUpperCase());
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};${rule}font-family:${t.bodyFont};">
<tr><td style="padding:28px 32px 8px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="36" height="36" align="center" style="background:${primaryColor};color:${textOn(primaryColor)};font-size:18px;font-weight:bold;border-radius:8px;">${initial}</td>
<td style="padding-left:12px;color:${fg};font-size:15px;font-weight:bold;">${e(report.company.name)}</td>
</tr></table></td></tr>
<tr><td style="padding:12px 32px 4px 32px;color:${fg};font-family:${t.headingFont.value};font-size:30px;line-height:36px;font-weight:bold;">${e(report.report.title)}</td></tr>
<tr><td style="padding:0 32px 28px 32px;color:${sub};font-size:14px;opacity:0.85;">${e(report.report.period)}</td></tr>
</table>`;
}

export function summaryHtml(report) {
  const t = themeOf(report);
  return `<div style="font-family:${t.bodyFont};font-size:15px;line-height:24px;color:${t.text};">${e(report.report.summary)}</div>`;
}

export function kpiHtml(report, key) {
  const t = themeOf(report);
  const kpi = kpisOf(report).find((k) => k.key === key);
  const noteColor = kpi.negative ? '#B42318' : kpi.positive ? '#067647' : t.muted;
  const arrow = kpi.key === 'growth' ? (kpi.negative ? '&#9660; ' : kpi.positive ? '&#9650; ' : '') : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.cardBg};border:1px solid ${t.border};border-radius:10px;font-family:${t.bodyFont};">
<tr><td style="padding:14px 16px 2px 16px;font-size:13px;color:${t.muted};">${e(kpi.label)}</td></tr>
<tr><td style="padding:0 16px 2px 16px;font-family:${t.headingFont.value};font-size:26px;line-height:32px;font-weight:bold;color:${t.text};">${e(kpi.value)}</td></tr>
<tr><td style="padding:0 16px 14px 16px;font-size:12px;color:${noteColor};">${kpi.note ? arrow + e(kpi.note) : '&nbsp;'}</td></tr>
</table>`;
}

export function chartHtml(report) {
  const t = themeOf(report);
  const { data } = report.chart;
  const max = Math.max(...data.map((d) => d.value), 1);
  const rows = data
    .map((d) => {
      const pct = Math.max(2, Math.round((d.value / max) * 100));
      return `<tr>
<td width="80" style="padding:6px 10px 6px 0;font-size:13px;color:${t.muted};">${e(d.label)}</td>
<td style="padding:6px 0;"><table role="presentation" width="${pct}%" cellpadding="0" cellspacing="0"><tr><td height="14" bgcolor="${report.branding.primaryColor}" style="background:${report.branding.primaryColor};font-size:0;line-height:0;border-radius:3px;">&nbsp;</td></tr></table></td>
<td width="76" align="right" style="padding:6px 0 6px 10px;font-size:13px;font-weight:bold;color:${t.text};">${e(formatCompact(d.value, report.currency))}</td>
</tr>`;
    })
    .join('\n');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${t.bodyFont};">${rows}</table>`;
}

export function insightsHtml(report) {
  const t = themeOf(report);
  const items = report.insights
    .map(
      (s) =>
        `<tr><td width="18" valign="top" style="padding:5px 0;color:${report.branding.primaryColor};font-size:15px;line-height:22px;">&#9632;</td><td style="padding:5px 0;font-size:15px;line-height:22px;color:${t.text};">${e(s)}</td></tr>`,
    )
    .join('\n');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${t.bodyFont};">${items}</table>`;
}

export function footerHtml(report) {
  const t = themeOf(report);
  const text = report.footer.text || report.company.name;
  return `<div style="font-family:${t.bodyFont};font-size:12px;line-height:18px;color:${t.muted};text-align:center;">${e(text)}</div>`;
}

/** Plain-text KPI lines, used by tests and as a sanity check of shared data. */
export function kpiLines(report) {
  return kpisOf(report).map((k) => `${k.label}: ${k.value}`);
}
