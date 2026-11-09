'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Controls';
import { Alert } from '@/components/ui/Alert';
import type { AuthMethod, SiteAuth } from '@/lib/captureOptions';
import { normalizeUrl } from '@/lib/url';

interface TestResult {
  ok: boolean;
  error?: string;
  warning?: string;
  finalUrl?: string;
  title?: string;
  image?: string;
}

/** Login settings for sites that need one, with a "Test login" preview. */
export function SiteAuthFields({ siteUrl, auth, onChange }: { siteUrl: string; auth: SiteAuth; onChange: (auth: SiteAuth) => void }) {
  const [showSelectors, setShowSelectors] = useState(Boolean(auth.usernameSelector || auth.passwordSelector || auth.submitSelector));
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const set = (partial: Partial<SiteAuth>) => {
    setResult(null);
    onChange({ ...auth, ...partial });
  };
  const method = auth.method === 'none' ? 'cookies' : auth.method;

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
      <Segmented<Exclude<AuthMethod, 'none'>>
        label="Login method"
        value={method}
        onChange={(m) => set({ method: m })}
        options={[
          { value: 'cookies', label: 'Cookies' },
          { value: 'form', label: 'Login form' },
          { value: 'basic', label: 'Basic auth' },
        ]}
      />

      {method === 'cookies' && (
        <Field
          label="Session cookies"
          htmlFor="auth-cookies"
          hint="Log in to the site in your browser, then paste the Cookie request header from DevTools (Network tab), or a JSON export from a cookie extension. Works with 2FA and SSO logins."
        >
          <Textarea
            id="auth-cookies"
            rows={4}
            placeholder={'session_id=abc123; csrftoken=xyz\n— or —\n[{"name":"session_id","value":"abc123","domain":".example.com"}]'}
            value={auth.cookies ?? ''}
            onChange={(e) => set({ cookies: e.target.value })}
          />
        </Field>
      )}

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
          <p className="text-[13px] text-muted">
            Logins that need a CAPTCHA, 2FA code or SSO pop-up can’t be automated — use the Cookies method for those.
          </p>
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

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" icon="refresh" isLoading={testing} onClick={test}>
          Test login
        </Button>
        <span className="text-[13px] text-muted">Logs in and shows you the first page.</span>
      </div>

      {result && (
        <div className="space-y-2">
          {result.error ? (
            <Alert tone="danger">{result.error}</Alert>
          ) : (
            <Alert tone={result.ok && !result.warning ? 'success' : 'warning'}>
              {result.warning ?? 'Looks logged in.'} Landed on <span className="font-mono">{result.finalUrl}</span>
              {result.title ? ` — “${result.title}”` : ''}
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
