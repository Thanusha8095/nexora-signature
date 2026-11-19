import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Columns, Download, Loader2, Monitor, Presentation, RefreshCw, Smartphone } from 'lucide-react';
import { AUDIENCE_EDITION_LIST } from '../core/audiences.ts';
import { scoreReportExports } from '../core/exportQuality.ts';
import { THEME_LIST } from '../core/themes.ts';
import type {
  AudienceEditionId,
  PreviewMode,
  ReportInputData,
  ReportThemeId,
} from '../core/types.ts';
import {
  renderEmailHtml,
  renderPlainTextEmail,
  renderPrintDocumentHtml,
  renderReportDesignJson,
  renderWebHtml,
} from '../elements/renderers.ts';

interface LiveStudioViewProps {
  report: ReportInputData;
  onSelectTheme: (theme: ReportThemeId) => void;
  onSelectAudience: (edition: AudienceEditionId) => void;
  onGoToExport: () => void;
  onOpenPresentation: () => void;
}

export function LiveStudioView({
  report,
  onSelectTheme,
  onSelectAudience,
  onGoToExport,
  onOpenPresentation,
}: LiveStudioViewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('web');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [compareMode, setCompareMode] = useState(false);

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pngBlobUrl, setPngBlobUrl] = useState<string | null>(null);
  const [binaryLoading, setBinaryLoading] = useState<'pdf' | 'png' | null>(null);
  const [binaryError, setBinaryError] = useState<string | null>(null);
  const [binarySizeKb, setBinarySizeKb] = useState<number | null>(null);

  const pdfUrlRef = useRef<string | null>(null);
  const pngUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      if (pngUrlRef.current) URL.revokeObjectURL(pngUrlRef.current);
    };
  }, []);

  const fetchBinaryPreview = useCallback(
    async (kind: 'pdf' | 'png') => {
      setBinaryLoading(kind);
      setBinaryError(null);
      try {
        const endpoint = kind === 'pdf' ? '/api/export/pdf' : '/api/export/png';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report,
            viewportWidth: viewport === 'mobile' ? 430 : 1080,
          }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
          throw new Error(err.error || `HTTP ${resp.status}`);
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        setBinarySizeKb(blob.size / 1024);

        if (kind === 'pdf') {
          if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = url;
          setPdfBlobUrl(url);
        } else {
          if (pngUrlRef.current) URL.revokeObjectURL(pngUrlRef.current);
          pngUrlRef.current = url;
          setPngBlobUrl(url);
        }
      } catch (err) {
        setBinaryError(
          err instanceof Error ? err.message : `Unable to render ${kind.toUpperCase()} preview.`
        );
      } finally {
        setBinaryLoading(null);
      }
    },
    [report, viewport]
  );

  useEffect(() => {
    if (compareMode) return;
    if (previewMode === 'pdf' || previewMode === 'png') {
      void fetchBinaryPreview(previewMode);
    }
  }, [previewMode, compareMode, fetchBinaryPreview]);

  const renderedOutput = useMemo(() => {
    if (previewMode === 'email') return renderEmailHtml(report);
    if (previewMode === 'plain-text') return renderPlainTextEmail(report);
    if (previewMode === 'document') return renderPrintDocumentHtml(report);
    if (previewMode === 'json') return JSON.stringify(renderReportDesignJson(report, 'web'), null, 2);
    if (previewMode === 'web') return renderWebHtml(report);
    return '';
  }, [report, previewMode]);

  const qualityScore = useMemo(() => scoreReportExports(report), [report]);

  const themeComparisons = useMemo(() => {
    if (!compareMode) return [];
    return THEME_LIST.map((t) => ({
      theme: t,
      html: renderWebHtml({
        ...report,
        theme: t.id,
        branding: { ...report.branding, accentColor: t.colors.accent },
      }),
    }));
  }, [report, compareMode]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120]">
              Five-Format Live Report Studio
            </h1>
            <button
              type="button"
              onClick={onGoToExport}
              className="font-mono-num text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              title="Inspect full Export Quality Scorecard"
            >
              Quality {qualityScore.overallScore}/100 ({qualityScore.grade})
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Inspect Email HTML, Plain-Text, Responsive Web, Playwright A4 PDF, and 2x Retina PNG
            from one shared model.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Audience Edition"
            value={report.audienceEdition ?? 'board'}
            onChange={(e) => onSelectAudience(e.target.value as AudienceEditionId)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1120]"
          >
            {AUDIENCE_EDITION_LIST.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70">
            {THEME_LIST.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTheme(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  report.theme === t.id
                    ? 'bg-white text-[#0B1120] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1120]'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              compareMode
                ? 'border-[#0B1120] bg-[#0B1120] text-[#D4FF33]'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>{compareMode ? 'Exit Comparison' : 'Compare Themes'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenPresentation}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-[#0B1120] text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Presentation className="h-3.5 w-3.5 text-[#0891B2]" />
            <span>Present</span>
          </button>

          <button
            type="button"
            onClick={onGoToExport}
            className="px-3.5 py-2 rounded-lg bg-[#0891B2] text-white text-xs font-semibold hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Export 5 Formats
          </button>
        </div>
      </div>

      {/* Mode & Viewport Toolbar */}
      {!compareMode ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 overflow-x-auto">
              {(
                [
                  { id: 'web', label: '1. Web HTML' },
                  { id: 'email', label: '2. Email HTML' },
                  { id: 'plain-text', label: '3. Plain-Text' },
                  { id: 'pdf', label: '4. A4 PDF (Playwright)' },
                  { id: 'png', label: '5. 2x PNG (Playwright)' },
                  { id: 'document', label: 'Print Markup' },
                  { id: 'json', label: 'Design JSON' },
                ] as { id: PreviewMode; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewMode(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    previewMode === tab.id
                      ? 'bg-white text-[#0B1120] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1120]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {previewMode === 'web' || previewMode === 'email' || previewMode === 'png' ? (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 self-start">
                <button
                  type="button"
                  onClick={() => setViewport('desktop')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    viewport === 'desktop'
                      ? 'bg-white text-[#0B1120] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1120]'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport('mobile')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    viewport === 'mobile'
                      ? 'bg-white text-[#0B1120] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1120]'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Preview Canvas */}
          <div className="rounded-xl border border-slate-300 bg-slate-200/60 p-3 sm:p-5 flex flex-col items-center">
            {previewMode === 'plain-text' || previewMode === 'json' ? (
              <pre className="w-full max-h-[76vh] overflow-auto rounded-lg bg-[#0B1120] text-[#F8F6F0] p-6 font-mono-num text-xs leading-relaxed whitespace-pre-wrap">
                {renderedOutput}
              </pre>
            ) : previewMode === 'pdf' ? (
              <div className="w-full max-w-[1040px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="font-semibold text-[#0B1120]">
                    Playwright Chromium A4 PDF Preview
                    {binarySizeKb !== null ? ` · ${binarySizeKb.toFixed(0)} KB` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchBinaryPreview('pdf')}
                      disabled={binaryLoading === 'pdf'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${binaryLoading === 'pdf' ? 'animate-spin' : ''}`}
                      />
                      <span>Re-render PDF</span>
                    </button>
                    {pdfBlobUrl ? (
                      <a
                        href={pdfBlobUrl}
                        download={`${report.branding.companyName}-preview.pdf`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B1120] text-[#F8F6F0] font-semibold"
                      >
                        <Download className="h-3 w-3 text-[#D4FF33]" />
                        <span>Download PDF</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                {binaryLoading === 'pdf' ? (
                  <div className="h-[640px] bg-white rounded-lg border border-slate-300 flex flex-col items-center justify-center gap-2 text-xs text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0891B2]" />
                    <span>Rendering A4 paginated PDF in headless Chromium...</span>
                  </div>
                ) : binaryError ? (
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    {binaryError}
                  </div>
                ) : pdfBlobUrl ? (
                  <div className="bg-white rounded-lg overflow-hidden shadow-md border border-slate-300">
                    <iframe
                      title="NEXORA Playwright A4 PDF preview"
                      src={pdfBlobUrl}
                      className="w-full border-0"
                      style={{ height: '78vh', minHeight: '640px' }}
                    />
                  </div>
                ) : null}
              </div>
            ) : previewMode === 'png' ? (
              <div className="w-full max-w-[1040px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="font-semibold text-[#0B1120]">
                    Playwright 2x Retina PNG Snapshot ({viewport === 'mobile' ? '430px' : '1080px'})
                    {binarySizeKb !== null ? ` · ${binarySizeKb.toFixed(0)} KB` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchBinaryPreview('png')}
                      disabled={binaryLoading === 'png'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${binaryLoading === 'png' ? 'animate-spin' : ''}`}
                      />
                      <span>Re-capture PNG</span>
                    </button>
                    {pngBlobUrl ? (
                      <a
                        href={pngBlobUrl}
                        download={`${report.branding.companyName}-preview.png`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B1120] text-[#F8F6F0] font-semibold"
                      >
                        <Download className="h-3 w-3 text-[#D4FF33]" />
                        <span>Download PNG</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                {binaryLoading === 'png' ? (
                  <div className="h-[640px] bg-white rounded-lg border border-slate-300 flex flex-col items-center justify-center gap-2 text-xs text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0891B2]" />
                    <span>Capturing 2x high-resolution PNG via Playwright Chromium...</span>
                  </div>
                ) : binaryError ? (
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    {binaryError}
                  </div>
                ) : pngBlobUrl ? (
                  <div className="max-h-[78vh] overflow-auto bg-white rounded-lg shadow-md border border-slate-300 p-4 flex justify-center">
                    <img
                      src={pngBlobUrl}
                      alt="Playwright high-resolution PNG report preview"
                      className="max-w-full h-auto shadow-xs rounded"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="transition-all duration-200 bg-white rounded-lg overflow-hidden shadow-md border border-slate-300"
                style={{
                  width: viewport === 'mobile' ? '390px' : '100%',
                  maxWidth: '1040px',
                }}
              >
                <iframe
                  title={`NEXORA ${previewMode} preview`}
                  srcDoc={renderedOutput}
                  className="w-full border-0"
                  style={{ height: '78vh', minHeight: '640px' }}
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>
        </>
      ) : (
        /* Side-by-Side 3-Theme Comparison View */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {themeComparisons.map(({ theme, html }) => {
            const isSelected = report.theme === theme.id;
            return (
              <div
                key={theme.id}
                className={`rounded-xl border overflow-hidden bg-white flex flex-col ${
                  isSelected ? 'border-[#0B1120] ring-2 ring-[#0B1120]' : 'border-slate-200'
                }`}
              >
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
                  <div>
                    <div className="text-sm font-semibold text-[#0B1120]">{theme.name}</div>
                    <div className="text-[11px] text-slate-500">{theme.subtitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTheme(theme.id);
                      setCompareMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#0B1120] text-[#D4FF33]'
                        : 'border border-slate-300 bg-white text-[#0B1120] hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? 'Active Theme' : 'Apply Theme'}
                  </button>
                </div>
                <iframe
                  title={`${theme.name} theme comparison`}
                  srcDoc={html}
                  className="w-full border-0"
                  style={{ height: '620px' }}
                  sandbox="allow-scripts"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
