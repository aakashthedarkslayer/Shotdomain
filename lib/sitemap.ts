import { XMLParser } from 'fast-xml-parser';

const USER_AGENT = 'SiteScreenshotTool/1.0 (+local dev tool)';
const MAX_URLS = 500;
const OVERALL_TIMEOUT_MS = 30_000;
const MAX_RECURSION_DEPTH = 3;

const parser = new XMLParser({ ignoreAttributes: false });

/**
 * Fetch a URL with the shared User-Agent header and an AbortSignal.
 * Throws a descriptive error on network failure or non-200 response.
 */
async function fetchXml(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal,
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
    );
  }

  return res.text();
}

/**
 * Normalise a value that may be a single item or an array into an array.
 */
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Extract `<loc>` strings from `<url>` entries inside a parsed sitemap
 * (i.e. a document whose root is `<urlset>`).
 */
function extractUrlsFromUrlset(parsed: Record<string, unknown>): string[] {
  const urlset = parsed['urlset'] as Record<string, unknown> | undefined;
  if (!urlset) return [];

  const entries = toArray(urlset['url'] as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const locs: string[] = [];

  for (const entry of entries) {
    const loc = (entry as Record<string, unknown>)['loc'];
    if (typeof loc === 'string' && loc.length > 0) {
      locs.push(loc);
    }
  }

  return locs;
}

/**
 * Extract child sitemap `<loc>` strings from a `<sitemapindex>` document.
 */
function extractChildSitemapLocs(parsed: Record<string, unknown>): string[] {
  const index = parsed['sitemapindex'] as Record<string, unknown> | undefined;
  if (!index) return [];

  const entries = toArray(index['sitemap'] as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const locs: string[] = [];

  for (const entry of entries) {
    const loc = (entry as Record<string, unknown>)['loc'];
    if (typeof loc === 'string' && loc.length > 0) {
      locs.push(loc);
    }
  }

  return locs;
}

/**
 * Recursively parse a sitemap (or sitemap index) and collect URLs.
 *
 * @param url       The sitemap URL to fetch.
 * @param signal    Shared AbortSignal for the overall timeout.
 * @param collected Mutable set that accumulates discovered URLs.
 * @param depth     Current recursion depth (0-based).
 * @returns `true` if the MAX_URLS cap was reached (i.e. truncated).
 */
async function collectUrls(
  url: string,
  signal: AbortSignal,
  collected: Set<string>,
  depth: number,
): Promise<boolean> {
  if (depth > MAX_RECURSION_DEPTH) return false;
  if (collected.size >= MAX_URLS) return true;

  const xml = await fetchXml(url, signal);
  const parsed = parser.parse(xml) as Record<string, unknown>;

  // --- Regular sitemap (<urlset>) ---
  const directUrls = extractUrlsFromUrlset(parsed);
  for (const loc of directUrls) {
    collected.add(loc);
    if (collected.size >= MAX_URLS) return true;
  }

  // --- Sitemap index (<sitemapindex>) ---
  const childLocs = extractChildSitemapLocs(parsed);
  for (const childLoc of childLocs) {
    const truncated = await collectUrls(childLoc, signal, collected, depth + 1);
    if (truncated) return true;
  }

  return false;
}

/**
 * Discover URLs from sitemap.xml.
 *
 * 1. Try GET {origin}/sitemap.xml
 * 2. If 404, try GET {origin}/sitemap_index.xml
 * 3. If found, parse XML with fast-xml-parser
 * 4. Handle `<sitemapindex>` with `<sitemap><loc>…</loc></sitemap>` entries
 *    recursively up to 3 levels deep
 * 5. Extract all `<loc>` values from `<url><loc>…</loc></url>` entries
 * 6. Cap at MAX_URLS (500), return `truncated: true` if capped
 * 7. Overall timeout: 30 seconds via AbortController
 *
 * @returns `{ urls: string[], truncated: boolean, method: 'sitemap' }`
 */
export async function discoverFromSitemap(origin: string): Promise<{
  urls: string[];
  truncated: boolean;
  method: 'sitemap';
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OVERALL_TIMEOUT_MS);

  try {
    const collected = new Set<string>();
    let truncated = false;

    // Determine which sitemap URL to use.
    const primaryUrl = `${origin.replace(/\/+$/, '')}/sitemap.xml`;
    const fallbackUrl = `${origin.replace(/\/+$/, '')}/sitemap_index.xml`;

    let sitemapUrl: string;

    try {
      // Try the primary URL first; a non-200 status throws inside fetchXml.
      await fetchXml(primaryUrl, controller.signal);
      sitemapUrl = primaryUrl;
    } catch (err: unknown) {
      // If the primary failed with a 404-like message, try the fallback.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('404')) {
        // Attempt fallback — let errors propagate if this also fails.
        await fetchXml(fallbackUrl, controller.signal);
        sitemapUrl = fallbackUrl;
      } else {
        throw err;
      }
    }

    // We already validated the URL is reachable; now collect URLs from it.
    truncated = await collectUrls(sitemapUrl, controller.signal, collected, 0);

    return {
      urls: Array.from(collected),
      truncated,
      method: 'sitemap',
    };
  } finally {
    clearTimeout(timeout);
  }
}
