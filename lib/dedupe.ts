const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
]);

/**
 * Normalize a URL for deduplication:
 * - Lowercase hostname
 * - Strip fragments (#...)
 * - Strip tracking query params: utm_source, utm_medium, utm_campaign, utm_term, utm_content, fbclid, gclid
 * - Strip trailing slash (except for root path)
 * - Prefer https:// over http:// when both exist in the set
 */
export function normalizeUrl(urlStr: string, rootHost?: string): string {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    // If the URL is invalid, return it as-is
    return urlStr;
  }

  // Lowercase hostname
  parsed.hostname = parsed.hostname.toLowerCase();

  // Strip fragment
  parsed.hash = '';

  // Strip tracking query params
  const paramsToDelete: string[] = [];
  parsed.searchParams.forEach((_value, key) => {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      paramsToDelete.push(key);
    }
  });
  for (const key of paramsToDelete) {
    parsed.searchParams.delete(key);
  }

  // Sort remaining params for consistent ordering
  parsed.searchParams.sort();

  // Normalize www./non-www. to match rootHost if provided
  if (rootHost) {
    const rootHostLower = rootHost.toLowerCase();
    const currentHost = parsed.hostname;

    const rootHasWww = rootHostLower.startsWith('www.');
    const currentHasWww = currentHost.startsWith('www.');

    if (rootHasWww && !currentHasWww) {
      // Root uses www, current doesn't — check if they match after adding www
      if (`www.${currentHost}` === rootHostLower) {
        parsed.hostname = rootHostLower;
      }
    } else if (!rootHasWww && currentHasWww) {
      // Root doesn't use www, current does — check if they match after stripping www
      if (currentHost.slice(4) === rootHostLower) {
        parsed.hostname = rootHostLower;
      }
    }
  }

  let result = parsed.toString();

  // Strip trailing slash (except for root path "/")
  // A root path URL looks like "https://example.com/" — pathname is "/"
  if (parsed.pathname !== '/' && result.endsWith('/')) {
    result = result.slice(0, -1);
  }

  return result;
}

/**
 * Deduplicate an array of URLs after normalization.
 * If rootUrl is provided, normalize www./non-www. to match whichever form the rootHost uses.
 */
export function dedupeUrls(urls: string[], rootUrl?: string): string[] {
  let rootHost: string | undefined;
  if (rootUrl) {
    try {
      rootHost = new URL(rootUrl).hostname.toLowerCase();
    } catch {
      // If rootUrl is invalid, proceed without rootHost normalization
    }
  }

  // First pass: normalize all URLs and build a map from normalized → original
  // We also collect http/https pairs to prefer https
  const normalizedMap = new Map<string, string>();
  // Track which normalized URLs have an https variant
  const httpsVariants = new Set<string>();

  for (const url of urls) {
    const normalized = normalizeUrl(url, rootHost);

    // Check if there's already an entry — prefer https over http
    let parsed: URL;
    try {
      parsed = new URL(normalized);
    } catch {
      // Invalid URL — just dedupe by string equality
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, url);
      }
      continue;
    }

    // Build a protocol-agnostic key to detect http/https duplicates
    const agnosticKey = normalized.replace(/^https?:\/\//, '//');

    if (parsed.protocol === 'https:') {
      httpsVariants.add(agnosticKey);
    }

    const existing = normalizedMap.get(agnosticKey);
    if (existing === undefined) {
      normalizedMap.set(agnosticKey, normalized);
    } else {
      // If the new one is https and the existing is http, prefer https
      if (parsed.protocol === 'https:' && existing.startsWith('http://')) {
        normalizedMap.set(agnosticKey, normalized);
      }
      // Otherwise keep the first occurrence
    }
  }

  // Return deduplicated normalized URLs preserving insertion order
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const normalized = normalizeUrl(url, rootHost);

    let agnosticKey: string;
    try {
      agnosticKey = normalized.replace(/^https?:\/\//, '//');
    } catch {
      agnosticKey = normalized;
    }

    if (seen.has(agnosticKey)) {
      continue;
    }
    seen.add(agnosticKey);

    // Use the preferred (https if available) version
    const preferred = normalizedMap.get(agnosticKey) ?? normalized;
    result.push(preferred);
  }

  return result;
}

/**
 * Generate a filename from a URL path:
 * - /about/team → about-team.png
 * - / → home.png
 * - Strip query strings
 * - Replace / with -
 * - Strip non-alphanumeric chars except -
 * - Truncate to 80 chars
 * - Append -2, -3 etc on collision (pass a Set of used names)
 */
export function urlToFilename(
  url: string,
  format: 'png' | 'jpeg',
  usedNames: Set<string>,
): string {
  const ext = format === 'jpeg' ? '.jpeg' : '.png';

  let pathname: string;
  try {
    const parsed = new URL(url);
    pathname = parsed.pathname;
  } catch {
    // If URL parsing fails, try to extract a path-like portion
    // Strip query string and fragment manually
    pathname = url.split('?')[0]?.split('#')[0] ?? url;
  }

  // Root path → "home"
  if (pathname === '/' || pathname === '') {
    pathname = 'home';
  }

  // Replace slashes with hyphens
  let slug = pathname.replace(/\//g, '-');

  // Strip non-alphanumeric chars except hyphens
  slug = slug.replace(/[^a-zA-Z0-9-]/g, '');

  // Collapse multiple consecutive hyphens
  slug = slug.replace(/-{2,}/g, '-');

  // Strip leading and trailing hyphens
  slug = slug.replace(/^-+/, '').replace(/-+$/, '');

  // Fallback if slug is empty after sanitization
  if (slug === '') {
    slug = 'page';
  }

  // Lowercase for consistency
  slug = slug.toLowerCase();

  // Truncate to 80 chars (excluding extension)
  if (slug.length > 80) {
    slug = slug.slice(0, 80);
    // Don't leave a trailing hyphen after truncation
    slug = slug.replace(/-+$/, '');
  }

  // Handle collisions
  let candidate = `${slug}${ext}`;
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }

  let counter = 2;
  while (true) {
    candidate = `${slug}-${counter}${ext}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    counter++;
    // Safety valve to prevent infinite loops in pathological cases
    if (counter > 10000) {
      const fallback = `${slug}-${Date.now()}${ext}`;
      usedNames.add(fallback);
      return fallback;
    }
  }
}
