import { cloneReportData, SAMPLE_REPORTS } from '../core/samples.ts';
import type { ReportInputData } from '../core/types.ts';

const ACTIVE_KEY = 'nexora_active_report_v1';
const ACTIVE_SAVED_AT_KEY = 'nexora_active_report_saved_at_v1';
const RECENT_KEY = 'nexora_recent_reports_v1';
const ONBOARDING_KEY = 'nexora_onboarding_dismissed_v1';
const FILENAME_KEY = 'nexora_export_filename_v1';

export interface SavedReportEntry {
  id: string;
  title: string;
  companyName: string;
  reportingPeriod: string;
  theme: ReportInputData['theme'];
  updatedAt: string;
  report: ReportInputData;
}

export interface SaveReportResult {
  ok: boolean;
  savedAt: string | null;
  error?: string;
}

export function loadActiveReportWithMeta(): {
  report: ReportInputData;
  restoredFromStorage: boolean;
  savedAt: string | null;
} {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    const savedAt = localStorage.getItem(ACTIVE_SAVED_AT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReportInputData;
      if (parsed && parsed.branding && parsed.currentPeriod) {
        return {
          report: parsed,
          restoredFromStorage: true,
          savedAt: savedAt || parsed.updatedAt || null,
        };
      }
    }
  } catch {
    // ignore storage parse failure
  }
  return {
    report: cloneReportData(SAMPLE_REPORTS[0].report),
    restoredFromStorage: false,
    savedAt: null,
  };
}

export function loadActiveReport(): ReportInputData {
  return loadActiveReportWithMeta().report;
}

export function saveActiveReport(report: ReportInputData): SaveReportResult {
  try {
    const savedAt = new Date().toISOString();
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(report));
    localStorage.setItem(ACTIVE_SAVED_AT_KEY, savedAt);
    return { ok: true, savedAt };
  } catch (err) {
    return {
      ok: false,
      savedAt: null,
      error:
        err instanceof Error
          ? err.message
          : 'Browser storage quota exceeded while auto-saving report.',
    };
  }
}

export function loadRecentReports(): SavedReportEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedReportEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveReportToRecents(report: ReportInputData): SavedReportEntry[] {
  const existing = loadRecentReports();
  const now = new Date().toISOString();
  const entry: SavedReportEntry = {
    id: report.id || `rep-${Date.now()}`,
    title: report.title,
    companyName: report.branding.companyName,
    reportingPeriod: report.reportingPeriod,
    theme: report.theme,
    updatedAt: now,
    report: cloneReportData({ ...report, updatedAt: now }),
  };

  const filtered = existing.filter((item) => item.id !== entry.id);
  const next = [entry, ...filtered].slice(0, 12);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function deleteRecentReport(id: string): SavedReportEntry[] {
  const existing = loadRecentReports();
  const next = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingDismissed(dismissed: boolean): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, dismissed ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function loadExportFilename(): string {
  try {
    return localStorage.getItem(FILENAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveExportFilename(name: string): void {
  try {
    localStorage.setItem(FILENAME_KEY, name);
  } catch {
    // ignore
  }
}
