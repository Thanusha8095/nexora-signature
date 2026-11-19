import { type ChangeEvent, useRef } from 'react';
import { RotateCcw, Trash2, Upload } from 'lucide-react';
import { getAudienceEdition } from '../core/audiences.ts';
import { validateSafeImageDataUrl } from '../core/security.ts';
import { BRAND_FONT_PRESETS, REPORT_THEMES, resolveBrandTheme } from '../core/themes.ts';
import type {
  BrandFontPreset,
  CoverStyleOverride,
  LogoShape,
  ReportInputData,
  ValidationResult,
} from '../core/types.ts';

interface BrandingViewProps {
  report: ReportInputData;
  validation: ValidationResult;
  onChange: (next: ReportInputData) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, detail?: string) => void;
}

export function BrandingView({ report, validation, onChange, onNotify }: BrandingViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const b = report.branding;
  const activeTheme = REPORT_THEMES[report.theme] ?? REPORT_THEMES['midnight-luxe'];
  const resolvedTheme = resolveBrandTheme(report);
  const audience = getAudienceEdition(report.audienceEdition);

  const updateBranding = (patch: Partial<typeof b>) => {
    onChange({
      ...report,
      branding: {
        ...b,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1_500_000) {
      onNotify('error', 'Logo file too large', 'Please upload an image under 1.5 MB.');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      onNotify('error', 'Unsupported image format', 'Use PNG, JPEG, WEBP, or SVG.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const check = validateSafeImageDataUrl(result);
      if (!check.valid) {
        onNotify('error', 'Logo security check failed', check.error);
        return;
      }
      updateBranding({ logoDataUrl: result });
      onNotify('success', 'Company logo updated', `${file.name} embedded safely into report model.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const logoClassRadius =
    b.logoShape === 'circle'
      ? 'rounded-full'
      : b.logoShape === 'square'
        ? 'rounded-xs'
        : 'rounded-xl';

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#0891B2]">
          Cross-Format Identity System
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[#0B1120] mt-1">
          Brand DNA Studio
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Customize your corporate mark, logo geometry, typography pairing, accent palette, and
          executive cover architecture consistently across Email, Web, A4 PDF, and PNG.
        </p>
      </div>

      {/* Live Brand DNA Specimen Preview Card */}
      <section
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: resolvedTheme.colors.surface,
          borderColor: resolvedTheme.colors.border,
          color: resolvedTheme.colors.text,
        }}
      >
        {resolvedTheme.layoutStyle === 'swiss-precision' ? (
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(90deg, #0B1120 0%, ${resolvedTheme.colors.accent} 65%, ${resolvedTheme.colors.secondary} 100%)`,
            }}
          />
        ) : null}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {b.logoDataUrl ? (
              <img
                src={b.logoDataUrl}
                alt={b.companyName}
                referrerPolicy="no-referrer"
                className={`h-14 w-14 object-contain border shrink-0 ${logoClassRadius}`}
                style={{ borderColor: resolvedTheme.colors.border }}
              />
            ) : null}
            <div className="min-w-0">
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{
                  color: resolvedTheme.colors.accent,
                  fontFamily: resolvedTheme.typography.bodyFont,
                }}
              >
                {b.companyName || 'Company Name'} &middot; {audience.coverKicker}
              </div>
              <div
                className="text-2xl font-semibold mt-1 truncate"
                style={{ fontFamily: resolvedTheme.typography.headingFont }}
              >
                {report.title}
              </div>
              <div
                className="text-xs mt-1"
                style={{
                  color: resolvedTheme.colors.textMuted,
                  fontFamily: resolvedTheme.typography.bodyFont,
                }}
              >
                {b.tagline} &middot; Cover: {resolvedTheme.layoutStyle}
              </div>
            </div>
          </div>

          <div
            className="font-mono-num text-right shrink-0"
            style={{ fontFamily: resolvedTheme.typography.monoFont }}
          >
            <div className="text-[11px]" style={{ color: resolvedTheme.colors.textMuted }}>
              LIVE BRAND SPECIMEN
            </div>
            <div className="text-lg font-bold mt-0.5" style={{ color: resolvedTheme.colors.accent }}>
              {resolvedTheme.colors.accent}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Mark, Shape, Typography, Cover */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1120]">
              Logo &amp; Geometry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              PNG, JPEG, WEBP, or sanitized SVG up to 1.5 MB.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`h-20 w-20 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 ${logoClassRadius}`}
            >
              {b.logoDataUrl ? (
                <img
                  src={b.logoDataUrl}
                  alt={b.companyName}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">No Logo</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1120] text-[#F8F6F0] text-xs font-semibold hover:bg-[#17223B] cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-[#D4FF33]" />
                <span>Upload Logo</span>
              </button>
              {b.logoDataUrl ? (
                <button
                  type="button"
                  onClick={() => updateBranding({ logoDataUrl: '' })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Logo</span>
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Logo Frame Shape
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['rounded', 'square', 'circle'] as LogoShape[]).map((shape) => {
                const active = (b.logoShape ?? 'rounded') === shape;
                return (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => updateBranding({ logoShape: shape })}
                    className={`py-1.5 rounded-lg border text-xs font-semibold capitalize cursor-pointer ${
                      active
                        ? 'border-[#0B1120] bg-[#0B1120] text-[#D4FF33]'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {shape}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Pairing */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div>
              <label
                htmlFor="brand-font-preset"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Typography Pairing
              </label>
              <select
                id="brand-font-preset"
                value={b.fontPreset ?? 'theme-default'}
                onChange={(e) =>
                  updateBranding({ fontPreset: e.target.value as BrandFontPreset })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#0B1120]"
              >
                <option value="theme-default">Theme Default ({activeTheme.name})</option>
                {Object.values(BRAND_FONT_PRESETS).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="brand-cover-style"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Cover Architecture
              </label>
              <select
                id="brand-cover-style"
                value={b.coverStyle ?? 'theme-default'}
                onChange={(e) =>
                  updateBranding({ coverStyle: e.target.value as CoverStyleOverride })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#0B1120]"
              >
                <option value="theme-default">Match Active Theme ({activeTheme.layoutStyle})</option>
                <option value="architectural-dark">Architectural Split Header</option>
                <option value="editorial-broadsheet">Centered Broadsheet Masthead</option>
                <option value="swiss-precision">Swiss Gradient Stripe Banner</option>
              </select>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700">Brand Accent Color</h3>
              <button
                type="button"
                onClick={() =>
                  updateBranding({
                    primaryColor: activeTheme.colors.canvas,
                    accentColor: activeTheme.colors.accent,
                    fontPreset: 'theme-default',
                    coverStyle: 'theme-default',
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0891B2] hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset DNA to {activeTheme.name}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Accent Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={b.accentColor || activeTheme.colors.accent}
                    onChange={(e) => updateBranding({ accentColor: e.target.value })}
                    className="h-9 w-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={b.accentColor}
                    onChange={(e) => updateBranding({ accentColor: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                  />
                </div>
                {validation.errors['branding.accentColor'] ? (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {validation.errors['branding.accentColor']}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Primary Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={b.primaryColor || '#0B1120'}
                    onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                    className="h-9 w-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={b.primaryColor}
                    onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono-num text-xs text-[#0B1120]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Corporate Identity Fields */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-4 self-start">
          <h2 className="font-display text-lg font-semibold text-[#0B1120]">
            Identity &amp; Distribution Metadata
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={b.companyName}
                onChange={(e) => updateBranding({ companyName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Tagline
              </label>
              <input
                type="text"
                value={b.tagline}
                onChange={(e) => updateBranding({ tagline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classification Line
              </label>
              <input
                type="text"
                value={b.classification}
                onChange={(e) => updateBranding({ classification: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prepared By
              </label>
              <input
                type="text"
                value={b.preparedBy}
                onChange={(e) => updateBranding({ preparedBy: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={b.contactEmail}
                onChange={(e) => updateBranding({ contactEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Website (https://)
              </label>
              <input
                type="url"
                value={b.website}
                onChange={(e) => updateBranding({ website: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Governance &amp; Legal Disclaimer
              </label>
              <textarea
                rows={3}
                value={b.disclaimer}
                onChange={(e) => updateBranding({ disclaimer: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#0B1120] leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
