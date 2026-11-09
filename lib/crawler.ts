import * as cheerio from 'cheerio';
import { normalizeUrl } from './dedupe';

const USER_AGENT = 'SiteScreenshotTool/1.0 (+local dev tool)';
const MAX_URLS = 500;
const MAX_DEPTH = 4;
const DEFAULT_CRAWL_DELAY = 300; // ms
const PER_REQUEST_TIMEOUT = 10_000; // 10s
const OVERALL_TIMEOUT = 30_000; // 30s

// File extensions to skip (non-HTML resources)
const SKIP_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico',
  'css', 'js', 'json', 'xml', 'txt',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'rar', '7z',
  'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
]);

export interface CrawlOptions {
  isAllowed: (url: string) => boolean;
  crawlDelay: number; // ms between requests
  /** Extra request headers per URL (login cookies / basic auth). */
  headersFor?: (url: string) => Record<string, string>;
}

/**
 * Check if a URL path has an extension we should skip (non-HTML resource).
 */
function hasSkippedExtension(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop() ?? '';
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex === -1) return false;
    const ext = lastSegment.slice(dotIndex + 1).toLowerCase();
    return SKIP_EXTENSIONS.has(ext);
  } catch {
    return true; // Skip malformed URLs
  }
}

/**
 * BFS crawl from rootUrl, extracting links with cheerio.
 *
 * - Same-hostname links only
 * - Respect robots.txt via isAllowed callback
 * - Honor crawlDelay between requests
 * - Max depth 4, max 500 pages
 * - Skip non-HTML resources by extension and content-type
 * - 30s overall timeout
 * - Use User-Agent: 'SiteScreenshotTool/1.0 (+local dev tool)'
 *
 * @returns { urls: string[], truncated: boolean, method: 'crawl' }
 */
export async function crawlSite(
  rootUrl: string,
  options: CrawlOptions
): Promise<{
  urls: string[];
  truncated: boolean;
  method: 'crawl';
}> {
  const { isAllowed, crawlDelay, headersFor } = options;
  const rootHostname = new URL(rootUrl).hostname.toLowerCase();

  const visited = new Set<string>();
  const collectedUrls: string[] = [];
  let truncated = false;

  interface QueueEntry {
    url: string;
    depth: number;
  }

  const queue: QueueEntry[] = [];

  // Seed the queue with the root URL
  const normalizedRoot = normalizeUrl(rootUrl);
  visited.add(normalizedRoot);
  queue.push({ url: normalizedRoot, depth: 0 });

  const overallStart = Date.now();

  while (queue.length > 0) {
    // Check overall timeout
    if (Date.now() - overallStart >= OVERALL_TIMEOUT) {
      truncated = true;
      break;
    }

    // Check max URLs
    if (collectedUrls.length >= MAX_URLS) {
      truncated = true;
      break;
    }

    const entry = queue.shift()!;
    const { url, depth } = entry;

    // Skip if not allowed by robots.txt
    if (!isAllowed(url)) {
      continue;
    }

    // Skip URLs with non-HTML extensions
    if (hasSkippedExtension(url)) {
      continue;
    }

    // Fetch the page with per-request timeout
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT);

      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, ...(headersFor ? headersFor(url) : {}) },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      // Only process HTML responses
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html')) {
        continue;
      }

      html = await response.text();
    } catch {
      // Network error, timeout, abort — skip this URL
      continue;
    }

    // Add to collected URLs (it's a valid HTML page)
    collectedUrls.push(url);

    // Don't extract links if we're at max depth
    if (depth >= MAX_DEPTH) {
      continue;
    }

    // Parse HTML and extract links
    const $ = cheerio.load(html);
    $('a[href]').each((_index, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      // Skip fragment-only links, javascript:, mailto:, tel:, data:
      const trimmedHref = href.trim();
      if (
        trimmedHref.startsWith('#') ||
        trimmedHref.startsWith('javascript:') ||
        trimmedHref.startsWith('mailto:') ||
        trimmedHref.startsWith('tel:') ||
        trimmedHref.startsWith('data:')
      ) {
        return;
      }

      // Resolve relative URLs
      let resolvedUrl: URL;
      try {
        resolvedUrl = new URL(trimmedHref, url);
      } catch {
        return; // Skip malformed URLs
      }

      // Strip fragments
      resolvedUrl.hash = '';

      // Same hostname only
      if (resolvedUrl.hostname.toLowerCase() !== rootHostname) {
        return;
      }

      // Only http/https
      if (resolvedUrl.protocol !== 'http:' && resolvedUrl.protocol !== 'https:') {
        return;
      }

      const resolvedString = resolvedUrl.toString();

      // Skip non-HTML extensions
      if (hasSkippedExtension(resolvedString)) {
        return;
      }

      // Never follow logout links: when crawling logged in they would end the session.
      if (/log-?out|sign-?out/i.test(resolvedUrl.pathname)) {
        return;
      }

      // Normalize and check if already visited
      const normalized = normalizeUrl(resolvedString);
      if (visited.has(normalized)) {
        return;
      }

      visited.add(normalized);
      queue.push({ url: normalized, depth: depth + 1 });
    });

    // Honor crawl delay between requests (only if there are more URLs to process)
    if (queue.length > 0 && crawlDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, crawlDelay));
    }
  }

  // If there are still items in the queue, we truncated
  if (queue.length > 0 && !truncated) {
    truncated = true;
  }

  return {
    urls: collectedUrls,
    truncated,
    method: 'crawl',
  };
}
