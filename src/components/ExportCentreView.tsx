import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Mail,
  Printer,
  XCircle,
} from 'lucide-react';
import { getAudienceEdition } from '../core/audiences.ts';
import { scoreReportExports } from '../core/exportQuality.ts';
import { sanitizeFilename } from '../core/security.ts';
import { resolveBrandTheme } from '../core/themes.ts';
import type { ExportFormat, ReportInputData, ValidationResult } from '../core/types.ts';
import {
  renderEmailHtml,
  renderPlainTextEmail,
  renderReportDesignJson,
  renderWebHtml,
} from '../elements/renderers.ts';
import { DataQualityPanel } from './DataQualityPanel.tsx';

interface ExportCentreViewProps {
  report: ReportInputData;
  validation: ValidationResult;
  customFilename: string;
  onFilenameChange: (name: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, detail?: string) => void;
  onGoToEditor: () => void;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportCentreView({
  report,
  validation,
  customFilename,
  onFilenameChange,
  onNotify,
  onGoToEditor,
}: ExportCentreViewProps) {
  const [busyFormat, setBusyFormat] = useState<ExportFormat | 'json' | null>(null);
  const [pngWidth, setPngWidth] = useState<number>(1080);
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string | null>(null);
  const [showAllFindings, setShowAllFindings] = useState(false);

  const audience = getAudienceEdition(report.audienceEdition);
  const theme = resolveBrandTheme(report);
  const qualityScore = useMemo(() => scoreReportExports(report), [report]);
  const defaultBase = `${report.branding.companyName}-${report.reportingPeriod}-${audience.shortLabel}`;
  const safeBase = sanitizeFilename(customFilename || defaultBase, 'nexora-executive-report');

  const ensureValid = (): boolean => {
    if (!validation.valid) {
      onNotify(
        'error',
        'Cannot export invalid report',
        'Please resolve Data Quality Guardian blocking errors in the Report Editor first.'
      );
      return false;
    }
    return true;
  };

  const handleDownloadClientFormat = async (
    format: 'email-html' | 'plain-text' | 'web-html' | 'json'
  ) => {
    if (!ensureValid()) return;
    setBusyFormat(format);
    try {
      if (format === 'email-html') {
        const html = renderEmailHtml(report);
        triggerBlobDownload(
          new Blob([html], { type: 'text/html;charset=utf-8' }),
          `${safeBase}-email.html`
        );
        onNotify('success', 'Email HTML exported', `Downloaded ${safeBase}-email.html`);
      } else if (format === 'plain-text') {
        const text = renderPlainTextEmail(report);
        triggerBlobDownload(
          new Blob([text], { type: 'text/plain;charset=utf-8' }),
          `${safeBase}-plain.txt`
        );
        onNotify('success', 'Plain-Text Email exported', `Downloaded ${safeBase}-plain.txt`);
      } else if (format === 'web-html') {
        const html = renderWebHtml(report);
        triggerBlobDownload(
          new Blob([html], { type: 'text/html;charset=utf-8' }),
          `${safeBase}-web.html`
        );
        onNotify('success', 'Responsive Web HTML exported', `Downloaded ${safeBase}-web.html`);
      } else if (format === 'json') {
        const json = renderReportDesignJson(report, 'web');
        triggerBlobDownload(
          new Blob([JSON.stringify(json, null, 2)], { type: 'application/json;charset=utf-8' }),
          `${safeBase}-unlayer-design.json`
        );
        onNotify(
          'success',
          'Unlayer DesignJSON exported',
          `Downloaded ${safeBase}-unlayer-design.json`
        );
      }
    } catch (err) {
      onNotify(
        'error',
        'Export failed',
        err instanceof Error ? err.message : 'Unexpected render error'
      );
    } finally {
      setBusyFormat(null);
    }
  };

  const handleCopyText = async (format: 'email-html' | 'plain-text' | 'web-html' | 'json') => {
    if (!ensureValid()) return;
    try {
      let content = '';
      if (format === 'email-html') content = renderEmailHtml(report);
      else if (format === 'plain-text') content = renderPlainTextEmail(report);
      else if (format === 'web-html') content = renderWebHtml(report);
      else content = JSON.stringify(renderReportDesignJson(report, 'web'), null, 2);

      await navigator.clipboard.writeText(content);
      onNotify('success', 'Copied to clipboard', `${format.toUpperCase()} output copied.`);
    } catch {
      onNotify('error', 'Clipboard copy failed', 'Browser clipboard permission was denied.');
    }
  };

  const handleServerExport = async (format: 'pdf' | 'png') => {
    if (!ensureValid()) return;
    setBusyFormat(format);
    onNotify(
      'info',
      format === 'pdf'
        ? 'Rendering A4 PDF via Playwright...'
        : 'Capturing 2x Retina PNG via Playwright...',
      'This typically completes in 1–3 seconds.'
    );

    try {
      const endpoint = format === 'pdf' ? '/api/export/pdf' : '/api/export/png';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          filename: `${safeBase}-${format === 'pdf' ? 'report' : 'snapshot'}`,
          viewportWidth: pngWidth,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: 'Server export failed' }));
        throw new Error(errBody.error || `HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      const ext = format === 'pdf' ? 'pdf' : 'png';
      const fileOut = `${safeBase}-${format === 'pdf' ? 'report' : 'snapshot'}.${ext}`;
      triggerBlobDownload(blob, fileOut);

      if (format === 'png') {
        if (pngPreviewUrl) URL.revokeObjectURL(pngPreviewUrl);
        setPngPreviewUrl(URL.createObjectURL(blob));
      }

      onNotify(
        'success',
        `${format.toUpperCase()} generated cleanly`,
        `Downloaded ${fileOut} (${(blob.size / 1024).toFixed(0)} KB)`
      );
    } catch (err) {
      onNotify(
        'error',
        `${format.toUpperCase()} generation failed`,
        err instanceof Error ? err.message : 'Unable to reach Playwright export server.'
      );
    } finally {
      setBusyFormat(null);
    }
  };

  const scoreAccent =
    qualityScore.overallScore >= 90
      ? 'text-emerald-700'
      : qualityScore.overallScore >= 75
        ? 'text-[#0891B2]'
        : 'text-amber-700';

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120]">
            Five-Format Export Centre
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Generate Email HTML, Plain-Text Email, Responsive Web HTML, A4 PDF, and High-Resolution
            PNG from one unified report tree.
          </p>
        </div>
        <div className="font-mono-num text-xs text-slate-600">
          {audience.name} &middot; {theme.name}
        </div>
      </div>

      {!validation.valid ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Validation errors must be fixed before exporting.</p>
              <p className="mt-0.5">{Object.values(validation.errors)[0]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToEditor}
            className="px-3.5 py-2 rounded-lg bg-rose-900 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            Fix in Editor
          </button>
        </div>
      ) : null}

      {/* Genuine Export Quality Scorecard */}
      <section
        aria-label="Genuine Export Quality Scorecard"
        className="rounded-xl border border-slate-200 bg-white overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-lg bg-[#0B1120] text-[#D4FF33] flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-[#0B1120]">
                  Genuine Export Quality Scorecard
                </h2>
                <span className={`font-mono-num text-xs font-bold uppercase ${scoreAccent}`}>
                  &middot; {qualityScore.grade}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Computed live by auditing rendered Email HTML, Plain-Text, Web HTML, A4 Print DOM,
                Unlayer DesignJSON, and Data Quality Guardian checks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Composite Score
              </div>
              <div className={`font-mono-num text-3xl font-bold ${scoreAccent}`}>
                {qualityScore.overallScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAllFindings((v) => !v)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1120] hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              {showAllFindings ? 'Hide Audit Matrix' : 'Inspect Audit Matrix'}
            </button>
          </div>
        </div>

        {/* 5 Scored Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {qualityScore.dimensions.map((dim) => {
            const pct = Math.round((dim.score / dim.maxScore) * 100);
            const barColor =
              pct >= 90 ? 'bg-emerald-600' : pct >= 70 ? 'bg-[#0891B2]' : 'bg-amber-500';
            return (
              <div key={dim.id} className="p-4 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0B1120]">{dim.label}</span>
                    <span className="font-mono-num text-xs font-bold text-[#0B1120] shrink-0">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded bg-slate-100 mt-2 overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="font-mono-num text-[11px] text-slate-500">{dim.summary}</div>
              </div>
            );
          })}
        </div>

        {/* Live Telemetry Footer Bar */}
        <div className="px-6 py-3 bg-[#F8F6F0] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono-num text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span>Email: {qualityScore.telemetry.emailKb.toFixed(1)} KB (limit 102 KB)</span>
            <span>Web HTML: {qualityScore.telemetry.webKb.toFixed(1)} KB</span>
            <span>
              Contrast: {qualityScore.telemetry.contrastRatioPrimary.toFixed(1)}:1 (WCAG AA &ge; 4.5)
            </span>
            <span>Unlayer Rows: {qualityScore.telemetry.designJsonRows}</span>
            <span>
              Redaction:{' '}
              {qualityScore.telemetry.redactionVerified ? 'Verified' : 'Attention needed'}
            </span>
          </div>
          {qualityScore.actionItems.length > 0 ? (
            <button
              type="button"
              onClick={onGoToEditor}
              className="font-semibold text-amber-800 hover:underline cursor-pointer"
            >
              {qualityScore.actionItems.length} improvement(s) available &rarr;
            </button>
          ) : (
            <span className="font-semibold text-emerald-700">All deliverable audits passed</span>
          )}
        </div>

        {/* Expandable Itemized Audit Findings */}
        {showAllFindings ? (
          <div className="p-6 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qualityScore.dimensions.map((dim) => (
              <div
                key={dim.id}
                className="rounded-lg border border-slate-200 p-4 space-y-2.5 bg-slate-50/60"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[#0B1120]">
                  <span>{dim.label}</span>
                  <span className="font-mono-num">
                    {dim.score}/{dim.maxScore}
                  </span>
                </div>
                <div className="space-y-2">
                  {dim.findings.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 text-xs">
                      {f.status === 'pass' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : f.status === 'warn' ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-[#0B1120]">
                          {f.label}{' '}
                          <span className="font-mono-num text-[10px] text-slate-500">
                            ({f.pointsEarned}/{f.maxPoints})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Pre-Export Data Quality Guardian Gate */}
      <DataQualityPanel
        report={report}
        validation={validation}
        compact
        onJumpToSection={() => onGoToEditor()}
      />

      {/* Safe Filename Configuration */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Custom Export Base Filename
          </label>
          <input
            type="text"
            value={customFilename}
            onChange={(e) => onFilenameChange(e.target.value)}
            placeholder={defaultBase}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] focus:border-[#0891B2] focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">
          Sanitized file prefix:{' '}
          <span className="font-mono-num font-semibold text-[#0B1120]">{safeBase}</span>
        </div>
      </div>

      {/* 5 Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Email HTML */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <Mail className="h-5 w-5 text-[#0891B2]" />
              <span className="font-mono-num text-[11px] text-slate-500">&lt;Email&gt;</span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1120] mt-3">1. Email HTML</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Rendered via <code className="font-mono-num">renderToHtml</code> with XHTML
              table-based layouts, inbox preview text, and email-safe table sparklines.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              disabled={busyFormat !== null}
              onClick={() => handleDownloadClientFormat('email-html')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#D4FF33]" />
              <span>Download .html</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyText('email-html')}
              title="Copy Email HTML"
              className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Plain-Text Email */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-[#0891B2]" />
              <span className="font-mono-num text-[11px] text-slate-500">renderToPlainText</span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1120] mt-3">2. Plain-Text Email</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Clean multipart text/plain executive financial ledger containing KPIs, monthly
              metrics, rule-attributed observations, and strategic priorities.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              disabled={busyFormat !== null}
              onClick={() => handleDownloadClientFormat('plain-text')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#D4FF33]" />
              <span>Download .txt</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyText('plain-text')}
              title="Copy Plain Text"
              className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Responsive Web HTML */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <Globe className="h-5 w-5 text-[#0891B2]" />
              <span className="font-mono-num text-[11px] text-slate-500">&lt;Page&gt;</span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1120] mt-3">3. Responsive Web HTML</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Standalone HTML5 report via <code className="font-mono-num">renderToHtml</code> with
              responsive grid layout, vector SVG charts, and interactive hover tooltips.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              disabled={busyFormat !== null}
              onClick={() => handleDownloadClientFormat('web-html')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#D4FF33]" />
              <span>Download .html</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyText('web-html')}
              title="Copy Web HTML"
              className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 4. A4 PDF (Playwright) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <Printer className="h-5 w-5 text-[#0891B2]" />
              <span className="font-mono-num text-[11px] text-slate-500">
                &lt;Document&gt; · Playwright
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1120] mt-3">4. Executive A4 PDF</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Print-ready Unlayer <code className="font-mono-num">&lt;Document&gt;</code> with{' '}
              <code className="font-mono-num">&lt;PageBreak /&gt;</code> boundaries rendered via
              Playwright Chromium with running page numbers.
            </p>
          </div>
          <button
            type="button"
            disabled={busyFormat !== null}
            onClick={() => handleServerExport('pdf')}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0891B2] text-white text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
          >
            {busyFormat === 'pdf' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating A4 PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Generate &amp; Download PDF</span>
              </>
            )}
          </button>
        </div>

        {/* 5. High-Res PNG (Playwright) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <ImageIcon className="h-5 w-5 text-[#0891B2]" />
              <span className="font-mono-num text-[11px] text-slate-500">Playwright 2x PNG</span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1120] mt-3">5. High-Resolution PNG</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Full-page 2x Retina Chromium screenshot ready for investor decks, Notion embeds, and
              board packets.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Capture width:</span>
              <button
                type="button"
                onClick={() => setPngWidth(1080)}
                className={`px-2 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                  pngWidth === 1080
                    ? 'border-[#0B1120] bg-[#0B1120] text-white'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                Desktop 1080px
              </button>
              <button
                type="button"
                onClick={() => setPngWidth(430)}
                className={`px-2 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                  pngWidth === 430
                    ? 'border-[#0B1120] bg-[#0B1120] text-white'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                Mobile 430px
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={busyFormat !== null}
            onClick={() => handleServerExport('png')}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0891B2] text-white text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
          >
            {busyFormat === 'png' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Capturing PNG...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Capture &amp; Download PNG</span>
              </>
            )}
          </button>
        </div>

        {/* Bonus: Unlayer DesignJSON */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <Code2 className="h-5 w-5 text-slate-700" />
              <span className="font-mono-num text-[11px] text-slate-500">renderToJson</span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1120] mt-3">Unlayer DesignJSON</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Canonical Unlayer <code className="font-mono-num">DesignJSON</code> schema generated
              by <code className="font-mono-num">renderToJson</code> for round-tripping into Unlayer
              Builder.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              disabled={busyFormat !== null}
              onClick={() => handleDownloadClientFormat('json')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-[#0B1120] text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .json</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyText('json')}
              title="Copy DesignJSON"
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Latest Captured PNG Preview */}
      {pngPreviewUrl ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#0B1120]">
              Captured High-Resolution PNG Preview
            </h3>
            <button
              type="button"
              onClick={() => setPngPreviewUrl(null)}
              className="text-xs text-slate-500 hover:text-[#0B1120] cursor-pointer"
            >
              Clear Preview
            </button>
          </div>
          <div className="max-h-[480px] overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4 flex justify-center">
            <img
              src={pngPreviewUrl}
              alt="Generated report PNG preview"
              className="max-w-full h-auto shadow-md rounded"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
