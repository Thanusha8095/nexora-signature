import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Mail, Smartphone, XCircle } from 'lucide-react';
import { AUDIENCE_EDITION_LIST } from '../core/audiences.ts';
import { auditEmailHtml, emulateEmailClientHtml } from '../core/emailAudit.ts';
import type { AudienceEditionId, ReportInputData } from '../core/types.ts';
import { renderEmailHtml } from '../elements/renderers.ts';

interface EmailLabViewProps {
  report: ReportInputData;
  onSelectAudience: (edition: AudienceEditionId) => void;
  onGoToExport: () => void;
}

type EmailClientId = 'gmail' | 'outlook' | 'apple-mail' | 'mobile';

const CLIENT_OPTIONS: {
  id: EmailClientId;
  label: string;
  description: string;
  frameWidth: string;
}[] = [
  {
    id: 'gmail',
    label: 'Gmail Web (640px)',
    description: 'Simulates Gmail webmail 640px content container and 102 KB message-clipping threshold.',
    frameWidth: '720px',
  },
  {
    id: 'outlook',
    label: 'Outlook Desktop',
    description: 'Simulates Windows Outlook Word-engine rendering (system font fallback, zero border-radius, MSO tables).',
    frameWidth: '720px',
  },
  {
    id: 'apple-mail',
    label: 'Apple Mail',
    description: 'Simulates macOS / iPadOS Apple Mail with full @font-face and @media query support.',
    frameWidth: '760px',
  },
  {
    id: 'mobile',
    label: 'Mobile Email (375px)',
    description: 'Simulates iOS / Android viewport stacking and touch readability at 375px.',
    frameWidth: '375px',
  },
];

export function EmailLabView({ report, onSelectAudience, onGoToExport }: EmailLabViewProps) {
  const [client, setClient] = useState<EmailClientId>('gmail');

  const rawEmailHtml = useMemo(() => renderEmailHtml(report), [report]);
  const audit = useMemo(() => auditEmailHtml(rawEmailHtml, report), [rawEmailHtml, report]);
  const emulatedHtml = useMemo(
    () => emulateEmailClientHtml(rawEmailHtml, client),
    [rawEmailHtml, client]
  );

  const activeClientMeta = CLIENT_OPTIONS.find((c) => c.id === client) ?? CLIENT_OPTIONS[0];
  const passCount = audit.checks.filter((c) => c.status === 'pass').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0891B2]">
            @unlayer/react-elements &lt;Email&gt; Output Verification
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120] mt-1">
            Email Compatibility &amp; Accessibility Lab
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Emulate Gmail, Outlook Desktop, Apple Mail, and Mobile Email rendering alongside real
            payload size, MSO table structure, and WCAG contrast checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            aria-label="Select audience edition for email preview"
            value={report.audienceEdition ?? 'board'}
            onChange={(e) => onSelectAudience(e.target.value as AudienceEditionId)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0B1120]"
          >
            {AUDIENCE_EDITION_LIST.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onGoToExport}
            className="px-4 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] cursor-pointer"
          >
            Export Email HTML
          </button>
        </div>
      </div>

      {/* Telemetry Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-medium text-slate-500">Email Payload Size</div>
          <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1">
            {audit.kbSize.toFixed(1)} KB
          </div>
          <div
            className={`text-[11px] mt-1 font-medium ${
              audit.gmailClipRisk ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {audit.gmailClipRisk
              ? 'Exceeds 102 KB Gmail clip threshold'
              : 'Under 102 KB Gmail clip limit'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-medium text-slate-500">Outlook Table Architecture</div>
          <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1">
            {audit.tableCount} tables
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {audit.presentationTableCount} role="presentation" wrappers
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-medium text-slate-500">WCAG Surface Contrast</div>
          <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1">
            {audit.contrastRatioPrimary.toFixed(1)}:1
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Accent contrast {audit.contrastRatioAccent.toFixed(1)}:1 · AA target &ge; 4.5:1
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-medium text-slate-500">Compatibility Audit</div>
          <div className="font-mono-num text-xl font-semibold text-[#0B1120] mt-1">
            {passCount} / {audit.checks.length} Passed
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {audit.scriptTagCount} scripts · {audit.missingAltCount} missing alt attrs
          </div>
        </div>
      </div>

      {/* Main Split: Client Emulation & Audit Checks */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Client Emulation Preview */}
        <div className="xl:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 overflow-x-auto">
              {CLIENT_OPTIONS.map((opt) => {
                const active = client === opt.id;
                const Icon = opt.id === 'mobile' ? Smartphone : Mail;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setClient(opt.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      active
                        ? 'bg-white text-[#0B1120] shadow-xs'
                        : 'text-slate-600 hover:text-[#0B1120]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-300 bg-slate-200/70 p-4 flex flex-col items-center">
            <div className="w-full max-w-[780px] mb-3 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-semibold text-[#0B1120]">
                Emulation Mode: {activeClientMeta.label}
              </span>
              <span className="text-slate-500">{activeClientMeta.description}</span>
            </div>

            <div
              className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden transition-all duration-200"
              style={{
                width: '100%',
                maxWidth: activeClientMeta.frameWidth,
              }}
            >
              <iframe
                title={`Email compatibility preview (${activeClientMeta.label})`}
                srcDoc={emulatedHtml}
                className="w-full border-0"
                style={{ height: '680px' }}
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>

        {/* Right: Compatibility & Accessibility Checks */}
        <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-white overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-semibold text-[#0B1120]">
              Client &amp; Accessibility Checks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated inspection of rendered &lt;Email&gt; output
            </p>
          </div>
          <div className="divide-y divide-slate-200">
            {audit.checks.map((chk) => {
              const Icon =
                chk.status === 'fail'
                  ? XCircle
                  : chk.status === 'warn'
                    ? AlertTriangle
                    : CheckCircle2;
              const color =
                chk.status === 'fail'
                  ? 'text-rose-600'
                  : chk.status === 'warn'
                    ? 'text-amber-600'
                    : 'text-emerald-700';
              return (
                <div key={chk.id} className="p-4 flex items-start gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
                  <div>
                    <div className="text-[11px] font-mono-num text-slate-500">{chk.category}</div>
                    <div className="text-xs font-semibold text-[#0B1120] mt-0.5">{chk.label}</div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{chk.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
