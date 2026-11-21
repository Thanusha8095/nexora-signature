import { useCallback, useEffect, useRef, useState } from 'react';
import { Columns, Download, Loader2, Monitor, Presentation, RefreshCw, Smartphone } from 'lucide-react';
import { AUDIENCE_EDITION_LIST } from '../core/audiences.ts';
import { scoreReportExports, type ExportQualityScorecard } from '../core/exportQuality.ts';
import { applyThemePresetToReport, THEME_LIST } from '../core/themes.ts';
import type {
  AudienceEditionId,
  PreviewMode,
  ReportInputData,
  ReportThemeId,
  ThemeSpec,
} from '../core/types.ts';
import {
  renderCanvasHtml,
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

type BinaryPreviewKind = 'pdf' | 'native-pdf' | 'png' | 'canvas-png';

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

  const [renderedOutput, setRenderedOutput] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<ExportQualityScorecard | null>(null);
  const [themeComparisons, setThemeComparisons] = useState<{ theme: ThemeSpec; html: string }[]>([]);

  const [binaryUrls, setBinaryUrls] = useState<Partial<Record<BinaryPreviewKind, string>>>({});
  const [binarySizesKb, setBinarySizesKb] = useState<Partial<Record<BinaryPreviewKind, number>>>({});
  const [binaryLoading, setBinaryLoading] = useState<BinaryPreviewKind | null>(null);
  const [binaryError, setBinaryError] = useState<string | null>(null);

  const binaryUrlsRef = useRef<Partial<Record<BinaryPreviewKind, string>>>({});

  useEffect(() => {
    const urls = binaryUrlsRef.current;
    return () => {
      Object.values(urls).forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, []);

  const fetchBinaryPreview = useCallback(
    async (kind: BinaryPreviewKind) => {
      setBinaryLoading(kind);
      setBinaryError(null);
      try {
        const endpointMap: Record<BinaryPreviewKind, string> = {
          pdf: '/api/export/pdf',
          'native-pdf': '/api/export/native-pdf',
          png: '/api/export/png',
          'canvas-png': '/api/export/canvas-png',
        };
        const endpoint = endpointMap[kind];
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
        const prev = binaryUrlsRef.current[kind];
        if (prev) URL.revokeObjectURL(prev);
        binaryUrlsRef.current[kind] = url;

        setBinaryUrls((curr) => ({ ...curr, [kind]: url }));
        setBinarySizesKb((curr) => ({ ...curr, [kind]: blob.size / 1024 }));
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
    if (
      previewMode === 'pdf' ||
      previewMode === 'native-pdf' ||
      previewMode === 'png' ||
      previewMode === 'canvas-png'
    ) {
      void fetchBinaryPreview(previewMode);
    }
  }, [previewMode, compareMode, fetchBinaryPreview]);

  useEffect(() => {
    let cancelled = false;
    async function renderActivePreview() {
      if (previewMode === 'json') {
        const json = renderReportDesignJson(report, 'web');
        if (!cancelled) setRenderedOutput(JSON.stringify(json, null, 2));
        return;
      }
      if (previewMode === 'email') {
        const out = await renderEmailHtml(report);
        if (!cancelled) setRenderedOutput(out);
        return;
      }
      if (previewMode === 'plain-text') {
        const out = await renderPlainTextEmail(report);
        if (!cancelled) setRenderedOutput(out);
        return;
      }
      if (previewMode === 'document') {
        const out = await renderPrintDocumentHtml(report);
        if (!cancelled) setRenderedOutput(out);
        return;
      }
      if (previewMode === 'canvas') {
        const out = await renderCanvasHtml(report);
        if (!cancelled) setRenderedOutput(out);
        return;
      }
      if (previewMode === 'web') {
        const out = await renderWebHtml(report);
        if (!cancelled) setRenderedOutput(out);
        return;
      }
      if (!cancelled) setRenderedOutput('');
    }
    void renderActivePreview().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [report, previewMode]);

  useEffect(() => {
    let cancelled = false;
    void scoreReportExports(report)
      .then((score) => {
        if (!cancelled) setQualityScore(score);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [report]);

  useEffect(() => {
    if (!compareMode) {
      setThemeComparisons([]);
      return;
    }
    let cancelled = false;
    void Promise.all(
      THEME_LIST.map(async (t) => ({
        theme: t,
        html: await renderWebHtml(applyThemePresetToReport(report, t.id)),
      }))
    )
      .then((results) => {
        if (!cancelled) setThemeComparisons(results);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [report, compareMode]);

  const isPdfPreview = previewMode === 'pdf' || previewMode === 'native-pdf';
  const isPngPreview = previewMode === 'png' || previewMode === 'canvas-png';
  const activeBinaryKind: BinaryPreviewKind | null = isPdfPreview
    ? previewMode
    : isPngPreview
      ? previewMode
      : null;
  const activeBinaryUrl = activeBinaryKind ? binaryUrls[activeBinaryKind] : undefined;
  const activeBinarySizeKb = activeBinaryKind ? binarySizesKb[activeBinaryKind] : undefined;

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120]">
              Five-Format Live Report Studio
            </h1>
            {qualityScore ? (
              <button
                type="button"
                onClick={onGoToExport}
                className="font-mono-num text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                title="Inspect full Export Quality Scorecard"
              >
                Quality {qualityScore.overallScore}/100 ({qualityScore.grade})
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Inspect Email HTML, Plain-Text, Responsive Web, Native &amp; Playwright A4 PDF, and
            &lt;Canvas&gt; / Playwright PNG from one shared model.
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
            <Presentation className="h-3.5 w-3.5 text-[#0B6179]" />
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
                  { id: 'native-pdf', label: 'Native PDF (@hyper)' },
                  { id: 'png', label: '5. 2x PNG (Playwright)' },
                  { id: 'canvas-png', label: 'Canvas PNG (@hyper)' },
                  { id: 'canvas', label: '<Canvas> HTML' },
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
            ) : isPdfPreview && activeBinaryKind ? (
              <div className="w-full max-w-[1040px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="font-semibold text-[#0B1120]">
                    {previewMode === 'native-pdf'
                      ? 'Native @hyper-elements/react/pdf (renderPdf) A4 Document Preview'
                      : 'Playwright Chromium A4 PDF Preview (Full Web Fonts)'}
                    {activeBinarySizeKb !== undefined ? ` · ${activeBinarySizeKb.toFixed(0)} KB` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchBinaryPreview(activeBinaryKind)}
                      disabled={binaryLoading === activeBinaryKind}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${binaryLoading === activeBinaryKind ? 'animate-spin' : ''}`}
                      />
                      <span>Re-render PDF</span>
                    </button>
                    {activeBinaryUrl ? (
                      <a
                        href={activeBinaryUrl}
                        download={`${report.branding.companyName}-${previewMode === 'native-pdf' ? 'native' : 'playwright'}.pdf`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B1120] text-[#F8F6F0] font-semibold"
                      >
                        <Download className="h-3 w-3 text-[#D4FF33]" />
                        <span>Download PDF</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                {binaryLoading === activeBinaryKind ? (
                  <div className="h-[640px] bg-white rounded-lg border border-slate-300 flex flex-col items-center justify-center gap-2 text-xs text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0B6179]" />
                    <span>
                      {previewMode === 'native-pdf'
                        ? 'Compiling native @hyper-elements/react/pdf Document...'
                        : 'Rendering A4 paginated PDF in headless Chromium...'}
                    </span>
                  </div>
                ) : binaryError ? (
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    {binaryError}
                  </div>
                ) : activeBinaryUrl ? (
                  <div className="bg-white rounded-lg overflow-hidden shadow-md border border-slate-300">
                    <iframe
                      title={`NEXORA ${previewMode} preview`}
                      src={activeBinaryUrl}
                      className="w-full border-0"
                      style={{ height: '78vh', minHeight: '640px' }}
                    />
                  </div>
                ) : null}
              </div>
            ) : isPngPreview && activeBinaryKind ? (
              <div className="w-full max-w-[1040px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="font-semibold text-[#0B1120]">
                    {previewMode === 'canvas-png'
                      ? 'Native @hyper-elements/react/image <Canvas> Summary Card (2400×1600 Retina PNG)'
                      : `Playwright 2x Retina PNG Full-Page Snapshot (${viewport === 'mobile' ? '430px' : '1080px'})`}
                    {activeBinarySizeKb !== undefined ? ` · ${activeBinarySizeKb.toFixed(0)} KB` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchBinaryPreview(activeBinaryKind)}
                      disabled={binaryLoading === activeBinaryKind}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${binaryLoading === activeBinaryKind ? 'animate-spin' : ''}`}
                      />
                      <span>Re-capture PNG</span>
                    </button>
                    {activeBinaryUrl ? (
                      <a
                        href={activeBinaryUrl}
                        download={`${report.branding.companyName}-${previewMode === 'canvas-png' ? 'canvas-card' : 'snapshot'}.png`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B1120] text-[#F8F6F0] font-semibold"
                      >
                        <Download className="h-3 w-3 text-[#D4FF33]" />
                        <span>Download PNG</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                {binaryLoading === activeBinaryKind ? (
                  <div className="h-[640px] bg-white rounded-lg border border-slate-300 flex flex-col items-center justify-center gap-2 text-xs text-slate-600">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0B6179]" />
                    <span>
                      {previewMode === 'canvas-png'
                        ? 'Rasterizing <Canvas 1200×800> at 2x via @hyper-elements/react/image...'
                        : 'Capturing 2x high-resolution PNG via Playwright Chromium...'}
                    </span>
                  </div>
                ) : binaryError ? (
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    {binaryError}
                  </div>
                ) : activeBinaryUrl ? (
                  <div className="max-h-[78vh] overflow-auto bg-white rounded-lg shadow-md border border-slate-300 p-4 flex justify-center">
                    <img
                      src={activeBinaryUrl}
                      alt={`${previewMode} report PNG preview`}
                      className="max-w-full h-auto shadow-xs rounded"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="transition-all duration-200 bg-white rounded-lg overflow-hidden shadow-md border border-slate-300"
                style={{
                  width: previewMode === 'canvas' ? '100%' : viewport === 'mobile' ? '390px' : '100%',
                  maxWidth: previewMode === 'canvas' ? '1200px' : '1040px',
                }}
              >
                <iframe
                  title={`NEXORA ${previewMode} preview`}
                  srcDoc={renderedOutput}
                  className="w-full border-0"
                  style={{ height: previewMode === 'canvas' ? '820px' : '78vh', minHeight: '640px' }}
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
