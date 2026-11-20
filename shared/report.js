// Shared report model: defaults, samples, validation and formatting.
// Imported by BOTH the React dashboard and the Node export server, so every
// output format is built from exactly the same validated data.

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'];

export const THEMES = {
  executive: {
    id: 'executive',
    label: 'Executive Professional',
    description: 'Solid brand header band, tinted page, serif headings. Built for board packs and investor updates.',
    headingFont: { label: 'Georgia', value: 'Georgia,"Times New Roman",serif' },
    bodyFont: 'Arial,Helvetica,sans-serif',
    pageBg: '#EEF0F6',
    cardBg: '#FFFFFF',
    text: '#101828',
    muted: '#667085',
    border: '#E4E7EC',
  },
  minimal: {
    id: 'minimal',
    label: 'Modern Minimal',
    description: 'White page, thin accent rule, sans-serif throughout. Quiet and easy to scan.',
    headingFont: { label: 'Arial', value: 'Arial,Helvetica,sans-serif' },
    bodyFont: 'Arial,Helvetica,sans-serif',
    pageBg: '#FFFFFF',
    cardBg: '#F8F9FC',
    text: '#101828',
    muted: '#667085',
    border: '#E4E7EC',
  },
};

const LIMITS = { name: 80, title: 100, period: 40, summary: 600, insight: 240, label: 20, footer: 200, url: 200 };
const HEX = /^#[0-9a-fA-F]{6}$/;

export const SAMPLE_REPORTS = [
  {
    id: 'lumen',
    name: 'Lumen Cloud — monthly performance',
    data: {
      company: { name: 'Lumen Cloud Co.', website: 'https://example.com/lumen' },
      report: {
        title: 'Monthly Business Performance',
        period: 'October 2026',
        summary:
          'October closed with record revenue as the new usage-based plan converted well. Costs rose with two engineering hires and a one-off migration, but margin stayed above 60%. Churn held steady and enterprise pipeline grew for the third month in a row.',
      },
      currency: 'USD',
      metrics: { revenue: 48250, expenses: 18200, customers: 1284, growth: 18.5 },
      chart: {
        title: 'Revenue by month',
        data: [
          { label: 'May', value: 31200 },
          { label: 'Jun', value: 33800 },
          { label: 'Jul', value: 36100 },
          { label: 'Aug', value: 39400 },
          { label: 'Sep', value: 42600 },
          { label: 'Oct', value: 48250 },
        ],
      },
      insights: [
        'Usage-based plan accounts for 41% of new sign-ups since launch.',
        'Support tickets per customer fell as the new help center went live.',
        'Two enterprise trials are scheduled to convert in November.',
      ],
      branding: { primaryColor: '#635BFF', secondaryColor: '#101B3D' },
      footer: { text: 'Lumen Cloud Co. · Confidential · Prepared by Finance' },
      theme: 'executive',
    },
  },
  {
    id: 'harbor',
    name: 'Harbor & Pine — quarterly review',
    data: {
      company: { name: 'Harbor & Pine Coffee', website: 'https://example.com/harbor-pine' },
      report: {
        title: 'Quarterly Review',
        period: 'Q3 2026',
        summary:
          'Three new cafes opened this quarter and wholesale orders grew faster than retail. Green coffee prices pushed expenses up, so we raised menu prices by 4% in September.',
      },
      currency: 'EUR',
      metrics: { revenue: 212400, expenses: 163900, customers: 5120, growth: 9.2 },
      chart: {
        title: 'Revenue by channel',
        data: [
          { label: 'Cafes', value: 118000 },
          { label: 'Wholesale', value: 64400 },
          { label: 'Online', value: 30000 },
        ],
      },
      insights: [
        'Wholesale is now 30% of revenue, up from 22% last quarter.',
        'Average order value rose after the September price change.',
      ],
      branding: { primaryColor: '#0F766E', secondaryColor: '#1F2937' },
      footer: { text: 'Harbor & Pine Coffee · Internal use only' },
      theme: 'minimal',
    },
  },
];

export function structuredCloneSafe(v) {
  return JSON.parse(JSON.stringify(v));
}

export function defaultReport() {
  return structuredCloneSafe(SAMPLE_REPORTS[0].data);
}

// ---------- validation ----------

function toNumber(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function text(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * Validates and normalises a report. Never throws.
 * Returns { ok, errors, value } where errors is keyed by field path.
 */
export function validateReport(input) {
  const src = input && typeof input === 'object' ? input : {};
  const errors = {};

  const company = {
    name: text(src.company?.name, LIMITS.name),
    website: text(src.company?.website, LIMITS.url),
  };
  if (!company.name) errors['company.name'] = 'Enter a company name.';
  if (company.website && !/^https?:\/\/[^\s<>"']+$/i.test(company.website)) {
    errors['company.website'] = 'Use a full link that starts with http:// or https://.';
  }

  const report = {
    title: text(src.report?.title, LIMITS.title),
    period: text(src.report?.period, LIMITS.period),
    summary: text(src.report?.summary, LIMITS.summary),
  };
  if (!report.title) errors['report.title'] = 'Enter a report title.';
  if (!report.period) errors['report.period'] = 'Enter the reporting period.';
  if (!report.summary) errors['report.summary'] = 'Write a short summary.';

  const currency = CURRENCIES.includes(src.currency) ? src.currency : null;
  if (!currency) errors.currency = 'Choose a currency.';

  const m = src.metrics || {};
  const metrics = {
    revenue: toNumber(m.revenue),
    expenses: toNumber(m.expenses),
    customers: toNumber(m.customers),
    growth: toNumber(m.growth),
  };
  if (Number.isNaN(metrics.revenue) || metrics.revenue < 0) errors['metrics.revenue'] = 'Enter revenue as a number, 0 or more.';
  if (Number.isNaN(metrics.expenses) || metrics.expenses < 0) errors['metrics.expenses'] = 'Enter expenses as a number, 0 or more.';
  if (Number.isNaN(metrics.customers) || metrics.customers < 0 || !Number.isInteger(metrics.customers)) {
    errors['metrics.customers'] = 'Enter customers as a whole number, 0 or more.';
  }
  if (Number.isNaN(metrics.growth) || metrics.growth < -100 || metrics.growth > 1000) {
    errors['metrics.growth'] = 'Enter growth as a percentage between -100 and 1000.';
  }

  const rawData = Array.isArray(src.chart?.data) ? src.chart.data : [];
  const chart = {
    title: text(src.chart?.title, LIMITS.title) || 'Trend',
    data: rawData.slice(0, 12).map((d) => ({ label: text(d?.label, LIMITS.label), value: toNumber(d?.value) })),
  };
  if (chart.data.length < 2) errors.chart = 'Add at least two chart rows.';
  chart.data.forEach((d, i) => {
    if (!d.label) errors[`chart.${i}.label`] = 'Enter a label.';
    if (Number.isNaN(d.value) || d.value < 0) errors[`chart.${i}.value`] = 'Enter a number, 0 or more.';
  });

  const insights = (Array.isArray(src.insights) ? src.insights : [])
    .map((s) => text(s, LIMITS.insight))
    .filter(Boolean)
    .slice(0, 6);

  const branding = {
    primaryColor: text(src.branding?.primaryColor, 7),
    secondaryColor: text(src.branding?.secondaryColor, 7),
  };
  if (!HEX.test(branding.primaryColor)) errors['branding.primaryColor'] = 'Use a hex color like #635BFF.';
  if (!HEX.test(branding.secondaryColor)) errors['branding.secondaryColor'] = 'Use a hex color like #101B3D.';

  const theme = THEMES[src.theme] ? src.theme : null;
  if (!theme) errors.theme = 'Choose a theme.';

  const footer = { text: text(src.footer?.text, LIMITS.footer) };

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { company, report, currency, metrics, chart, insights, branding, footer, theme },
  };
}

// ---------- derived values and formatting ----------

export function profitOf(metrics) {
  return metrics.revenue - metrics.expenses;
}

export function formatMoney(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatCompact(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/** KPI list used identically by every output format. `report` must be validated. */
export function kpisOf(report) {
  const { metrics, currency } = report;
  const profit = profitOf(metrics);
  const margin = metrics.revenue > 0 ? (profit / metrics.revenue) * 100 : 0;
  const expenseShare = metrics.revenue > 0 ? (metrics.expenses / metrics.revenue) * 100 : 0;
  return [
    { key: 'revenue', label: 'Revenue', value: formatMoney(metrics.revenue, currency), note: '' },
    { key: 'expenses', label: 'Expenses', value: formatMoney(metrics.expenses, currency), note: `${expenseShare.toFixed(1)}% of revenue` },
    { key: 'profit', label: 'Profit', value: formatMoney(profit, currency), note: `${margin.toFixed(1)}% margin`, negative: profit < 0 },
    { key: 'customers', label: 'Customers', value: formatNumber(metrics.customers), note: '' },
    { key: 'growth', label: 'Growth', value: formatPercent(metrics.growth), note: 'vs previous period', negative: metrics.growth < 0, positive: metrics.growth > 0 },
  ];
}

// ---------- html helpers ----------

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Picks dark or white text for a given #RRGGBB background. */
export function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#101828' : '#FFFFFF';
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'report';
}

export const EXPORT_KINDS = {
  'email-html': { ext: 'html', suffix: 'email', mime: 'text/html; charset=utf-8', label: 'Email HTML' },
  'email-text': { ext: 'txt', suffix: 'email', mime: 'text/plain; charset=utf-8', label: 'Email plain text' },
  'web-html': { ext: 'html', suffix: 'web', mime: 'text/html; charset=utf-8', label: 'Web HTML' },
  pdf: { ext: 'pdf', suffix: 'report', mime: 'application/pdf', label: 'PDF' },
  png: { ext: 'png', suffix: 'report', mime: 'image/png', label: 'PNG image' },
};

export function exportFilename(report, kind) {
  const k = EXPORT_KINDS[kind];
  return `nexora-${slug(report.company.name)}-${slug(report.report.period)}-${k.suffix}.${k.ext}`;
}
