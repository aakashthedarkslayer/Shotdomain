import { chromium } from 'playwright';
import type { Browser } from 'playwright';

/** Honest default User-Agent (see project invariants). */
export const USER_AGENT = 'SiteScreenshotTool/1.0 (+local dev tool)';

// ---------------------------------------------------------------------------
// Browser singleton
// ---------------------------------------------------------------------------

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
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

