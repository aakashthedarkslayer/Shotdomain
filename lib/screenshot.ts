import { chromium, devices } from 'playwright';
import type { Browser, BrowserContext } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { CaptureSettings, CaptureResult } from './jobStore';
import { getJob } from './jobStore';
import { getDevicePreset, getDeviceFolder } from './devices';
import { urlToFilename } from './dedupe';

const USER_AGENT = 'SiteScreenshotTool/1.0 (+local dev tool)';

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
    // Wait until a slot opens
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      // Hand the slot directly to the next waiter
      next();
    } else {
      this.current--;
    }
  }
}

// ---------------------------------------------------------------------------
// Browser singleton
// ---------------------------------------------------------------------------

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
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
      await new Promise<void>((resolve) =>
        setTimeout(resolve, HOST_MIN_INTERVAL_MS - elapsed),
      );
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
    return AD_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
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
): Promise<BrowserContext> {
  const preset = getDevicePreset(settings.device || 'Desktop');

  // Desktop — no Playwright device descriptor
  if (!preset?.playwrightDevice) {
    return browser.newContext({
      viewport: { width: settings.width, height: settings.height },
      userAgent: USER_AGENT,
      deviceScaleFactor: preset?.deviceScaleFactor ?? 1,
    });
  }

  // Mobile / Tablet — start from Playwright's built-in device descriptor
  const deviceDescriptor =
    devices[preset.playwrightDevice as keyof typeof devices];

  // If the user changed width/height from the preset defaults, use theirs
  const viewportWidth =
    settings.width !== preset.width
      ? settings.width
      : deviceDescriptor?.viewport?.width ?? settings.width;
  const viewportHeight =
    settings.height !== preset.height
      ? settings.height
      : deviceDescriptor?.viewport?.height ?? settings.height;

  return browser.newContext({
    ...deviceDescriptor,
    viewport: { width: viewportWidth, height: viewportHeight },
  });
}

// ---------------------------------------------------------------------------
// Single-URL capture
// ---------------------------------------------------------------------------

async function captureOne(
  context: BrowserContext,
  url: string,
  settings: CaptureSettings,
  outputPath: string,
): Promise<void> {
  const page = await context.newPage();

  try {
    // Ad blocking via route interception
    if (settings.blockAds) {
      await page.route('**/*', (route) => {
        if (isAdUrl(route.request().url())) {
          return route.abort();
        }
        return route.continue();
      });
    }

    // Navigation — try networkidle first, fall back to load + extra wait
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      // If hostname couldn't be resolved or connection refused, don't waste time retrying load
      if (
        errMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errMessage.includes('ERR_CONNECTION_REFUSED') ||
        errMessage.includes('ENOTFOUND')
      ) {
        throw err;
      }
      // networkidle can be flaky; fall back to 'load' + a short extra delay
      await page.goto(url, { waitUntil: 'load', timeout: 15_000 });
      await page.waitForTimeout(2_000);
    }

    // Inject custom background color
    if (settings.backgroundColor) {
      await page.addStyleTag({
        content: `html,body{background:${settings.backgroundColor} !important}`,
      });
      // Brief pause to let the style apply
      await page.waitForTimeout(100);
    }

    // Take the screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: settings.fullPage,
      type: settings.format,
      ...(settings.format === 'jpeg' ? { quality: 85 } : {}),
    });
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Main capture orchestrator
// ---------------------------------------------------------------------------

/**
 * Capture screenshots for a list of URLs with the given settings.
 *
 * - Max 4 concurrent captures (semaphore)
 * - Min 300ms stagger between requests to the same host
 * - For each URL:
 *   1. Create browser context with device emulation if applicable
 *   2. If blockAds: set up page.route() to abort requests matching AD_DOMAINS
 *   3. Navigate with waitUntil: 'networkidle', 30s timeout
 *      If networkidle fails, fall back to waitUntil: 'load' + 3s extra wait
 *   4. If backgroundColor: inject <style>html,body{background:COLOR}</style>
 *   5. Screenshot with fullPage and format options
 *   6. Save to tmp/{jobId}/{filename}
 * - Handle errors: timeout, navigation failure, etc. Mark as failed with reason.
 * - If useCache: reuse one BrowserContext per domain
 *
 * @param jobId - The job ID
 * @param urls - URLs to capture
 * @param settings - Capture settings
 * @param onProgress - Callback for each URL completion/failure
 */
export async function captureScreenshots(
  jobId: string,
  urls: string[],
  settings: CaptureSettings,
  onProgress: (key: string, result: Partial<CaptureResult>) => void,
): Promise<void> {
  const browser = await getBrowser();
  const semaphore = new Semaphore(4);
  const tmpDir = path.join(process.cwd(), 'tmp', jobId);

  // Determine target devices
  const targetDevices = (settings.devices && settings.devices.length > 0)
    ? settings.devices
    : [settings.device || 'Desktop'];
  const isMultiDevice = targetDevices.length > 1;

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
    usedNamesPerDevice.set(dev, new Set<string>());
  }

  // Context cache — keyed by `${hostname}:${device}` when useCache is enabled
  const contextCache = new Map<string, BrowserContext>();

  async function getContext(hostname: string, devSettings: CaptureSettings): Promise<BrowserContext> {
    const cacheKey = `${hostname}:${devSettings.device}`;
    if (settings.useCache) {
      const cached = contextCache.get(cacheKey);
      if (cached) return cached;
    }
    const ctx = await createContext(browser, devSettings);
    if (settings.useCache) {
      contextCache.set(cacheKey, ctx);
    }
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
    // If single device, keep user's configured width/height; if multiple devices, use preset dimensions
    const devWidth = (!isMultiDevice && settings.width) ? settings.width : (preset?.width ?? settings.width);
    const devHeight = (!isMultiDevice && settings.height) ? settings.height : (preset?.height ?? settings.height);

    const devSettings: CaptureSettings = {
      ...settings,
      device: dev,
      width: devWidth,
      height: devHeight,
    };

    for (const url of urls) {
      items.push({
        url,
        device: dev,
        key: isMultiDevice ? `${dev}:${url}` : url,
        devSettings,
      });
    }
  }

  const tasks = items.map((item) =>
    (async () => {
      // Check cancellation before acquiring a slot
      const jobBefore = getJob(jobId);
      if (jobBefore?.cancelled) return;

      await semaphore.acquire();

      try {
        // Check cancellation again after acquiring
        const jobAfter = getJob(jobId);
        if (jobAfter?.cancelled) return;

        // Mark as capturing
        onProgress(item.key, { status: 'capturing', device: item.device });

        const hostname = getHostname(item.url);

        // Per-host rate limiting
        await waitForHost(hostname);

        // Obtain or create a context
        let context: BrowserContext;
        let ownedContext = false;

        if (settings.useCache) {
          context = await getContext(hostname, item.devSettings);
        } else {
          context = await createContext(browser, item.devSettings);
          ownedContext = true;
        }

        const deviceNames = usedNamesPerDevice.get(item.device)!;
        const baseFileName = urlToFilename(item.url, settings.format, deviceNames);

        let outputPath: string;
        let relativeFileName: string;

        if (isMultiDevice) {
          const folder = getDeviceFolder(item.device);
          outputPath = path.join(tmpDir, folder, baseFileName);
          relativeFileName = `${folder}/${baseFileName}`;
        } else {
          outputPath = path.join(tmpDir, baseFileName);
          relativeFileName = baseFileName;
        }

        try {
          await captureOne(context, item.url, item.devSettings, outputPath);
          onProgress(item.key, { status: 'done', fileName: relativeFileName, device: item.device });
        } catch (err) {
          const message = errorToMessage(err);
          onProgress(item.key, { status: 'failed', error: message, device: item.device });
        } finally {
          if (ownedContext) {
            await context.close().catch(() => {});
          }
        }
      } finally {
        semaphore.release();
      }
    })(),
  );

  await Promise.all(tasks);

  // Close all cached contexts
  const closeOps = Array.from(contextCache.values()).map((ctx) =>
    ctx.close().catch(() => {}),
  );
  await Promise.all(closeOps);
  contextCache.clear();
}

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

function errorToMessage(err: unknown): string {
  if (err instanceof Error) {
    // Playwright timeout errors
    if (err.name === 'TimeoutError' || err.message.includes('Timeout')) {
      return `Timeout: page did not load within 30 seconds`;
    }
    // Navigation errors
    if (
      err.message.includes('net::ERR_') ||
      err.message.includes('NS_ERROR_')
    ) {
      return `Navigation error: ${err.message.split('\n')[0]}`;
    }
    return err.message.split('\n')[0] ?? 'Unknown error';
  }
  return String(err);
}
