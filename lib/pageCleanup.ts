import type { Page } from 'playwright';
import type { CleanupOptions } from './captureOptions';

/**
 * Consent-manager containers that cover or overlay pages (OneTrust, Cookiebot,
 * Usercentrics, Didomi, Quantcast, TrustArc, Osano, CookieYes, Complianz,
 * iubenda, HubSpot, Sourcepoint, …) plus common generic names.
 */
const COOKIE_BANNER_SELECTORS = [
  '#onetrust-consent-sdk', '#onetrust-banner-sdk', '.onetrust-pc-dark-filter',
  '#CybotCookiebotDialog', '#CybotCookiebotDialogBodyUnderlay',
  '#usercentrics-root', '#usercentrics-cmp-ui',
  '#didomi-host', '.didomi-popup-backdrop',
  '.qc-cmp2-container', '#qc-cmp2-container',
  '#truste-consent-track', '.truste_overlay', '.truste_box_overlay',
  '.osano-cm-window', '.osano-cm-dialog',
  '.cky-consent-container', '.cky-overlay', '.cky-modal',
  '#cookie-law-info-bar', '.cli-modal-backdrop',
  '.cmplz-cookiebanner', '#cmplz-cookiebanner-container',
  '#iubenda-cs-banner', '.iubenda-cs-container',
  '#hs-eu-cookie-confirmation',
  '[id^="sp_message_container"]',
  '#BorlabsCookieBox', '#cmpbox', '#cmpbox2', '.cmpboxBG',
  '#moove_gdpr_cookie_info_bar', '#gdpr-cookie-message',
  '.fc-consent-root', '.evidon-banner', '#consent_blackbar',
  '.cc-window', '.cc-banner', '#cookie-notice', '#cookie-banner', '.cookie-banner',
  '#cookieConsent', '#cookie-consent', '.cookie-consent', '#cookies-banner',
  '[aria-label="cookieconsent"]',
];

/** Classes consent managers put on <html>/<body> to stop scrolling. */
const SCROLL_LOCK_SELECTORS = [
  'body.ot-overflow-hidden', 'html.didomi-popup-open', 'body.didomi-popup-open',
  'html.sp-message-open', 'body.sp-message-open', 'body.cky-modal-open',
  'body.cmplz-blocked', 'html.cmp-open', 'body.cmp-open',
];

/** "Accept" buttons, tried in order; the first visible one is clicked. */
const COOKIE_ACCEPT_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  '[data-testid="uc-accept-all-button"]',
  '#didomi-notice-agree-button',
  '.qc-cmp2-summary-buttons button[mode="primary"]',
  '#truste-consent-button',
  '.osano-cm-accept-all',
  '.cky-btn-accept',
  '.cmplz-accept',
  '#cookie_action_close_header',
  '#hs-eu-confirmation-button',
  '.cc-allow',
  '.cc-dismiss',
];

function cookieBannerCss(): string {
  return (
    `${COOKIE_BANNER_SELECTORS.join(',\n')} { display: none !important; }\n` +
    `${SCROLL_LOCK_SELECTORS.join(',\n')} { overflow: auto !important; position: static !important; }\n`
  );
}

async function clickFirstVisible(page: Page, selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 2_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

/**
 * Apply cleanup options to a loaded page. Returns a warning string for
 * non-fatal problems (e.g. a click target that wasn't found), or undefined.
 */
export async function applyCleanup(page: Page, cleanup?: CleanupOptions): Promise<string | undefined> {
  if (!cleanup) return undefined;
  const warnings: string[] = [];

  if (cleanup.hideCookieBanners) {
    await clickFirstVisible(page, COOKIE_ACCEPT_SELECTORS);
  }

  for (const sel of cleanup.clickSelectors) {
    try {
      await page.locator(sel).first().click({ timeout: 3_000 });
      await page.waitForTimeout(400);
    } catch {
      warnings.push(`couldn't click “${sel}”`);
    }
  }

  let css = cleanup.hideCookieBanners ? cookieBannerCss() : '';
  for (const sel of cleanup.hideSelectors) css += `${sel} { display: none !important; }\n`;
  if (cleanup.customCss.trim()) css += `${cleanup.customCss}\n`;
  if (css) {
    await page.addStyleTag({ content: css }).catch(() => warnings.push('custom CSS could not be injected'));
    await page.waitForTimeout(100);
  }

  return warnings.length ? `Cleanup: ${warnings.join('; ')}` : undefined;
}
