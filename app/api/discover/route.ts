import { NextRequest } from 'next/server';
import { discoverFromSitemap } from '@/lib/sitemap';
import { crawlSite } from '@/lib/crawler';
import { fetchRobotsTxt } from '@/lib/robots';
import { dedupeUrls } from '@/lib/dedupe';
import { createJob } from '@/lib/jobStore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

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

    // Try sitemap first
    let urls: string[] = [];
    let method: 'sitemap' | 'crawl' = 'sitemap';
    let truncated = false;

    try {
      const sitemapResult = await discoverFromSitemap(origin);
      urls = sitemapResult.urls;
      truncated = sitemapResult.truncated;
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

    // Deduplicate
    urls = dedupeUrls(urls, normalizedUrl);

    // Ensure root URL is included
    if (!urls.some(u => {
      try {
        const parsed = new URL(u);
        return parsed.pathname === '/' || parsed.pathname === '';
      } catch { return false; }
    })) {
      urls.unshift(normalizedUrl);
    }

    // Create a job to track this discovery
    const job = await createJob('discover', urls);

    return Response.json({
      jobId: job.id,
      method,
      urls,
      truncated,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}
