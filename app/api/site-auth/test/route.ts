import { NextRequest } from 'next/server';
import { getBrowser, USER_AGENT } from '@/lib/browser';
import { sanitizeAuth } from '@/lib/captureOptions';
import { SiteLoginError, applyAuthToContext, earliestExpiry, resolveSiteAuth } from '@/lib/siteAuth';
import { isValidUrl, normalizeUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

/**
 * "Test login": log in with the given settings, open the target page and
 * return a small preview so the user can see whether they're logged in.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const url = normalizeUrl(String(body.url ?? ''));
  const auth = sanitizeAuth(body.auth);
  if (!isValidUrl(url)) return Response.json({ ok: false, error: 'Enter a valid website URL first.' }, { status: 400 });
  if (!auth) return Response.json({ ok: false, error: 'Fill in the login details first.' }, { status: 400 });

  const browser = await getBrowser();
  let context;
  try {
    const resolved = await resolveSiteAuth(browser, auth, url);
    context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      httpCredentials: resolved.httpCredentials,
    });
    await applyAuthToContext(context, resolved);
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => null);
    const status = response?.status();
    const image = await page.screenshot({ type: 'jpeg', quality: 60 });
    const stillOnLogin = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
    return Response.json({
      ok: status !== 401 && status !== 403 && !stillOnLogin,
      status,
      finalUrl: page.url(),
      title: await page.title(),
      cookieCount: resolved.cookies.length,
      cookiesExpireAt: earliestExpiry(resolved.cookies),
      warning: stillOnLogin
        ? 'The page still shows a password field — you may not be logged in.'
        : status === 401 || status === 403
          ? `The site answered ${status} (not authorized).`
          : undefined,
      image: `data:image/jpeg;base64,${image.toString('base64')}`,
    });
  } catch (err) {
    const message = err instanceof SiteLoginError ? err.message : `Login test failed: ${err instanceof Error ? err.message : String(err)}`;
    return Response.json({ ok: false, error: message });
  } finally {
    await context?.close();
  }
}
