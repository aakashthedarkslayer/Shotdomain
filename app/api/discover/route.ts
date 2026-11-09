import { NextRequest } from 'next/server';
import { discoverFromSitemap } from '@/lib/sitemap';
import { crawlSite } from '@/lib/crawler';
import { fetchRobotsTxt } from '@/lib/robots';
import { dedupeUrls } from '@/lib/dedupe';
import { createJob } from '@/lib/jobStore';
import { sanitizeAuth } from '@/lib/captureOptions';
import { getBrowser } from '@/lib/browser';
import { SiteLoginError, authHeadersFor, resolveSiteAuth } from '@/lib/siteAuth';
import type { ResolvedAuth } from '@/lib/siteAuth';
import { discoverRenderedLinks } from '@/lib/renderedLinks';
import { inPathScope, sameSite } from '@/lib/url';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    const auth = sanitizeAuth(body.auth);

    if (!url || typeof url !== 'string') {
      return Response.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    // Strip trailing slash
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    let origin: string;
    try {
      const parsed = new URL(normalizedUrl);
      origin = parsed.origin;
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Log in first (if the site needs it) so discovery sees the logged-in site.
    let resolved: ResolvedAuth | undefined;
    if (auth) {
      try {
        resolved = await resolveSiteAuth(getBrowser, auth, normalizedUrl);
      } catch (err) {
        const message = err instanceof SiteLoginError ? err.message : 'Login failed.';
        return Response.json({ error: message }, { status: 400 });
      }
    }
    const headersFor = (u: string) => authHeadersFor(resolved, u);

    // A URL with a path (e.g. github.com/owner/repo) limits discovery to that section.
    const startPath = new URL(normalizedUrl).pathname.replace(/\/+$/, '');
    const pathPrefix = startPath && startPath !== '/' ? startPath : undefined;
    const inScope = (u: string) => sameSite(u, normalizedUrl) && inPathScope(u, pathPrefix);

    // Try sitemap first
    let urls: string[] = [];
    let method: 'sitemap' | 'crawl' = 'sitemap';
    let truncated = false;

    try {
      const sitemapResult = await discoverFromSitemap(origin, headersFor);
      urls = sitemapResult.urls.filter(inScope);
      truncated = sitemapResult.truncated && urls.length >= 500;
      method = 'sitemap';
    } catch {
      // Sitemap failed, will try crawl
    }

    // Fall back to crawl if sitemap yielded < 2 URLs
    if (urls.length < 2) {
      try {
        const robots = await fetchRobotsTxt(origin);
        const crawlResult = await crawlSite(normalizedUrl, {
          isAllowed: robots.isAllowed,
          crawlDelay: robots.getCrawlDelay(),
          headersFor,
          pathPrefix,
        });
        urls = crawlResult.urls;
        truncated = crawlResult.truncated;
        method = 'crawl';
      } catch (error) {
        // If crawl also fails, return whatever we have from sitemap
        if (urls.length === 0) {
          // Include the root URL at minimum
          urls = [normalizedUrl];
        }
        method = 'crawl';
      }
    }

    // Logged-in web apps often build their navigation with JavaScript; add links
    // from the rendered page (including where the login redirected to).
    let renderedFrom: string | undefined;
    if (resolved && urls.length < 500) {
      try {
        const robots = await fetchRobotsTxt(origin);
        const rendered = await discoverRenderedLinks(await getBrowser(), normalizedUrl, resolved, robots.isAllowed, pathPrefix);
        renderedFrom = rendered.finalUrl;
        const seen = new Set(urls);
        for (const link of rendered.links) {
          if (urls.length >= 500) break;
          if (!seen.has(link)) urls.push(link);
        }
      } catch (err) {
        console.warn('Rendered link discovery failed:', err instanceof Error ? err.message : err);
      }
    }

    // Deduplicate, keep only the requested site/section
    urls = dedupeUrls(urls.filter(inScope), normalizedUrl);

    // Ensure the start URL itself is included
    const startKey = (u: string) => {
      try {
        const p = new URL(u);
        return p.pathname.replace(/\/+$/, '') || '/';
      } catch {
        return u;
      }
    };
    if (!urls.some((u) => startKey(u) === (startPath || '/'))) {
      urls.unshift(normalizedUrl);
    }

    // Create a job to track this discovery
    const job = await createJob('discover', urls);

    return Response.json({
      jobId: job.id,
      method,
      urls,
      truncated,
      loggedIn: !!resolved,
      renderedFrom,
      pathPrefix,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}
