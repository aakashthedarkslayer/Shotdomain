/**
 * Extra capture options shared by the client UI and the server:
 * page cleanup (point 1) and site login (point 2 + login-required sites).
 * Safe to import from client components (no Node APIs).
 */

// ---------------------------------------------------------------------------
// Page cleanup
// ---------------------------------------------------------------------------

export interface CleanupOptions {
  /** Hide common cookie/consent banners and click their "Accept" button when present. */
  hideCookieBanners: boolean;
  /** CSS selectors to hide (display:none) before capture. */
  hideSelectors: string[];
  /** CSS selectors to click, in order, before capture. */
  clickSelectors: string[];
  /** Extra CSS injected before capture. */
  customCss: string;
}

export const DEFAULT_CLEANUP: CleanupOptions = {
  hideCookieBanners: true,
  hideSelectors: [],
  clickSelectors: [],
  customCss: '',
};

const MAX_SELECTORS = 30;
const MAX_SELECTOR_LEN = 300;
const MAX_CSS_LEN = 10_000;

function cleanSelectorList(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [];
  return list
    .map((s) => String(s).replace(/[{}]/g, '').trim()) // braces could break out of the CSS rule
    .filter(Boolean)
    .slice(0, MAX_SELECTORS)
    .map((s) => s.slice(0, MAX_SELECTOR_LEN));
}

export function sanitizeCleanup(input: unknown): CleanupOptions | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const o = input as Record<string, unknown>;
  return {
    hideCookieBanners: o.hideCookieBanners !== false,
    hideSelectors: cleanSelectorList(o.hideSelectors),
    clickSelectors: cleanSelectorList(o.clickSelectors),
    customCss: typeof o.customCss === 'string' ? o.customCss.slice(0, MAX_CSS_LEN) : '',
  };
}

/** Text area helpers: one selector per line. */
export const selectorsToText = (list: string[]) => list.join('\n');
export const textToSelectors = (text: string) => cleanSelectorList(text);

// ---------------------------------------------------------------------------
// Site login
// ---------------------------------------------------------------------------

export type AuthMethod = 'none' | 'cookies' | 'basic' | 'form';

export interface SiteAuth {
  method: AuthMethod;
  /**
   * method=cookies ("Session — no password"): any of
   *   - "name=value; name2=value2" (Cookie header), a JSON cookie export, or a cookies.txt file
   */
  cookies?: string;
  /** method=cookies: localStorage entries as JSON {"key":"value"} or "key=value" lines (SPA tokens). */
  localStorage?: string;
  /** method=cookies: extra request headers, one "Name: value" per line (sent only to the site's host). */
  headers?: string;
  /** method=basic and method=form */
  username?: string;
  password?: string;
  /** method=form */
  loginUrl?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
}

/** What a stored schedule keeps instead of the plaintext secrets. */
export interface SealedAuth {
  method: AuthMethod;
  sealed: string;
}

export const NO_AUTH: SiteAuth = { method: 'none' };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);

export function sanitizeAuth(input: unknown): SiteAuth | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const o = input as Record<string, unknown>;
  const method = o.method as AuthMethod;
  switch (method) {
    case 'cookies': {
      const cookies = str(o.cookies, 50_000)?.trim() || undefined;
      const localStorage = str(o.localStorage, 50_000)?.trim() || undefined;
      const headers = str(o.headers, 10_000)?.trim() || undefined;
      return cookies || localStorage || headers ? { method, cookies, localStorage, headers } : undefined;
    }
    case 'basic': {
      const username = str(o.username, 300) ?? '';
      if (!username) return undefined;
      return { method, username, password: str(o.password, 500) ?? '' };
    }
    case 'form': {
      const loginUrl = str(o.loginUrl, 2000)?.trim();
      const username = str(o.username, 300) ?? '';
      if (!loginUrl || !/^https?:\/\//i.test(loginUrl) || !username) return undefined;
      return {
        method,
        loginUrl,
        username,
        password: str(o.password, 500) ?? '',
        usernameSelector: str(o.usernameSelector, 300)?.trim() || undefined,
        passwordSelector: str(o.passwordSelector, 300)?.trim() || undefined,
        submitSelector: str(o.submitSelector, 300)?.trim() || undefined,
      };
    }
    default:
      return undefined;
  }
}

export function describeAuth(auth?: { method: AuthMethod } | null): string {
  switch (auth?.method) {
    case 'cookies':
      return 'Session (no password)';
    case 'basic':
      return 'HTTP basic auth';
    case 'form':
      return 'Login form';
    default:
      return 'No login';
  }
}
