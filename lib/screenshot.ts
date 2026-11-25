import { devices } from 'playwright';
import { getBrowser, USER_AGENT } from './browser';
import type { Browser, BrowserContext, Page, Response as PageResponse } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { CaptureSettings, CaptureResult } from './jobStore';
import { getJob } from './jobStore';
import { getDevicePreset, getDeviceFolder, userAgentFor } from './devices';
import { urlToFilename } from './dedupe';
import { applyCleanup, injectCss } from './pageCleanup';
import { SiteLoginError, applyAuthToContext, resolveSiteAuth } from './siteAuth';
import type { ResolvedAuth } from './siteAuth';
import { createRequestGuard } from './ssrf';
import type { RequestGuard } from './ssrf';
import { thumbnailFor } from './thumbnails';
import { sameSite, urlHost } from './url';

/*
 * The capture engine. For every page:
 *   1. navigate once, waiting for DOMContentLoaded, then (bounded) for the
 *      load event and for the network to go quiet — sites with chat widgets
 *      or analytics beacons never go fully idle, so that wait is capped
 *      instead of failing and reloading;
 *   2. let the page settle: web fonts, and animations/transitions jumped to
 *      their end state so screenshots are stable and comparable run to run;
 *   3. clean up (consent banners, user selectors, CSS);
 *   4. for full-page shots: make lazy content load, let app shells that
 *      scroll inside a container grow to their full height, scroll through
 *      the page and back to the top;
 *   5. screenshot (very tall pages are clipped at a sane height);
 *   6. look at what was captured and attach honest warnings: HTTP errors,
 *      bot checks (never bypassed), login forms, off-site redirects.
 * One transient network failure is retried once. Each page has a hard time
 * budget so a single site can't hang a job.
 */

// Hardcoded ad/tracker domains to block
const AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'connect.facebook.net',
  'analytics.google.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'amazon-adsystem.com',
  'ads.twitter.com',
  'ads.linkedin.com',
];

const NAV_TIMEOUT_MS = 30_000; // DOMContentLoaded
const LOAD_TIMEOUT_MS = 15_000; // load event (images, stylesheets)
const IDLE_TIMEOUT_MS = 8_000; // network idle — capped, never required
const FONTS_TIMEOUT_MS = 3_000;
const SETTLE_TIMEOUT_MS = 5_000; // lazy images after scrolling
const PAGE_BUDGET_MS = 120_000; // hard cap for one page, end to end
/** Full-page captures are clipped here (CSS px): keeps memory bounded and files openable. */
export const MAX_FULLPAGE_HEIGHT = 16_000;
/** Hard cap so infinite-scroll pages can't hang a capture (~MAX_SCROLL_STEPS × 100ms). */
const MAX_SCROLL_STEPS = 80;
const SCROLL_STEP_DELAY_MS = 100;

/** Jump CSS animations and transitions to their end state; hide the text caret. */
const SETTLE_CSS = `*, *::before, *::after {
  animation-duration: 0.001s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
  scroll-behavior: auto !important; caret-color: transparent !important;
}`;

// ---------------------------------------------------------------------------
// Semaphore — simple promise-based concurrency limiter
// ---------------------------------------------------------------------------

class Semaphore {
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) next(); // hand the slot straight to the next waiter
    else this.current--;
  }
}

// ---------------------------------------------------------------------------
// Per-host rate limiter
// ---------------------------------------------------------------------------

const hostLastRequest = new Map<string, number>();
const HOST_MIN_INTERVAL_MS = 300;

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

async function waitForHost(hostname: string): Promise<void> {
  const last = hostLastRequest.get(hostname);
  if (last !== undefined) {
    const elapsed = Date.now() - last;
    if (elapsed < HOST_MIN_INTERVAL_MS) {
      await new Promise<void>((resolve) => setTimeout(resolve, HOST_MIN_INTERVAL_MS - elapsed));
    }
  }
  hostLastRequest.set(hostname, Date.now());
}

// ---------------------------------------------------------------------------
// Ad-blocking helper
// ---------------------------------------------------------------------------

function isAdUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return AD_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Context factory
// ---------------------------------------------------------------------------

async function createContext(
  browser: Browser,
  settings: CaptureSettings,
  auth: ResolvedAuth | undefined, // required on purpose: every context must carry the login
  guard: RequestGuard,
): Promise<BrowserContext> {
  const context = await newDeviceContext(browser, settings, auth);
  await applyAuthToContext(context, auth);
  // Registered last so it runs first: nothing (navigation, redirect, image) reaches a private address.
  if (guard.enabled) {
    await context.route('**/*', async (route) =>
      (await guard.allowed(route.request().url())) ? route.fallback() : route.abort('blockedbyclient'),
    );
  }
  return context;
}

async function newDeviceContext(browser: Browser, settings: CaptureSettings, auth?: ResolvedAuth): Promise<BrowserContext> {
  const deviceName = settings.device || 'Desktop';
  const preset = getDevicePreset(deviceName);
  const common = {
    httpCredentials: auth?.httpCredentials,
    userAgent: userAgentFor(deviceName, USER_AGENT),
    // Sites that respect prefers-reduced-motion skip their animations for us.
    reducedMotion: 'reduce' as const,
  };

  // Desktop — no Playwright device descriptor
  if (!preset?.playwrightDevice) {
    return browser.newContext({
      ...common,
      viewport: { width: settings.width, height: settings.height },
      deviceScaleFactor: preset?.deviceScaleFactor ?? 1,
    });
  }

  // Mobile / Tablet — screen metrics and touch from Playwright's descriptor, never its User-Agent.
  const descriptor = devices[preset.playwrightDevice as keyof typeof devices];
  const { userAgent: _spoofedUa, defaultBrowserType: _browserType, ...metrics } = descriptor;
  void _spoofedUa;
  void _browserType;

  // If the user changed width/height from the preset defaults, use theirs
  const viewportWidth = settings.width !== preset.width ? settings.width : (descriptor?.viewport?.width ?? settings.width);
  const viewportHeight = settings.height !== preset.height ? settings.height : (descriptor?.viewport?.height ?? settings.height);

  return browser.newContext({
    ...metrics,
    ...common,
    viewport: { width: viewportWidth, height: viewportHeight },
  });
}

// ---------------------------------------------------------------------------
// Page readiness
// ---------------------------------------------------------------------------

const TRANSIENT_ERROR =
  /ERR_NETWORK_CHANGED|ERR_CONNECTION_RESET|ERR_CONNECTION_CLOSED|ERR_EMPTY_RESPONSE|ERR_TIMED_OUT|ERR_HTTP2_PROTOCOL_ERROR|ERR_SOCKET_NOT_CONNECTED|ERR_INTERNET_DISCONNECTED|Timeout \d+ms exceeded/;
/** https:// failed in a way that suggests the site only speaks plain HTTP (as a browser, try http:// next). */
const HTTPS_FALLBACK_ERROR = /ERR_SSL_|ERR_CERT_|SSL_ERROR|ERR_CONNECTION_REFUSED|ERR_CONNECTION_CLOSED|ERR_CONNECTION_RESET/;

/** One navigation: DOMContentLoaded is required; load and network-idle are waited for, bounded. */
async function navigate(page: Page, url: string): Promise<PageResponse | null> {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT_MS }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS }).catch(() => {});
  return response;
}

/** Fonts loaded, animations finished, a beat for layout. */
async function settle(page: Page): Promise<void> {
  await injectCss(page, SETTLE_CSS);
  await page
    .evaluate((timeout) => Promise.race([document.fonts.ready, new Promise((done) => setTimeout(done, timeout))]), FONTS_TIMEOUT_MS)
    .catch(() => {});
  await page.waitForTimeout(250);
}

/**
 * Full-page preparation:
 *  - images and iframes marked loading="lazy" load now instead of on scroll;
 *  - if the document itself doesn't scroll but a big container inside it does
 *    (app shells, "overflow: hidden" bodies), that container and its
 *    ancestors are allowed to grow, so the whole content is in the document;
 *  - scroll through the page so IntersectionObserver-based content renders,
 *    wait for the images that triggers, and return to the top.
 * Returns the resulting document height (CSS px).
 */
async function prepareFullPage(page: Page): Promise<{ height: number; expandedContainer: boolean }> {
  const expandedContainer = await page
    .evaluate(() => {
      for (const el of document.querySelectorAll<HTMLImageElement | HTMLIFrameElement>('img[loading="lazy"], iframe[loading="lazy"]')) {
        el.loading = 'eager';
      }
      const doc = document.documentElement;
      if (doc.scrollHeight > window.innerHeight + 4) return false; // the document scrolls: nothing to do

      let best: HTMLElement | null = null;
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        if (el.scrollHeight <= el.clientHeight + 4) continue;
        const cs = getComputedStyle(el);
        if (!/(auto|scroll)/.test(cs.overflowY)) continue;
        const r = el.getBoundingClientRect();
        if (r.height < window.innerHeight * 0.5 || r.width < window.innerWidth * 0.5) continue;
        if (!best || el.scrollHeight > best.scrollHeight) best = el;
      }
      if (!best) return false;

      const grow = (el: HTMLElement) => {
        el.style.setProperty('height', 'auto', 'important');
        el.style.setProperty('max-height', 'none', 'important');
        el.style.setProperty('overflow', 'visible', 'important');
        const pos = getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'absolute') el.style.setProperty('position', 'relative', 'important');
      };
      for (let el: HTMLElement | null = best; el; el = el.parentElement) grow(el);
      return true;
    })
    .catch(() => false);
  if (expandedContainer) await page.waitForTimeout(300);

  await page.evaluate(
    async ({ maxSteps, delay }) => {
      await new Promise<void>((resolve) => {
        let steps = 0;
        const timer = setInterval(() => {
          // 75% of a viewport per step so every element is fully in view at some point.
          const step = Math.max(300, Math.floor(window.innerHeight * 0.75));
          window.scrollBy({ top: step, behavior: 'instant' });
          steps++;
          // Re-read the height every tick: pages that grow as you scroll extend the run.
          const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
          if (atBottom || steps >= maxSteps) {
            clearInterval(timer);
            resolve();
          }
        }, delay);
      });
    },
    { maxSteps: MAX_SCROLL_STEPS, delay: SCROLL_STEP_DELAY_MS },
  );

  // Let images and requests kicked off by the scroll finish (bounded).
  await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS }).catch(() => {});
  await page
    .evaluate(
      (timeout) =>
        Promise.race([
          Promise.all(
            Array.from(document.images)
              .filter((img) => !img.complete)
              .map(
                (img) =>
                  new Promise((done) => {
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                  }),
              ),
          ),
          new Promise((done) => setTimeout(done, timeout)),
        ]),
      SETTLE_TIMEOUT_MS,
    )
    .catch(() => {});

  // Back to the top so sticky headers and scroll-linked effects sit in their initial state.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);

  const height = await page
    .evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0))
    .catch(() => 0);
  return { height, expandedContainer };
}

// ---------------------------------------------------------------------------
// Honest diagnostics about what was captured
// ---------------------------------------------------------------------------

const BOT_CHECK_TITLE =
  /just a moment|attention required|access denied|verify you are human|are you a robot|security check|checking your browser|ddos-guard|bot verification|please verify|captcha/i;
const BOT_CHECK_SELECTOR =
  '#challenge-form, #challenge-running, #cf-challenge-running, .cf-browser-verification, #px-captcha, #ddg-captcha, iframe[src*="challenges.cloudflare.com"], iframe[src*="captcha"]';

async function diagnose(page: Page, requestedUrl: string, response: PageResponse | null, loggedIn: boolean): Promise<string[]> {
  const warnings: string[] = [];
  const status = response?.status();
  const info = await page
    .evaluate((botSelector) => {
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      };
      return {
        title: document.title,
        passwordField: Array.from(document.querySelectorAll('input[type="password"]')).some(visible),
        botCheck: !!document.querySelector(botSelector),
        textLength: (document.body?.innerText ?? '').trim().length,
      };
    }, BOT_CHECK_SELECTOR)
    .catch(() => null);

  const botCheck = info && (BOT_CHECK_TITLE.test(info.title) || (info.botCheck && (!status || [403, 429, 503].includes(status) || info.textLength < 400)));
  if (botCheck) {
    warnings.push('The site showed a bot check instead of the page. ShotDomain never bypasses these, so this is what it captured.');
  } else if (status && status >= 400) {
    warnings.push(`The page returned HTTP ${status}${status === 404 ? ' (not found)' : status === 403 ? ' (forbidden)' : status >= 500 ? ' (server error)' : ''}.`);
  }

  if (info?.passwordField && !botCheck) {
    warnings.push(
      loggedIn
        ? 'Landed on a login form, so the saved session may have expired. Log in again and update it.'
        : 'This page shows a login form. If it needs an account, turn on “This site needs a login” on the first step.',
    );
  }

  const finalUrl = page.url();
  if (finalUrl && !sameSite(requestedUrl, finalUrl) && /^https?:/.test(finalUrl)) {
    warnings.push(`Redirected to ${urlHost(finalUrl)}.`);
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Single-URL capture
// ---------------------------------------------------------------------------

async function captureOne(
  context: BrowserContext,
  url: string,
  settings: CaptureSettings,
  outputPath: string,
): Promise<{ warning?: string }> {
  const warnings: string[] = [];
  let budgetTimer: NodeJS.Timeout | undefined;

  const newPage = async () => {
    const page = await context.newPage();
    // Ad blocking via route interception
    if (settings.blockAds) {
      await page.route('**/*', (route) => {
        if (isAdUrl(route.request().url())) return route.abort();
        // fallback (not continue) so context-level routes, e.g. session headers, still apply
        return route.fallback();
      });
    }
    return page;
  };
  let page = await newPage();

  const work = async () => {
    // Navigation: https that won't connect is retried over http (like a browser
    // does for a typed address), transient network trouble is retried once.
    // Retries use a fresh page: after a failure Chromium is still busy
    // navigating to its own error page, which would interrupt a new goto.
    let response: PageResponse | null;
    try {
      response = await navigate(page, url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const httpFallback = /^https:/i.test(url) && HTTPS_FALLBACK_ERROR.test(message);
      if (!httpFallback && !TRANSIENT_ERROR.test(message)) throw err;
      await page.close().catch(() => {});
      page = await newPage();
      if (httpFallback) {
        try {
          response = await navigate(page, url.replace(/^https:/i, 'http:'));
        } catch {
          throw err; // report the HTTPS failure the user asked about
        }
        warnings.push('Captured over plain HTTP: the site did not answer over HTTPS.');
      } else {
        await page.waitForTimeout(1_000);
        response = await navigate(page, url);
      }
    }

    await settle(page);

    // Page cleanup: consent banners, user click/hide selectors, custom CSS
    const cleanupWarning = await applyCleanup(page, settings.cleanup);
    if (cleanupWarning) warnings.push(cleanupWarning);

    if (settings.backgroundColor) {
      await injectCss(page, `html, body { background: ${settings.backgroundColor} !important; }`);
      await page.waitForTimeout(100);
    }

    let clip: { x: number; y: number; width: number; height: number } | undefined;
    if (settings.fullPage) {
      const { height } = await prepareFullPage(page);
      if (height > MAX_FULLPAGE_HEIGHT) {
        const width = page.viewportSize()?.width ?? settings.width;
        clip = { x: 0, y: 0, width, height: MAX_FULLPAGE_HEIGHT };
        warnings.push(`Very tall page (${height.toLocaleString()} px). Captured the first ${MAX_FULLPAGE_HEIGHT.toLocaleString()} px.`);
      }
    }

    warnings.unshift(...(await diagnose(page, url, response, Boolean(settings.auth && settings.auth.method !== 'none'))));

    await page.screenshot({
      path: outputPath,
      fullPage: settings.fullPage,
      ...(clip ? { clip } : {}),
      type: settings.format,
      ...(settings.format === 'jpeg' ? { quality: 85 } : {}),
    });
    // Preview for grids and lists; the capture is fine without it.
    await thumbnailFor(outputPath);
  };

  try {
    await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        budgetTimer = setTimeout(() => reject(new Error(`Timeout: the page took longer than ${PAGE_BUDGET_MS / 1000} seconds`)), PAGE_BUDGET_MS);
      }),
    ]);
    return warnings.length ? { warning: warnings.join(' ') } : {};
  } finally {
    clearTimeout(budgetTimer);
    await page.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Main capture orchestrator
// ---------------------------------------------------------------------------

export interface CaptureOptions {
  /**
   * Store files in per-device folders and key results as "Device:url" even
   * with a single device — for retrying one page of a multi-device job.
   */
  deviceFolders?: boolean;
  /** File names already taken in the job (so a retry never overwrites another page). */
  reservedNames?: string[];
}

/**
 * Capture screenshots for a list of URLs with the given settings.
 *
 * - Max 4 concurrent captures (semaphore)
 * - Min 300ms stagger between requests to the same host
 * - One browser context per capture, or one per host+device with useCache
 * - Files go to tmp/{jobId}/[{device}/]{filename}
 * - Every result is reported through onProgress, keyed by url, or
 *   "Device:url" for multi-device jobs
 */
export async function captureScreenshots(
  jobId: string,
  urls: string[],
  settings: CaptureSettings,
  onProgress: (key: string, result: Partial<CaptureResult>) => void,
  options: CaptureOptions = {},
): Promise<void> {
  const browser = await getBrowser();
  const semaphore = new Semaphore(4);
  const tmpDir = path.join(process.cwd(), 'tmp', jobId);
  const guard = createRequestGuard();

  // Determine target devices
  const targetDevices = settings.devices && settings.devices.length > 0 ? settings.devices : [settings.device || 'Desktop'];
  const isMultiDevice = targetDevices.length > 1 || Boolean(options.deviceFolders);

  // Ensure output directories exist
  await fs.mkdir(tmpDir, { recursive: true });
  if (isMultiDevice) {
    for (const dev of targetDevices) {
      await fs.mkdir(path.join(tmpDir, getDeviceFolder(dev)), { recursive: true });
    }
  }

  // Each device gets its own usedNames set so filenames like home.png are identical across folders
  const usedNamesPerDevice = new Map<string, Set<string>>();
  for (const dev of targetDevices) {
    usedNamesPerDevice.set(dev, new Set<string>(options.reservedNames ?? []));
  }

  const failAll = (message: string) => {
    for (const dev of targetDevices) {
      for (const url of urls) {
        onProgress(isMultiDevice ? `${dev}:${url}` : url, { status: 'failed', error: message, device: dev });
      }
    }
  };

  // Log in once per job (login form) or parse cookies; every capture context reuses the result.
  let resolvedAuth: ResolvedAuth | undefined;
  if (settings.auth && settings.auth.method !== 'none') {
    try {
      resolvedAuth = await resolveSiteAuth(browser, settings.auth, urls[0]);
    } catch (err) {
      failAll(err instanceof SiteLoginError ? err.message : `Login failed: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
  }

  // Context cache — keyed by `${hostname}:${device}` when useCache is enabled
  const contextCache = new Map<string, BrowserContext>();

  async function getContext(hostname: string, devSettings: CaptureSettings): Promise<BrowserContext> {
    const cacheKey = `${hostname}:${devSettings.device}`;
    if (settings.useCache) {
      const cached = contextCache.get(cacheKey);
      if (cached) return cached;
    }
    const ctx = await createContext(browser, devSettings, resolvedAuth, guard);
    if (settings.useCache) contextCache.set(cacheKey, ctx);
    return ctx;
  }

  interface CaptureTaskItem {
    url: string;
    device: 'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)';
    key: string;
    devSettings: CaptureSettings;
  }

  const items: CaptureTaskItem[] = [];
  for (const dev of targetDevices) {
    const preset = getDevicePreset(dev);
    // With one device the user's width/height apply; with several, each device's preset size.
    const multi = targetDevices.length > 1;
    const devWidth = !multi && settings.width ? settings.width : (preset?.width ?? settings.width);
    const devHeight = !multi && settings.height ? settings.height : (preset?.height ?? settings.height);
    const devSettings: CaptureSettings = { ...settings, device: dev, width: devWidth, height: devHeight };
    for (const url of urls) {
      items.push({ url, device: dev, key: isMultiDevice ? `${dev}:${url}` : url, devSettings });
    }
  }

  const tasks = items.map((item) =>
    (async () => {
      if (getJob(jobId)?.cancelled) return;
      await semaphore.acquire();
      try {
        if (getJob(jobId)?.cancelled) return;
        onProgress(item.key, { status: 'capturing', device: item.device });

        const hostname = getHostname(item.url);
        await waitForHost(hostname);

        let context: BrowserContext;
        let ownedContext = false;
        if (settings.useCache) {
          context = await getContext(hostname, item.devSettings);
        } else {
          context = await createContext(browser, item.devSettings, resolvedAuth, guard);
          ownedContext = true;
        }

        const baseFileName = urlToFilename(item.url, settings.format, usedNamesPerDevice.get(item.device)!);
        const folder = isMultiDevice ? getDeviceFolder(item.device) : '';
        const outputPath = path.join(tmpDir, folder, baseFileName);
        const relativeFileName = folder ? `${folder}/${baseFileName}` : baseFileName;

        try {
          const { warning } = await captureOne(context, item.url, item.devSettings, outputPath);
          onProgress(item.key, { status: 'done', fileName: relativeFileName, device: item.device, warning });
        } catch (err) {
          onProgress(item.key, { status: 'failed', error: errorToMessage(err, guard.enabled), device: item.device });
        } finally {
          if (ownedContext) await context.close().catch(() => {});
        }
      } finally {
        semaphore.release();
      }
    })(),
  );

  await Promise.all(tasks);

  await Promise.all(Array.from(contextCache.values()).map((ctx) => ctx.close().catch(() => {})));
  contextCache.clear();
}

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

/** Plain-language reasons for the most common capture failures. */
function errorToMessage(err: unknown, guardEnabled: boolean): string {
  if (!(err instanceof Error)) return String(err);
  const m = err.message;
  if (m.includes('ERR_BLOCKED_BY_CLIENT') && guardEnabled) return 'Blocked: this address is on a private network, which can’t be captured from here.';
  if (m.includes('ERR_NAME_NOT_RESOLVED') || m.includes('ENOTFOUND')) return 'The site’s address could not be found (DNS lookup failed).';
  if (m.includes('ERR_CONNECTION_REFUSED')) return 'The site refused the connection.';
  if (m.includes('ERR_CONNECTION_TIMED_OUT') || m.includes('ERR_TIMED_OUT')) return 'The site did not respond.';
  if (/ERR_CERT_|ERR_SSL_|SSL_ERROR/.test(m)) return 'The site’s HTTPS certificate is invalid, so the connection was refused.';
  if (m.includes('ERR_TOO_MANY_REDIRECTS')) return 'The page kept redirecting.';
  if (m.includes('ERR_ABORTED')) return 'The URL is a file download (or the page navigated away), not a web page.';
  if (m.includes('ERR_FAILED') && guardEnabled) return 'The page could not be loaded (a request was blocked).';
  if (err.name === 'TimeoutError' || /Timeout \d+ms exceeded/.test(m)) return `Timeout: the page did not load within ${NAV_TIMEOUT_MS / 1000} seconds.`;
  if (m.startsWith('Timeout:')) return m;
  const code = /net::(ERR_[A-Z0-9_]+)/.exec(m)?.[1];
  if (code) return `The browser could not load the page (${code.replace(/^ERR_/, '').toLowerCase().replace(/_/g, ' ')}).`;
  return m.split('\n')[0] ?? 'Unknown error';
}
