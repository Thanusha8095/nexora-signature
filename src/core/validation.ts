import { computeReportMetrics } from './calculations.ts';
import { containsConfidentialFinancialReference } from './redaction.ts';
import { sanitizeCssColor, validateSafeImageDataUrl } from './security.ts';
import { computeHexContrast, resolveBrandTheme } from './themes.ts';
import type { ReportInputData, ValidationResult } from './types.ts';

export function validateReportData(report: ReportInputData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!report.branding.companyName || report.branding.companyName.trim().length < 2) {
    errors['branding.companyName'] = 'Company name must be at least 2 characters.';
  }
  if (!report.title || report.title.trim().length < 3) {
    errors['title'] = 'Report title must be at least 3 characters.';
  }
  if (!report.reportingPeriod || report.reportingPeriod.trim().length < 2) {
    errors['reportingPeriod'] = 'Reporting period is required.';
  }
  if (!report.previousPeriodLabel || report.previousPeriodLabel.trim().length < 2) {
    errors['previousPeriodLabel'] = 'Previous period label is required.';
  }

  const logoValidation = validateSafeImageDataUrl(report.branding.logoDataUrl);
  if (!logoValidation.valid && logoValidation.error) {
    errors['branding.logoDataUrl'] = logoValidation.error;
  }

  if (
    report.branding.primaryColor &&
    sanitizeCssColor(report.branding.primaryColor, '') === ''
  ) {
    errors['branding.primaryColor'] = 'Primary brand color must be a valid hex value (#RRGGBB).';
  }
  if (
    report.branding.accentColor &&
    sanitizeCssColor(report.branding.accentColor, '') === ''
  ) {
    errors['branding.accentColor'] = 'Accent brand color must be a valid hex value (#RRGGBB).';
  }

  if (!Number.isFinite(report.currentPeriod.revenue) || report.currentPeriod.revenue < 0) {
    errors['currentPeriod.revenue'] = 'Current revenue must be a non-negative number.';
  }
  if (!Number.isFinite(report.currentPeriod.expenses) || report.currentPeriod.expenses < 0) {
    errors['currentPeriod.expenses'] = 'Current expenses must be a non-negative number.';
  }
  if (
    !Number.isFinite(report.currentPeriod.customerCount) ||
    report.currentPeriod.customerCount < 0
  ) {
    errors['currentPeriod.customerCount'] = 'Customer count must be a non-negative number.';
  }

  if (report.currentPeriod.retentionRatePct !== undefined) {
    if (
      !Number.isFinite(report.currentPeriod.retentionRatePct) ||
      report.currentPeriod.retentionRatePct < 0 ||
      report.currentPeriod.retentionRatePct > 200
    ) {
      errors['currentPeriod.retentionRatePct'] =
        'Retention rate must be between 0% and 200% (supports net revenue retention).';
    }
  }
  if (report.currentPeriod.npsScore !== undefined) {
    if (
      !Number.isFinite(report.currentPeriod.npsScore) ||
      report.currentPeriod.npsScore < -100 ||
      report.currentPeriod.npsScore > 100
    ) {
      errors['currentPeriod.npsScore'] = 'NPS score must be between -100 and +100.';
    }
  }

  if (!Number.isFinite(report.previousPeriod.revenue) || report.previousPeriod.revenue < 0) {
    errors['previousPeriod.revenue'] = 'Previous revenue must be a non-negative number.';
  }
  if (!Number.isFinite(report.previousPeriod.expenses) || report.previousPeriod.expenses < 0) {
    errors['previousPeriod.expenses'] = 'Previous expenses must be a non-negative number.';
  }
  if (
    !Number.isFinite(report.previousPeriod.customerCount) ||
    report.previousPeriod.customerCount < 0
  ) {
    errors['previousPeriod.customerCount'] = 'Previous customer count must be a non-negative number.';
  }

  if (report.previousPeriod.retentionRatePct !== undefined) {
    if (
      !Number.isFinite(report.previousPeriod.retentionRatePct) ||
      report.previousPeriod.retentionRatePct < 0 ||
      report.previousPeriod.retentionRatePct > 200
    ) {
      errors['previousPeriod.retentionRatePct'] =
        'Previous retention rate must be between 0% and 200%.';
    }
  }
  if (report.previousPeriod.npsScore !== undefined) {
    if (
      !Number.isFinite(report.previousPeriod.npsScore) ||
      report.previousPeriod.npsScore < -100 ||
      report.previousPeriod.npsScore > 100
    ) {
      errors['previousPeriod.npsScore'] = 'Previous NPS score must be between -100 and +100.';
    }
  }

  if (report.monthlySeries.length < 2) {
    errors['monthlySeries'] = 'Include at least 2 monthly data points to render trend charts.';
  } else {
    report.monthlySeries.forEach((m, idx) => {
      if (!m.month.trim()) {
        errors[`monthlySeries.${idx}.month`] = `Month label #${idx + 1} is required.`;
      }
      if (!Number.isFinite(m.revenue) || m.revenue < 0) {
        errors[`monthlySeries.${idx}.revenue`] = `Monthly revenue for ${m.month || `#${idx + 1}`} must be non-negative.`;
      }
      if (!Number.isFinite(m.expenses) || m.expenses < 0) {
        errors[`monthlySeries.${idx}.expenses`] = `Monthly expenses for ${m.month || `#${idx + 1}`} must be non-negative.`;
      }
    });
  }

  if (report.revenueCategories.length === 0) {
    errors['revenueCategories'] = 'At least one revenue category is required.';
  } else {
    report.revenueCategories.forEach((c, idx) => {
      if (!c.name.trim()) {
        errors[`revenueCategories.${idx}.name`] = `Revenue category #${idx + 1} needs a name.`;
      }
      if (!Number.isFinite(c.amount) || c.amount < 0) {
        errors[`revenueCategories.${idx}.amount`] = `Revenue category "${c.name || idx + 1}" must be non-negative.`;
      }
    });
  }

  if (report.expenseCategories.length === 0) {
    errors['expenseCategories'] = 'At least one expense category is required.';
  } else {
    report.expenseCategories.forEach((c, idx) => {
      if (!c.name.trim()) {
        errors[`expenseCategories.${idx}.name`] = `Expense category #${idx + 1} needs a name.`;
      }
      if (!Number.isFinite(c.amount) || c.amount < 0) {
        errors[`expenseCategories.${idx}.amount`] = `Expense category "${c.name || idx + 1}" must be non-negative.`;
      }
    });
  }

  if (!report.narrative.overview.trim()) {
    errors['narrative.overview'] = 'Executive overview narrative cannot be empty.';
  }

  if (report.strategicPriorities.length < 3 || report.strategicPriorities.length > 5) {
    warnings.push(
      `Executive reports perform best with 3 to 5 strategic priorities (currently ${report.strategicPriorities.length}).`
    );
  }

  // Client Edition unredacted-prose advisory
  const rawMetrics = computeReportMetrics(report);
  const clientRedactionActive = report.audienceEdition === 'client';
  const rawNarrativeHasConfTerms =
    containsConfidentialFinancialReference(report.narrative.overview, report, rawMetrics) ||
    containsConfidentialFinancialReference(report.narrative.achievements, report, rawMetrics) ||
    containsConfidentialFinancialReference(report.narrative.challenges, report, rawMetrics) ||
    containsConfidentialFinancialReference(report.narrative.closingTakeaway, report, rawMetrics);

  if (clientRedactionActive && rawNarrativeHasConfTerms && !report.narrative.clientSummary?.trim()) {
    warnings.push(
      'Client Edition detected internal profit/cost terms in raw narrative prose; pre-render redaction will sanitize all exports automatically. Optionally add a dedicated Client Summary in Report Editor.'
    );
  }

  // Custom accent contrast advisory (auto-compensated via accentInk)
  const resolvedTheme = resolveBrandTheme(report);
  const rawAccentSurfaceContrast = Math.min(
    computeHexContrast(resolvedTheme.colors.accent, resolvedTheme.colors.surface),
    computeHexContrast(resolvedTheme.colors.accent, resolvedTheme.colors.elevated)
  );
  const accentInkContrast = Math.min(
    computeHexContrast(resolvedTheme.colors.accentInk, resolvedTheme.colors.surface),
    computeHexContrast(resolvedTheme.colors.accentInk, resolvedTheme.colors.elevated)
  );
  if (rawAccentSurfaceContrast < 4.5) {
    warnings.push(
      `Accent color (${resolvedTheme.colors.accent}) raw contrast is ${rawAccentSurfaceContrast.toFixed(1)}:1 on surface; small text automatically uses WCAG AA accentInk (${resolvedTheme.colors.accentInk}, ${accentInkContrast.toFixed(1)}:1).`
    );
  }

  // Reconciliation warnings (transparent — never silently invent numbers)
  const monthlyRevSum = report.monthlySeries.reduce((s, m) => s + (Number(m.revenue) || 0), 0);
  if (
    report.currentPeriod.revenue > 0 &&
    Math.abs(monthlyRevSum - report.currentPeriod.revenue) / report.currentPeriod.revenue > 0.02
  ) {
    warnings.push(
      `Monthly revenue sum (${monthlyRevSum.toLocaleString()}) differs from period revenue (${report.currentPeriod.revenue.toLocaleString()}) by more than 2%.`
    );
  }

  const revCatSum = report.revenueCategories.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  if (
    report.currentPeriod.revenue > 0 &&
    Math.abs(revCatSum - report.currentPeriod.revenue) / report.currentPeriod.revenue > 0.02
  ) {
    warnings.push(
      `Revenue categories sum (${revCatSum.toLocaleString()}) differs from reported period revenue (${report.currentPeriod.revenue.toLocaleString()}).`
    );
  }

  const expCatSum = report.expenseCategories.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  if (
    report.currentPeriod.expenses > 0 &&
    Math.abs(expCatSum - report.currentPeriod.expenses) / report.currentPeriod.expenses > 0.02
  ) {
    warnings.push(
      `Expense categories sum (${expCatSum.toLocaleString()}) differs from reported period expenses (${report.currentPeriod.expenses.toLocaleString()}).`
    );
  }

  const segSum = report.segments.reduce((s, seg) => s + (Number(seg.revenue) || 0), 0);
  if (
    report.segments.length > 0 &&
    report.currentPeriod.revenue > 0 &&
    Math.abs(segSum - report.currentPeriod.revenue) / report.currentPeriod.revenue > 0.02
  ) {
    warnings.push(
      `Segment revenue sum (${segSum.toLocaleString()}) differs from reported period revenue (${report.currentPeriod.revenue.toLocaleString()}).`
    );
  }

  const checks: NonNullable<ValidationResult['checks']> = [
    {
      id: 'identity',
      label: 'Identity & Reporting Periods',
      status:
        errors['branding.companyName'] ||
        errors['title'] ||
        errors['reportingPeriod'] ||
        errors['previousPeriodLabel']
          ? 'fail'
          : 'pass',
      detail:
        errors['branding.companyName'] || errors['title'] || errors['reportingPeriod']
          ? 'Missing required company, title, or period label.'
          : `${report.branding.companyName} · ${report.reportingPeriod} vs ${report.previousPeriodLabel}`,
      sectionHint: 'general',
    },
    {
      id: 'core-numbers',
      label: 'Period Financial & Customer Health Figures',
      status:
        errors['currentPeriod.revenue'] ||
        errors['currentPeriod.expenses'] ||
        errors['currentPeriod.customerCount'] ||
        errors['currentPeriod.retentionRatePct'] ||
        errors['currentPeriod.npsScore'] ||
        errors['previousPeriod.revenue'] ||
        errors['previousPeriod.expenses'] ||
        errors['previousPeriod.customerCount'] ||
        errors['previousPeriod.retentionRatePct'] ||
        errors['previousPeriod.npsScore']
          ? 'fail'
          : 'pass',
      detail: 'All current and comparison revenue, expense, customer, retention, and NPS figures are valid.',
      sectionHint: 'financials',
    },
    {
      id: 'monthly-reconcile',
      label: 'Monthly Series Reconciliation',
      status:
        errors['monthlySeries'] ||
        Object.keys(errors).some((k) => k.startsWith('monthlySeries.'))
          ? 'fail'
          : report.currentPeriod.revenue > 0 &&
              Math.abs(monthlyRevSum - report.currentPeriod.revenue) /
                report.currentPeriod.revenue >
                0.02
            ? 'warn'
            : 'pass',
      detail:
        report.currentPeriod.revenue > 0
          ? `Monthly sum ${monthlyRevSum.toLocaleString()} vs period revenue ${report.currentPeriod.revenue.toLocaleString()}`
          : 'Monthly series populated.',
      sectionHint: 'financials',
    },
    {
      id: 'rev-cat-reconcile',
      label: 'Revenue Category Totals',
      status:
        errors['revenueCategories'] ||
        Object.keys(errors).some((k) => k.startsWith('revenueCategories.'))
          ? 'fail'
          : report.currentPeriod.revenue > 0 &&
              Math.abs(revCatSum - report.currentPeriod.revenue) / report.currentPeriod.revenue >
                0.02
            ? 'warn'
            : 'pass',
      detail: `Categories sum ${revCatSum.toLocaleString()} vs period revenue ${report.currentPeriod.revenue.toLocaleString()}`,
      sectionHint: 'categories',
    },
    {
      id: 'exp-cat-reconcile',
      label: 'Expense Category Totals',
      status:
        errors['expenseCategories'] ||
        Object.keys(errors).some((k) => k.startsWith('expenseCategories.'))
          ? 'fail'
          : report.currentPeriod.expenses > 0 &&
              Math.abs(expCatSum - report.currentPeriod.expenses) /
                report.currentPeriod.expenses >
                0.02
            ? 'warn'
            : 'pass',
      detail: `Categories sum ${expCatSum.toLocaleString()} vs period expenses ${report.currentPeriod.expenses.toLocaleString()}`,
      sectionHint: 'categories',
    },
    {
      id: 'segment-reconcile',
      label: 'Segment Contribution Totals',
      status:
        report.segments.length > 0 &&
        report.currentPeriod.revenue > 0 &&
        Math.abs(segSum - report.currentPeriod.revenue) / report.currentPeriod.revenue > 0.02
          ? 'warn'
          : 'pass',
      detail:
        report.segments.length > 0
          ? `Segments sum ${segSum.toLocaleString()} vs period revenue ${report.currentPeriod.revenue.toLocaleString()}`
          : 'No operating segments defined (optional).',
      sectionHint: 'categories',
    },
    {
      id: 'narrative',
      label: 'Executive Narrative & Priorities',
      status: errors['narrative.overview']
        ? 'fail'
        : report.strategicPriorities.length < 3 || report.strategicPriorities.length > 5
          ? 'warn'
          : 'pass',
      detail: `${report.strategicPriorities.length} strategic priorities configured (recommended 3–5).`,
      sectionHint: 'narrative',
    },
    {
      id: 'brand-safety',
      label: 'Brand Logo, Color Safety & WCAG AA Accent Ink',
      status:
        errors['branding.logoDataUrl'] ||
        errors['branding.primaryColor'] ||
        errors['branding.accentColor']
          ? 'fail'
          : accentInkContrast < 4.5
            ? 'warn'
            : 'pass',
      detail: `Hex colors validated, embedded logo verified script-free, accentInk contrast ${accentInkContrast.toFixed(1)}:1.`,
      sectionHint: 'branding',
    },
  ];

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
    checks,
  };
}
