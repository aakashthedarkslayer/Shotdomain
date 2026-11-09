/**
 * Which cookies log you in on well-known sites, so the user pastes only
 * values. `derive` fills companion cookies that are copies or constants.
 * Client-safe (used by the login form).
 */

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
