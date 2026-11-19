import { useCallback, useMemo, useState } from 'react';
import { BrandingView } from './components/BrandingView.tsx';
import { EmailLabView } from './components/EmailLabView.tsx';
import { ExportCentreView } from './components/ExportCentreView.tsx';
import { LiveStudioView } from './components/LiveStudioView.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { PresentationModeModal } from './components/PresentationModeModal.tsx';
import { ReportEditorView } from './components/ReportEditorView.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { SimulatorView } from './components/SimulatorView.tsx';
import { TemplatesView } from './components/TemplatesView.tsx';
import { ToastBanner, type ToastMessage } from './components/ToastBanner.tsx';
import { type StudioTabId, TopBar } from './components/TopBar.tsx';
import { VersionCompareView } from './components/VersionCompareView.tsx';
import { getAudienceEdition } from './core/audiences.ts';
import { cloneReportData, SAMPLE_REPORTS } from './core/samples.ts';
import { REPORT_THEMES } from './core/themes.ts';
import type { AudienceEditionId, ReportInputData, ReportThemeId } from './core/types.ts';
import { validateReportData } from './core/validation.ts';
import { useAutoSaveReport } from './hooks/useAutoSaveReport.ts';
import {
  deleteRecentReport,
  isOnboardingDismissed,
  loadActiveReportWithMeta,
  loadExportFilename,
  loadRecentReports,
  saveExportFilename,
  saveReportToRecents,
  type SavedReportEntry,
  setOnboardingDismissed,
} from './services/storage.ts';

export default function App() {
  const [initialMeta] = useState(() => loadActiveReportWithMeta());
  const [activeTab, setActiveTab] = useState<StudioTabId>('overview');
  const [report, setReport] = useState<ReportInputData>(initialMeta.report);
  const [recentReports, setRecentReports] = useState<SavedReportEntry[]>(() => loadRecentReports());
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingDismissed());
  const [customFilename, setCustomFilename] = useState<string>(() => loadExportFilename());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const validation = useMemo(() => validateReportData(report), [report]);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, detail?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, detail }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const autoSave = useAutoSaveReport(report, initialMeta.savedAt, {
    delayMs: 500,
    onError: (errMsg) => notify('error', 'Auto-save failed', errMsg),
  });

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSelectTheme = (themeId: ReportThemeId) => {
    const t = REPORT_THEMES[themeId];
    setReport((prev) => ({
      ...prev,
      theme: themeId,
      branding: {
        ...prev.branding,
        primaryColor: t.colors.canvas,
        accentColor: t.colors.accent,
      },
      updatedAt: new Date().toISOString(),
    }));
    notify('success', `Applied ${t.name} design system`, t.subtitle);
  };

  const handleSelectAudience = (editionId: AudienceEditionId) => {
    const ed = getAudienceEdition(editionId);
    setReport((prev) => ({
      ...prev,
      audienceEdition: editionId,
      updatedAt: new Date().toISOString(),
    }));
    notify('success', `Switched to ${ed.name}`, ed.targetReader);
  };

  const handleLoadSample = (sampleKey: string) => {
    const found = SAMPLE_REPORTS.find((s) => s.key === sampleKey);
    if (!found) return;
    setReport(cloneReportData(found.report));
    notify(
      'success',
      `Loaded ${found.industry} sample`,
      `${found.report.branding.companyName} (illustrative figures)`
    );
  };

  const handleResetReport = () => {
    const matchingSample =
      SAMPLE_REPORTS.find((s) => s.key === report.sampleKey) ?? SAMPLE_REPORTS[0];
    setReport(cloneReportData(matchingSample.report));
    notify('success', 'Report reset', `Restored baseline ${matchingSample.industry} dataset.`);
  };

  const handleSaveSnapshot = () => {
    autoSave.flushNow();
    const next = saveReportToRecents(report);
    setRecentReports(next);
    notify('success', 'Snapshot saved', `${report.branding.companyName} stored in Recent Reports.`);
  };

  const handleLoadRecent = (entry: SavedReportEntry) => {
    setReport(cloneReportData(entry.report));
    notify('success', 'Loaded saved snapshot', `${entry.companyName} · ${entry.reportingPeriod}`);
  };

  const handleDeleteRecent = (id: string) => {
    const next = deleteRecentReport(id);
    setRecentReports(next);
    notify('info', 'Removed saved snapshot');
  };

  const handleFilenameChange = (name: string) => {
    setCustomFilename(name);
    saveExportFilename(name);
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingDismissed(true);
  };

  const handleReopenOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingDismissed(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F8F6F0] text-[#141413]">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPresentation={() => setPresentationOpen(true)}
        recentReports={recentReports}
        activeReportId={report.id}
        onLoadRecent={handleLoadRecent}
        onSaveCurrent={handleSaveSnapshot}
        onDeleteRecent={handleDeleteRecent}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          companyName={report.branding.companyName}
          onSelectTab={setActiveTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {activeTab === 'overview' ? (
            <OverviewView
              report={report}
              validation={validation}
              recentReports={recentReports}
              showOnboarding={showOnboarding}
              onDismissOnboarding={handleDismissOnboarding}
              onReopenOnboarding={handleReopenOnboarding}
              onSelectTab={setActiveTab}
              onLoadSample={handleLoadSample}
              onLoadRecent={handleLoadRecent}
              onSelectTheme={handleSelectTheme}
              onSelectAudience={handleSelectAudience}
              onOpenPresentation={() => setPresentationOpen(true)}
            />
          ) : null}

          {activeTab === 'editor' ? (
            <ReportEditorView
              report={report}
              validation={validation}
              autoSave={autoSave}
              onChange={setReport}
              onReset={handleResetReport}
              onSaveSnapshot={handleSaveSnapshot}
              onOpenPreview={() => setActiveTab('preview')}
              onOpenBranding={() => setActiveTab('branding')}
            />
          ) : null}

          {activeTab === 'preview' ? (
            <LiveStudioView
              report={report}
              onSelectTheme={handleSelectTheme}
              onSelectAudience={handleSelectAudience}
              onGoToExport={() => setActiveTab('export')}
              onOpenPresentation={() => setPresentationOpen(true)}
            />
          ) : null}

          {activeTab === 'email-lab' ? (
            <EmailLabView
              report={report}
              onSelectAudience={handleSelectAudience}
              onGoToExport={() => setActiveTab('export')}
            />
          ) : null}

          {activeTab === 'simulator' ? (
            <SimulatorView
              report={report}
              onChange={setReport}
              onOpenPreview={() => setActiveTab('preview')}
            />
          ) : null}

          {activeTab === 'versions' ? (
            <VersionCompareView report={report} recentReports={recentReports} />
          ) : null}

          {activeTab === 'templates' ? (
            <TemplatesView
              report={report}
              onLoadSample={handleLoadSample}
              onSelectTheme={handleSelectTheme}
              onSelectAudience={handleSelectAudience}
              onOpenPreview={() => setActiveTab('preview')}
              onOpenPresentation={() => setPresentationOpen(true)}
            />
          ) : null}

          {activeTab === 'export' ? (
            <ExportCentreView
              report={report}
              validation={validation}
              customFilename={customFilename}
              onFilenameChange={handleFilenameChange}
              onNotify={notify}
              onGoToEditor={() => setActiveTab('editor')}
            />
          ) : null}

          {activeTab === 'branding' ? (
            <BrandingView
              report={report}
              validation={validation}
              onChange={setReport}
              onNotify={notify}
            />
          ) : null}
        </main>
      </div>

      {presentationOpen ? (
        <PresentationModeModal
          report={report}
          onSelectAudience={handleSelectAudience}
          onClose={() => setPresentationOpen(false)}
        />
      ) : null}

      <ToastBanner toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
