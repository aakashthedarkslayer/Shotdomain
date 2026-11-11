'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Controls';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { CookieGuide } from './CookieGuide';
import type { SiteAuth } from '@/lib/captureOptions';
import { normalizeUrl } from '@/lib/url';
import { classifyCookie, pastedCookieNames, presetFor, rowsToCookieHeader } from '@/lib/cookiePresets';
import type { CookiePreset, CookieRow } from '@/lib/cookiePresets';
import { FORMAT_LABEL, mergeHeaderLines, parseCopiedRequest } from '@/lib/copiedRequest';
import type { CopiedRequest } from '@/lib/copiedRequest';

interface TestResult {
  ok: boolean;
  error?: string;
  warning?: string;
  finalUrl?: string;
  title?: string;
  image?: string;
  cookieCount?: number;
  cookiesExpireAt?: number;
}

/** "Show me how" button + animated guide in a dialog. */
function CookieHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-strong"
      >
        <span className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white">
          <Icon name="play" size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-fg">Show me how to copy my login</span>
          <span className="block text-xs text-muted">A 20-second animated guide — no technical knowledge needed</span>
        </span>
        <Icon name="arrowRight" size={14} className="text-muted transition group-hover:translate-x-0.5" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="How to copy your session cookies" description="Works in Chrome, Edge, Brave and other Chromium browsers.">
        <div className="space-y-4 p-5">
          <CookieGuide />
          <CookieTextHelp />
        </div>
      </Modal>
    </>
  );
}

function CookieTextHelp() {
  return (
    <details className="group rounded-lg border border-line bg-subtle/50 text-[13px]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-medium text-fg [&::-webkit-details-marker]:hidden">
        <Icon name="info" size={14} className="text-accent" />
        Prefer text? Step-by-step instructions
        <Icon name="chevronDown" size={14} className="ml-auto text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-line px-3 py-3 text-muted">
        <div>
          <p className="font-medium text-fg">Option A — Copy as cURL (easiest, copies everything)</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            <li>Log in to the site in Chrome or Edge as you normally would.</li>
            <li>
              Open DevTools (<b>Ctrl+Shift+I</b>, or right-click → <b>Inspect</b>) → <b>Network</b> tab → <b>Doc</b> filter → press <b>F5</b>{' '}
              to reload.
            </li>
            <li>
              Right-click the page request → <b>Copy</b> → <b>Copy as cURL</b> (on Windows either “cmd” or “bash” works).
            </li>
            <li>Paste the whole thing into the box. ShotDomain keeps only the cookies and login headers.</li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-fg">Option B — copy one cookie from the Application tab</p>
          <p className="mt-1">
            DevTools → <b>Application</b> (under <b>»</b> if hidden) → <b>Storage → Cookies</b> → the site’s address. Double-click the{' '}
            <b>Value</b> of the login cookie, copy it, and enter its name and value.
          </p>
        </div>
        <div>
          <p className="font-medium text-fg">Option C — with a cookie extension</p>
          <p className="mt-1">
            Use an extension such as Cookie-Editor (Export → JSON) or “Get cookies.txt”, and paste the export below. Both formats work.
          </p>
        </div>
        <p>
          Some web apps keep the login token in <b>Local Storage</b> instead of cookies (DevTools → Application → Local Storage). Add those
          entries under “Token in browser storage”.
        </p>
      </div>
    </details>
  );
}

/** What was found in the pasted cookies: likely login cookies vs. analytics noise. */
function PastedCookieSummary({ text }: { text: string }) {
  const names = pastedCookieNames(text);
  if (names.length === 0) return null;
  const login = names.filter((c) => classifyCookie(c.name) === 'login' && !c.empty);
  const analytics = names.filter((c) => classifyCookie(c.name) === 'analytics');
  const other = names.filter((c) => !login.includes(c) && !analytics.includes(c));
  const chip = (c: { name: string }, tone: string) => (
    <span key={c.name} className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${tone}`}>
      {c.name}
    </span>
  );
  return (
    <div className="space-y-2 rounded-xl border border-line bg-subtle/60 px-3 py-2.5 text-[13px]">
      <div className="text-fg">
        Found <b>{names.length}</b> {names.length === 1 ? 'cookie' : 'cookies'} — all of them are sent, like your browser does.
      </div>
      {login.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-success">Likely login:</span>
          {login.map((c) => chip(c, 'bg-success-soft text-success'))}
        </div>
      ) : (
        <div className="text-warning">No obvious login cookie — if Test login fails, make sure you copied them while logged in.</div>
      )}
      {other.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="text-muted">Other:</span>{other.map((c) => chip(c, 'bg-subtle text-muted'))}</div>}
      {analytics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-faint">Analytics (not needed, harmless):</span>
          {analytics.map((c) => chip(c, 'text-faint line-through decoration-faint/50'))}
        </div>
      )}
    </div>
  );
}

/** Registrable-ish domain (last two labels) for a loose "same site" check. */
function baseDomain(host: string): string {
  return host.toLowerCase().split('.').slice(-2).join('.');
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

/** What we kept from a pasted request (and a heads-up when it's for another site or has no cookies). */
function CopiedRequestNote({ req, siteUrl }: { req: CopiedRequest; siteUrl: string }) {
  const label = FORMAT_LABEL[req.format];
  const cookieCount = pastedCookieNames(req.cookie).length;
  const headerNames = Object.keys(req.headers);
  const target = req.url ? hostOf(req.url) : undefined;
  const site = siteUrl.trim() ? hostOf(normalizeUrl(siteUrl)) : undefined;
  const otherSite = target && site && baseDomain(target) !== baseDomain(site);

  if (!req.cookie && headerNames.length === 0) {
    return (
      <Alert tone="warning">
        That copied {label} has no cookies in it.{' '}
        {req.format === 'fetch'
          ? 'Chrome leaves cookies out of “Copy as fetch” — use Copy → Copy as cURL instead.'
          : 'Copy it while you’re logged in, from the page request (Network → Doc filter).'}
      </Alert>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-[13px] text-success">
        <Icon name="check" size={15} className="mt-px shrink-0" />
        <span>
          Read your copied {label}
          {target ? (
            <>
              {' '}
              for <b className="font-semibold">{target}</b>
            </>
          ) : null}
          . Kept {cookieCount} {cookieCount === 1 ? 'cookie' : 'cookies'}
          {headerNames.length > 0 && (
            <>
              {' '}
              and the <span className="font-mono">{headerNames.join(', ')}</span> {headerNames.length === 1 ? 'header' : 'headers'} (under Custom
              headers)
            </>
          )}
          .
          {req.ignored > 0 && (
            <span className="text-muted">
              {' '}
              Left out {req.ignored} browser {req.ignored === 1 ? 'header' : 'headers'} such as User-Agent — they aren’t needed to log in.
            </span>
          )}
        </span>
      </div>
      {otherSite && (
        <Alert tone="warning">
          This request went to <span className="font-mono">{target}</span>, not <span className="font-mono">{site}</span>. Copy the request for the
          page itself (Network → <b>Doc</b> filter) so the cookies belong to this site.
        </Alert>
      )}
    </div>
  );
}

function defaultRows(preset?: CookiePreset): CookieRow[] {
  return preset ? preset.fields.map((f) => ({ name: f.name, value: '' })) : [{ name: '', value: '' }];
}

/**
 * Cookies as name/value fields (only paste values; known sites pre-name the
 * cookies that matter), or one box for a Cookie header / JSON / cookies.txt.
 */
function CookieInput({
  siteUrl,
  auth,
  set,
  onHeadersAdded,
}: {
  siteUrl: string;
  auth: SiteAuth;
  set: (p: Partial<SiteAuth>) => void;
  onHeadersAdded: () => void;
}) {
  const preset = presetFor(siteUrl);
  // Known sites: one named field. Others: paste everything — no need to know which cookie logs you in.
  const mode = auth.cookieInput ?? (preset ? 'fields' : 'paste');
  const presetNames = new Set(preset?.fields.map((f) => f.name) ?? []);
  // Keep the user's rows once they've typed something; otherwise follow the site's preset.
  const rows = auth.cookieRows?.some((r) => r.value.trim() || r.name.trim()) ? auth.cookieRows : defaultRows(preset);

  // The last request the user pasted (Copy as cURL, ...), for the "here's what we kept" note.
  const [copied, setCopied] = useState<CopiedRequest | null>(null);

  /**
   * A whole copied request pasted anywhere: keep its cookies and login headers,
   * drop the rest, and show the paste box with the result. Returns false for plain text.
   */
  const takeCopiedRequest = (text: string): boolean => {
    const req = parseCopiedRequest(text);
    if (!req) return false;
    setCopied(req);
    const hasHeaders = Object.keys(req.headers).length > 0;
    if (!req.cookie && !hasHeaders) {
      set({ cookieInput: 'paste', cookies: text }); // nothing usable — keep it visible next to the warning
      return true;
    }
    set({ cookieInput: 'paste', cookies: req.cookie, ...(hasHeaders ? { headers: mergeHeaderLines(auth.headers ?? '', req.headers) } : {}) });
    if (hasHeaders) onHeadersAdded();
    return true;
  };

  const updateRows = (next: CookieRow[]) => set({ cookieRows: next, cookies: rowsToCookieHeader(next, preset) });
  const setRow = (i: number, patch: Partial<CookieRow>) => {
    if (patch.value !== undefined && takeCopiedRequest(patch.value)) return;
    updateRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  if (mode === 'paste') {
    return (
      <div className="space-y-2">
        <Field
          label="Your copied request or cookies"
          htmlFor="auth-cookies"
          hint="Easiest: DevTools → Network → right-click the page request → Copy → Copy as cURL, and paste it here. A Cookie header, JSON export or cookies.txt also work."
        >
          <Textarea
            id="auth-cookies"
            rows={4}
            spellCheck={false}
            placeholder={"curl 'https://yoursite.com/dashboard' -H 'cookie: session_id=…' …\n— or —\nsession_id=abc123; csrftoken=xyz"}
            value={auth.cookies ?? ''}
            onChange={(e) => {
              if (!takeCopiedRequest(e.target.value)) {
                setCopied(null);
                set({ cookies: e.target.value });
              }
            }}
          />
        </Field>
        {copied && <CopiedRequestNote req={copied} siteUrl={siteUrl} />}
        <PastedCookieSummary text={auth.cookies ?? ''} />
        <button type="button" onClick={() => set({ cookieInput: 'fields', cookies: rowsToCookieHeader(rows, preset) })} className="cursor-pointer text-[13px] font-medium text-accent hover:underline">
          {preset ? 'Enter cookie values one by one instead' : 'Copied one cookie from the Application tab? Enter its name and value'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-fg">{preset ? `${preset.site} session cookie` : 'Session cookies'}</span>
        <button type="button" onClick={() => set({ cookieInput: 'paste' })} className="cursor-pointer text-[13px] font-medium text-accent hover:underline">
          Paste a cURL or all cookies at once
        </button>
      </div>
      {rows.map((row, i) => {
        const fixed = presetNames.has(row.name);
        const field = preset?.fields.find((f) => f.name === row.name);
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              {fixed ? (
                <span className="flex h-9 min-w-[9rem] shrink-0 items-center rounded-xl bg-subtle px-3 font-mono text-[13px] text-fg">{row.name}</span>
              ) : (
                <Input aria-label="Cookie name" placeholder="cookie name" value={row.name} onChange={(e) => setRow(i, { name: e.target.value })} className="font-mono text-[13px]" />
              )}
              <span className="text-faint">=</span>
              <Input
                id={i === 0 ? 'auth-cookies' : undefined}
                aria-label={`Value of ${row.name || 'cookie'}`}
                placeholder="paste the value only"
                value={row.value}
                onChange={(e) => setRow(i, { value: e.target.value })}
                className="font-mono text-[13px]"
                spellCheck={false}
                autoComplete="off"
              />
              {!fixed && rows.length > 1 && (
                <button type="button" aria-label="Remove cookie" onClick={() => updateRows(rows.filter((_, j) => j !== i))} className="cursor-pointer rounded-md p-1.5 text-faint hover:bg-subtle hover:text-danger">
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
            {field && <p className="pl-1 text-xs text-muted">{field.hint}</p>}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => updateRows([...rows, { name: '', value: '' }])} className="flex cursor-pointer items-center gap-1 text-[13px] font-medium text-muted hover:text-fg">
          <Icon name="plus" size={14} /> Add another cookie
        </button>
        {preset?.note && <span className="text-xs text-muted">{preset.note}</span>}
      </div>
    </div>
  );
}

/** Login settings for sites that need one. Passwordless session first; passwords are opt-in. */
export function SiteAuthFields({ siteUrl, auth, onChange }: { siteUrl: string; auth: SiteAuth; onChange: (auth: SiteAuth) => void }) {
  const [showSelectors, setShowSelectors] = useState(Boolean(auth.usernameSelector || auth.passwordSelector || auth.submitSelector));
  const [showExtra, setShowExtra] = useState(Boolean(auth.localStorage || auth.headers));
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const set = (partial: Partial<SiteAuth>) => {
    setResult(null);
    onChange({ ...auth, ...partial });
  };
  const method = auth.method === 'none' ? 'cookies' : auth.method;
  const usingPassword = method === 'form' || method === 'basic';

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/site-auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizeUrl(siteUrl), auth: { ...auth, method } }),
      });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, error: 'Could not reach the server.' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      {!usingPassword ? (
        <>
          <div className="flex items-start gap-2.5 rounded-lg bg-accent-soft px-3 py-2.5 text-[13px] text-accent">
            <Icon name="shield" size={16} className="mt-px" />
            <span>
              <b>No password needed.</b> Log in to the site in your own browser and paste your session below. Treat it like a key: it works
              until it expires or you log out, which instantly revokes it. Saved sessions are stored encrypted.
            </span>
          </div>

          <CookieHelp />

          <CookieInput siteUrl={siteUrl} auth={auth} set={set} onHeadersAdded={() => setShowExtra(true)} />

          <button type="button" onClick={() => setShowExtra((v) => !v)} className="flex cursor-pointer items-center gap-1 text-[13px] font-medium text-muted hover:text-fg">
            <Icon name="chevronDown" size={14} className={`transition-transform ${showExtra ? 'rotate-180' : ''}`} />
            Token in browser storage or custom headers
          </button>
          {showExtra && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Token in browser storage" htmlFor="auth-ls" hint="Local Storage entries, as JSON or key=value lines.">
                <Textarea
                  id="auth-ls"
                  rows={3}
                  placeholder={'{"auth_token":"eyJhbGciOi..."}\n— or —\nauth_token=eyJhbGciOi...'}
                  value={auth.localStorage ?? ''}
                  onChange={(e) => set({ localStorage: e.target.value })}
                />
              </Field>
              <Field label="Custom headers" htmlFor="auth-headers" hint="One per line. Sent only to this site’s domain, never to third parties.">
                <Textarea
                  id="auth-headers"
                  rows={3}
                  placeholder={'Authorization: Bearer eyJhbGciOi...'}
                  value={auth.headers ?? ''}
                  onChange={(e) => set({ headers: e.target.value })}
                />
              </Field>
            </div>
          )}

          <button type="button" onClick={() => set({ method: 'form' })} className="cursor-pointer text-[13px] text-faint underline-offset-2 hover:text-muted hover:underline">
            Use a username and password instead
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="Password method"
              value={method}
              onChange={(m) => set({ method: m })}
              options={[
                { value: 'form', label: 'Login form' },
                { value: 'basic', label: 'Basic auth' },
              ]}
            />
            <button type="button" onClick={() => set({ method: 'cookies' })} className="flex cursor-pointer items-center gap-1 text-[13px] font-medium text-accent hover:underline">
              <Icon name="arrowLeft" size={14} /> Back to session login (no password)
            </button>
          </div>
          <Alert tone="warning">
            Your password is stored encrypted and only used to log in, but a session login avoids sharing it at all. Logins with a CAPTCHA, 2FA
            code or SSO pop-up can’t be automated — use a session for those.
          </Alert>

          {method === 'form' && (
            <>
              <Field label="Login page URL" htmlFor="auth-login-url">
                <Input id="auth-login-url" placeholder="https://app.example.com/login" value={auth.loginUrl ?? ''} onChange={(e) => set({ loginUrl: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Username or email" htmlFor="auth-username">
                  <Input id="auth-username" autoComplete="off" value={auth.username ?? ''} onChange={(e) => set({ username: e.target.value })} />
                </Field>
                <Field label="Password" htmlFor="auth-password">
                  <Input id="auth-password" type="password" autoComplete="new-password" value={auth.password ?? ''} onChange={(e) => set({ password: e.target.value })} />
                </Field>
              </div>
              <button type="button" onClick={() => setShowSelectors((v) => !v)} className="cursor-pointer text-[13px] font-medium text-muted hover:text-fg">
                {showSelectors ? 'Hide' : 'Set'} field selectors (if auto-detect fails)
              </button>
              {showSelectors && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Username field" htmlFor="auth-sel-user">
                    <Input id="auth-sel-user" placeholder="#email" value={auth.usernameSelector ?? ''} onChange={(e) => set({ usernameSelector: e.target.value })} />
                  </Field>
                  <Field label="Password field" htmlFor="auth-sel-pass">
                    <Input id="auth-sel-pass" placeholder="#password" value={auth.passwordSelector ?? ''} onChange={(e) => set({ passwordSelector: e.target.value })} />
                  </Field>
                  <Field label="Submit button" htmlFor="auth-sel-submit">
                    <Input id="auth-sel-submit" placeholder="button[type=submit]" value={auth.submitSelector ?? ''} onChange={(e) => set({ submitSelector: e.target.value })} />
                  </Field>
                </div>
              )}
            </>
          )}

          {method === 'basic' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Username" htmlFor="auth-basic-user" hint="For sites behind a browser username/password prompt (common on staging).">
                <Input id="auth-basic-user" autoComplete="off" value={auth.username ?? ''} onChange={(e) => set({ username: e.target.value })} />
              </Field>
              <Field label="Password" htmlFor="auth-basic-pass">
                <Input id="auth-basic-pass" type="password" autoComplete="new-password" value={auth.password ?? ''} onChange={(e) => set({ password: e.target.value })} />
              </Field>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" icon="refresh" isLoading={testing} onClick={test}>
          Test login
        </Button>
        <span className="text-[13px] text-muted">Opens the site with these details and shows you the page.</span>
      </div>

      {result && (
        <div className="space-y-2">
          {result.error ? (
            <Alert tone="danger">{result.error}</Alert>
          ) : (
            <Alert tone={result.ok && !result.warning ? 'success' : 'warning'}>
              {result.warning ?? 'Looks logged in.'} Landed on <span className="font-mono">{result.finalUrl}</span>
              {result.title ? ` — “${result.title}”` : ''}
              {!usingPassword && !!result.cookieCount && (
                <span className="mt-1 block">
                  {result.cookiesExpireAt
                    ? `Your cookies expire on ${new Date(result.cookiesExpireAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} — schedules will need fresh cookies after that.`
                    : 'These are browser-session cookies — they may stop working when the site ends your session.'}
                </span>
              )}
            </Alert>
          )}
          {result.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.image} alt="Page after logging in" className="w-full rounded-lg border border-line" />
          )}
        </div>
      )}
    </div>
  );
}

export default SiteAuthFields;
