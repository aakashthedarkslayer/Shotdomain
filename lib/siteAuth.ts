import type { Browser, BrowserContext, Page } from 'playwright';
import { USER_AGENT } from './browser';
import type { SiteAuth } from './captureOptions';

/**
 * Logging in to sites that need it, with the user's own credentials.
 *
 * Every method boils down to two things the rest of the app can use:
 *   - cookies to put in browser contexts (and in a Cookie header for discovery)
 *   - HTTP basic credentials (httpCredentials / Authorization header)
 *
 * CAPTCHAs, 2FA prompts and bot checks are never worked around: if a login
 * needs one, it fails with a message suggesting the cookie method instead.
 */

export interface PlaywrightCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export class SiteLoginError extends Error {}

const LOGIN_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

function normalizeSameSite(v: unknown): PlaywrightCookie['sameSite'] | undefined {
  const s = String(v ?? '').toLowerCase();
  if (s === 'strict') return 'Strict';
  if (s === 'lax') return 'Lax';
  if (s === 'none' || s === 'no_restriction') return 'None';
  return undefined;
}

/**
 * Accepts either a Cookie header ("a=1; b=2", newlines also fine) copied from
 * DevTools, or a JSON array exported by cookie extensions (Cookie-Editor,
 * EditThisCookie). Cookies without a domain get the target site's host.
 */
export function parseCookieText(text: string, targetUrl: string): PlaywrightCookie[] {
  const host = new URL(targetUrl).hostname;
  const secureSite = targetUrl.startsWith('https:');
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw new SiteLoginError('The cookies look like JSON but could not be parsed.');
    }
    const list = Array.isArray(data) ? data : [data];
    return list
      .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object' && typeof (c as { name?: unknown }).name === 'string')
      .map((c) => {
        const sameSite = normalizeSameSite(c.sameSite);
        const expires = Number(c.expirationDate ?? c.expires);
        return {
          name: String(c.name),
          value: String(c.value ?? ''),
          domain: String(c.domain || host),
          path: String(c.path || '/'),
          ...(Number.isFinite(expires) && expires > 0 ? { expires } : {}),
          httpOnly: Boolean(c.httpOnly),
          secure: c.secure === undefined ? secureSite : Boolean(c.secure),
          ...(sameSite ? { sameSite } : {}),
        };
      });
  }

  // "Cookie:" header format
  return trimmed
    .replace(/^cookie:\s*/i, '')
    .split(/;|\n/)
    .map((part) => part.trim())
    .filter((part) => part.includes('='))
    .map((part) => {
      const i = part.indexOf('=');
      return { name: part.slice(0, i).trim(), value: part.slice(i + 1).trim(), domain: host, path: '/', secure: secureSite };
    })
    .filter((c) => c.name);
}

/** Cookie header value for `url` built from Playwright-style cookies (domain/path matched). */
export function cookieHeaderFor(cookies: PlaywrightCookie[], url: string): string {
  const u = new URL(url);
  const host = u.hostname;
  return cookies
    .filter((c) => {
      const d = c.domain.replace(/^\./, '');
      return (host === d || host.endsWith(`.${d}`)) && u.pathname.startsWith(c.path || '/');
    })
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

// ---------------------------------------------------------------------------
// Login form
// ---------------------------------------------------------------------------

const USERNAME_CANDIDATES = [
  'input[autocomplete="username"]',
  'input[type="email"]',
  'input[name*="email" i]',
  'input[name*="user" i]',
  'input[name*="login" i]',
  'input[id*="email" i]',
  'input[id*="user" i]',
  'input[id*="login" i]',
  'input[type="text"]',
];
const PASSWORD_CANDIDATES = ['input[type="password"]'];
const SUBMIT_CANDIDATES = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Sign in")',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Continue")',
  'button:has-text("Next")',
];
const CHALLENGE_SELECTORS = [
  'iframe[src*="recaptcha"]',
  'iframe[src*="hcaptcha"]',
  'iframe[src*="challenges.cloudflare.com"]',
  '.g-recaptcha',
  '.h-captcha',
  '.cf-turnstile',
  'input[autocomplete="one-time-code"]',
];

async function firstVisible(page: Page, selectors: string[]) {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) return el;
  }
  return null;
}

async function submit(page: Page, submitSelector?: string) {
  const button = submitSelector ? page.locator(submitSelector).first() : await firstVisible(page, SUBMIT_CANDIDATES);
  if (button) await button.click({ timeout: 5_000 });
  else await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

async function hasChallenge(page: Page) {
  return (await firstVisible(page, CHALLENGE_SELECTORS)) !== null;
}

/**
 * Fill and submit a login form in a fresh browser context and return the
 * session cookies it produced. Handles one-page and two-step (email, then
 * password) forms.
 */
async function loginWithForm(browser: Browser, auth: SiteAuth): Promise<PlaywrightCookie[]> {
  const context = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    try {
      await page.goto(auth.loginUrl!, { waitUntil: 'networkidle', timeout: LOGIN_TIMEOUT_MS });
    } catch {
      await page.goto(auth.loginUrl!, { waitUntil: 'load', timeout: 15_000 });
    }

    if (await hasChallenge(page)) {
      throw new SiteLoginError(
        'The login page shows a CAPTCHA or bot check, which ShotDomain does not bypass. Use the Cookies method instead.',
      );
    }

    const userField = auth.usernameSelector
      ? page.locator(auth.usernameSelector).first()
      : await firstVisible(page, USERNAME_CANDIDATES);
    if (!userField) throw new SiteLoginError('Could not find a username/email field on the login page. Set its selector manually.');
    await userField.fill(auth.username ?? '', { timeout: 5_000 });

    let passField = auth.passwordSelector
      ? page.locator(auth.passwordSelector).first()
      : await firstVisible(page, PASSWORD_CANDIDATES);

    // Two-step forms: submit the username first, then the password appears.
    if (!passField || !(await passField.isVisible().catch(() => false))) {
      await submit(page, auth.submitSelector);
      passField = auth.passwordSelector
        ? page.locator(auth.passwordSelector).first()
        : await firstVisible(page, PASSWORD_CANDIDATES);
      if (!passField) {
        if (await hasChallenge(page)) {
          throw new SiteLoginError('The site asked for a CAPTCHA or verification code, which ShotDomain does not bypass. Use the Cookies method instead.');
        }
        throw new SiteLoginError('Could not find a password field. Set the selectors manually, or use the Cookies method.');
      }
    }
    await passField.fill(auth.password ?? '', { timeout: 5_000 });
    await submit(page, auth.submitSelector);

    if (await hasChallenge(page)) {
      throw new SiteLoginError('The site asked for a CAPTCHA or verification code after login, which ShotDomain does not bypass. Use the Cookies method instead.');
    }
    if (await page.locator('input[type="password"]').first().isVisible().catch(() => false)) {
      throw new SiteLoginError('Login did not complete — the password field is still showing. Check the username and password.');
    }

    return (await context.cookies()) as PlaywrightCookie[];
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ResolvedAuth {
  cookies: PlaywrightCookie[];
  httpCredentials?: { username: string; password: string };
}

/** Turn the user's login settings into cookies/credentials. Throws SiteLoginError on failure. */
export async function resolveSiteAuth(
  browser: Browser | (() => Promise<Browser>),
  auth: SiteAuth | undefined,
  targetUrl: string,
): Promise<ResolvedAuth> {
  switch (auth?.method) {
    case 'cookies': {
      const cookies = parseCookieText(auth.cookies ?? '', targetUrl);
      if (cookies.length === 0) throw new SiteLoginError('No cookies found. Paste a Cookie header or a JSON cookie export.');
      return { cookies };
    }
    case 'basic':
      return { cookies: [], httpCredentials: { username: auth.username ?? '', password: auth.password ?? '' } };
    case 'form': {
      const b = typeof browser === 'function' ? await browser() : browser;
      return { cookies: await loginWithForm(b, auth) };
    }
    default:
      return { cookies: [] };
  }
}

/** Apply resolved auth to a new browser context. */
export async function applyAuthToContext(context: BrowserContext, resolved: ResolvedAuth | undefined) {
  if (resolved?.cookies.length) await context.addCookies(resolved.cookies);
}

/** Headers for plain fetch() during discovery (sitemap/crawl). */
export function authHeadersFor(resolved: ResolvedAuth | undefined, url: string): Record<string, string> {
  if (!resolved) return {};
  const headers: Record<string, string> = {};
  const cookie = cookieHeaderFor(resolved.cookies, url);
  if (cookie) headers.Cookie = cookie;
  if (resolved.httpCredentials) {
    const { username, password } = resolved.httpCredentials;
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }
  return headers;
}
