/** Client-safe URL helpers shared by the landing page and the capture wizard. */

/** Add https:// when missing and strip trailing slashes. */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (!parsed.hostname || /\s|%20/.test(parsed.hostname)) return false;
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return false;
    return true;
  } catch {
    return false;
  }
}

/** "https://example.com/about/team" -> "/about/team" (falls back to the input). */
export function urlPath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || '/';
  } catch {
    return url;
  }
}

export function urlHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** "www.example.com" and "example.com" are the same site. */
export function siteKey(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

export function sameSite(a: string, b: string): boolean {
  try {
    return siteKey(new URL(a).hostname) === siteKey(new URL(b).hostname);
  } catch {
    return false;
  }
}

/** True if `url`'s path is `prefix` or below it ("/docs" matches "/docs" and "/docs/a", not "/docs2"). */
export function inPathScope(url: string, prefix?: string): boolean {
  if (!prefix || prefix === '/') return true;
  try {
    const p = new URL(url).pathname.replace(/\/+$/, '') || '/';
    const base = prefix.replace(/\/+$/, '');
    return p.toLowerCase() === base.toLowerCase() || p.toLowerCase().startsWith(`${base.toLowerCase()}/`);
  } catch {
    return false;
  }
}
