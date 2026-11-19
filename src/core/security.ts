const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function sanitizeCssColor(color: string | undefined, fallback: string): string {
  if (!color || typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : fallback;
}

export function sanitizeFilename(rawName: string, fallback = 'nexora-executive-report'): string {
  const cleaned = (rawName || '')
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return cleaned || fallback;
}

export function sanitizeHttpUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

const MAX_LOGO_BYTES = 1_500_000;

export function validateSafeImageDataUrl(dataUrl: string): { valid: boolean; error?: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: true };
  }
  const trimmed = dataUrl.trim();
  if (trimmed === '') {
    return { valid: true };
  }

  if (trimmed.length > MAX_LOGO_BYTES * 1.4) {
    return { valid: false, error: 'Logo image exceeds 1.5 MB limit.' };
  }

  const allowedPrefix = /^data:image\/(png|jpeg|jpg|webp|svg\+xml);(base64|charset=utf-8),/i;
  if (!allowedPrefix.test(trimmed)) {
    return {
      valid: false,
      error: 'Only PNG, JPEG, WEBP, or SVG data URIs are permitted for company logos.',
    };
  }

  // If SVG, inspect decoded text for active content
  if (/^data:image\/svg\+xml/i.test(trimmed)) {
    try {
      const commaIdx = trimmed.indexOf(',');
      const meta = trimmed.slice(0, commaIdx);
      const payload = trimmed.slice(commaIdx + 1);
      const decoded = /;base64/i.test(meta)
        ? decodeBase64Utf8(payload)
        : decodeURIComponent(payload);

      if (/<script[\s>]|on[a-z]+\s*=|javascript:/i.test(decoded)) {
        return {
          valid: false,
          error: 'SVG logo contains disallowed active script or event attributes.',
        };
      }
    } catch {
      return { valid: false, error: 'Malformed SVG logo data URI.' };
    }
  }

  return { valid: true };
}

function decodeBase64Utf8(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Basic HTML sanitizer for UnlayerProvider.toSafeHtml (strips scripts/event handlers/javascript: URIs)
 */
export function toSafeHtmlBasic(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:');
}
