/**
 * Which cookies log you in on well-known sites, so the user pastes only
 * values. `derive` fills companion cookies that are copies or constants.
 * Client-safe (used by the login form).
 */

import { parseCopiedRequest } from './copiedRequest';

export interface CookieField {
  name: string;
  hint: string;
}

export interface CookiePreset {
  site: string;
  hosts: string[];
  fields: CookieField[];
  /** Extra cookies computed from the entered values. */
  derive?: (values: Record<string, string>) => Record<string, string>;
  note?: string;
}

export const COOKIE_PRESETS: CookiePreset[] = [
  {
    site: 'GitHub',
    hosts: ['github.com'],
    fields: [{ name: 'user_session', hint: 'Application → Cookies → https://github.com → user_session' }],
    // GitHub checks a same-site copy of the session on some requests; it carries the same value.
    derive: (v): Record<string, string> =>
      v.user_session ? { '__Host-user_session_same_site': v.user_session, logged_in: 'yes' } : {},
    note: 'Only user_session is needed — the same-site copy and logged_in are added for you.',
  },
  {
    site: 'GitLab',
    hosts: ['gitlab.com'],
    fields: [{ name: '_gitlab_session', hint: 'Application → Cookies → https://gitlab.com → _gitlab_session' }],
  },
  {
    site: 'Notion',
    hosts: ['notion.so', 'www.notion.so'],
    fields: [{ name: 'token_v2', hint: 'Application → Cookies → https://www.notion.so → token_v2' }],
  },
];

export function presetFor(siteUrl: string): CookiePreset | undefined {
  let host = '';
  try {
    host = new URL(/^https?:\/\//i.test(siteUrl.trim()) ? siteUrl.trim() : `https://${siteUrl.trim()}`).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  return COOKIE_PRESETS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
}

/**
 * Forgiving value clean-up: accepts `abc`, `"abc"`, or `name=abc` pasted
 * into the value box for `name`.
 */
export function cleanCookieValue(name: string, raw: string): string {
  let v = raw.trim();
  if (name && v.startsWith(`${name}=`)) v = v.slice(name.length + 1);
  v = v.replace(/;$/, '').trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

export interface CookieRow {
  name: string;
  value: string;
}

/** Rows (+ preset-derived cookies) -> Cookie header string. */
export function rowsToCookieHeader(rows: CookieRow[], preset?: CookiePreset): string {
  const values: Record<string, string> = {};
  for (const r of rows) {
    const name = r.name.trim();
    const value = cleanCookieValue(name, r.value);
    if (name && value) values[name] = value;
  }
  const all = { ...(preset?.derive?.(values) ?? {}), ...values };
  return Object.entries(all)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

// ---------------------------------------------------------------------------
// Recognising cookies in a pasted set (so users don't need to know names)
// ---------------------------------------------------------------------------

export type CookieKind = 'login' | 'analytics' | 'other';

/** Session/auth cookies of common frameworks and generic naming. */
const LOGIN_PATTERNS = [
  /^\.aspnetcore\.(identity|cookies|session)/i, // ASP.NET Core
  /^\.aspxauth$/i, /^asp\.net_sessionid$/i, // ASP.NET (classic)
  /^phpsessid$/i, // PHP
  /^laravel_session$/i, // Laravel
  /^sessionid$/i, // Django
  /^_[a-z0-9_]+_session$/i, // Rails
  /^connect\.sid$/i, // Express
  /^jsessionid$/i, // Java
  /^wordpress_logged_in_/i, /^wp-settings-/i, // WordPress
  /^(__secure-|__host-)?(next-auth|authjs)\.session-token$/i, // NextAuth / Auth.js
  /^user_session$/i, /^_gitlab_session$/i, /^token_v2$/i,
  /session|auth|token|identity|logged.?in|jwt|^sid$|_sid$/i, // generic (not "RememberMe"-style flags)
];

const ANALYTICS_PATTERNS = [
  /^_ga/i, /^_gid$/i, /^_gat/i, /^_gcl/i, /^_fbp$/i, /^_fbc$/i, /^_clck$/i, /^_clsk$/i, /^_hj/i, /^_uet/i,
  /^ajs_/i, /^amplitude/i, /^mp_/i, /^intercom-/i, /^__hs/i, /^hubspotutk$/i, /^_pk_/i, /^cfz_/i, /^_tt_/i, /^_ttp$/i,
  /^li_/i, /^bcookie$/i, /^sparrow_id$/i, /^kndctr_/i, /^AMCV_/i, /^s_(cc|sq|fid)$/i, /^optimizely/i, /^__cf_bm$/i,
];

export function classifyCookie(name: string): CookieKind {
  if (ANALYTICS_PATTERNS.some((p) => p.test(name))) return 'analytics';
  if (LOGIN_PATTERNS.some((p) => p.test(name))) return 'login';
  return 'other';
}

/** Cookie names (and whether each has a value) from any supported paste format. */
export function pastedCookieNames(text: string): { name: string; empty: boolean }[] {
  const copied = parseCopiedRequest(text);
  const t = (copied ? copied.cookie : text).trim();
  if (!t) return [];
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      const data = JSON.parse(t);
      return (Array.isArray(data) ? data : [data])
        .filter((c) => c && typeof c.name === 'string')
        .map((c) => ({ name: c.name as string, empty: !String(c.value ?? '') }));
    } catch {
      return [];
    }
  }
  const lines = t.split(/\r?\n/);
  if (/^# (Netscape )?HTTP Cookie File/i.test(t) || lines.some((l) => l.split('\t').length === 7)) {
    return lines
      .map((l) => l.split('\t'))
      .filter((f) => f.length === 7 && f[5])
      .map((f) => ({ name: f[5], empty: !f[6] }));
  }
  return t
    .replace(/^cookie:\s*/i, '')
    .split(/;|\n/)
    .map((p) => p.trim())
    .filter((p) => p.includes('='))
    .map((p) => ({ name: p.slice(0, p.indexOf('=')).trim(), empty: !p.slice(p.indexOf('=') + 1).trim() }))
    .filter((c) => c.name);
}
