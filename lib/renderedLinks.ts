import type { Browser } from 'playwright';
import { USER_AGENT } from './browser';
import { applyAuthToContext } from './siteAuth';
import type { ResolvedAuth } from './siteAuth';

/**
 * Web apps often render their navigation with JavaScript, so the HTML crawler
 * finds nothing. This loads the start page in a real (logged-in) browser and
 * collects same-host links from the rendered DOM, including the page the
 * site redirected to after login.
 */
export async function discoverRenderedLinks(
  browser: Browser,
  startUrl: string,
  auth: ResolvedAuth | undefined,
  isAllowed: (url: string) => boolean,
): Promise<{ links: string[]; finalUrl: string; title: string }> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 900 },
    httpCredentials: auth?.httpCredentials,
  });
  await applyAuthToContext(context, auth);
  const page = await context.newPage();
  try {
    try {
      await page.goto(startUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    } catch {
      await page.goto(startUrl, { waitUntil: 'load', timeout: 15_000 });
      await page.waitForTimeout(1_500);
    }
    const host = new URL(startUrl).hostname;
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
    const finalUrl = page.url();
    const links = new Set<string>();
    for (const href of [finalUrl, ...hrefs]) {
      try {
        const u = new URL(href);
        if (u.hostname !== host || !/^https?:$/.test(u.protocol)) continue;
        u.hash = '';
        if (/\.(pdf|zip|png|jpe?g|gif|svg|webp|mp4|css|js|xml|json)$/i.test(u.pathname)) continue;
        if (/log-?out|sign-?out/i.test(u.pathname)) continue; // never visit logout links
        const s = u.toString();
        if (isAllowed(s)) links.add(s);
      } catch {
        // ignore malformed hrefs
      }
    }
    return { links: Array.from(links), finalUrl, title: await page.title() };
  } finally {
    await context.close();
  }
}
