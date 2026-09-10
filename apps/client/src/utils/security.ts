/**
 * Sanitizes and validates URLs to prevent JavaScript URI XSS (javascript:, data:, vbscript:).
 * Ensures that only http: and https: protocols are executed in hyperlinks.
 */
export function safeUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}
