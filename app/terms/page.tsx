import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';
import { PLANS } from '@/lib/plans';

export const metadata = { title: 'Terms of Service — ShotDomain' };

export default function TermsPage() {
  const { product, company } = LEGAL;
  return (
    <LegalPage
      title="Terms of Service"
      current="/terms"
      intro={
        <p>
          These terms are an agreement between you and {company} (“we”, “us”) about your use of {product} at {LEGAL.website} (the
          “Service”). By creating an account or using the Service you accept them. If you use {product} for a company, you accept them on its
          behalf and confirm you’re allowed to.
        </p>
      }
    >
      <h2>1. What {product} does</h2>
      <p>
        {product} finds the pages of a website and takes screenshots of them on the devices you choose, once or on a schedule. You can
        download, share and compare those screenshots. Features and limits depend on your plan; see <Link href="/#pricing">Pricing</Link>.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You sign in with a Google account. You must be at least 18, or the age of majority where you live.</li>
        <li>Keep access to your Google account secure; you’re responsible for activity on your {product} account.</li>
        <li>One person per account. Don’t share an account or create several to get around plan limits.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You’re responsible for the websites you capture and what you do with the screenshots. You agree that you will:</p>
      <ul>
        <li>
          Only capture websites you own, are authorised to capture, or that are publicly available — and respect their terms, copyright and
          other rights.
        </li>
        <li>
          Only use login sessions, cookies, tokens or passwords for accounts that are yours or that you are authorised to use, and only to
          capture what that account can already see.
        </li>
        <li>
          Not use the Service to get around access controls, paywalls, CAPTCHAs, rate limits or bot protection. {product} identifies itself
          honestly, respects <code>robots.txt</code> and doesn’t defeat a site’s protections; if a site blocks it, the capture fails.
        </li>
        <li>Not overload, attack or disrupt any website, including ours, or try to access other users’ data.</li>
        <li>Not capture or share content that is illegal, or use screenshots to deceive, harass, infringe or violate anyone’s privacy.</li>
        <li>Not resell or sublicense the Service, or scrape or reverse-engineer it, without our written permission.</li>
      </ul>
      <p>We may suspend captures, schedules or accounts that break these rules or put the Service or other people at risk.</p>

      <h2>4. Your content</h2>
      <p>
        The screenshots, URLs and settings you create are yours (subject to the rights of the websites shown in them). You give us
        permission to store and process them only to run the Service for you — for example to keep your history, run your schedules,
        send your emails and serve the share links you create. Anyone with a share link you turn on can view what it shares, until you turn
        it off.
      </p>

      <h2>5. Plans, payments and renewals</h2>
      <ul>
        <li>
          <b>Our reseller.</b> Payments are processed by Paddle.com, our online reseller and Merchant of Record. Paddle handles checkout,
          taxes, invoices and refunds, and your purchase is also subject to{' '}
          <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noreferrer">
            Paddle’s Buyer Terms
          </a>
          .
        </li>
        <li>
          <b>Subscriptions</b> ({PLANS.studio.name} and {PLANS.agency.name}) renew automatically each month or year until you cancel. Prices
          are shown in USD; applicable taxes are added at checkout.
        </li>
        <li>
          <b>Cancelling.</b> You can cancel any time from Plan &amp; billing. Your plan stays active until the end of the period you’ve paid
          for, then your account moves to Free.
        </li>
        <li>
          <b>Changing plans.</b> Upgrades and downgrades take effect immediately and are prorated.
        </li>
        <li>
          <b>{PLANS.lifetime.name}</b> is a one-time payment for {PLANS.studio.name}-level access for as long as we operate {product}. It
          includes the limits shown at purchase and future updates to those features; it does not include features of higher plans.
        </li>
        <li>
          <b>Refunds</b> are covered by our <Link href="/refunds">Refund Policy</Link>.
        </li>
        <li>
          <b>Price changes</b> apply from your next renewal, and we’ll tell you at least 30 days in advance.
        </li>
        <li>
          <b>Fair use.</b> Plan limits exist so the Service stays fast for everyone. If usage is abusive (for example, automated account
          creation), we may limit it.
        </li>
      </ul>

      <h2>6. Free plan and changes to the Service</h2>
      <p>
        We may change, add or remove features, and change Free plan limits, at any time. If we make a change that significantly reduces
        what a paid plan includes during a period you’ve paid for, you can cancel and ask for a prorated refund of that period.
      </p>

      <h2>7. Availability and data</h2>
      <p>
        We work to keep the Service available and your data safe, but we don’t guarantee uninterrupted service, that every page can be
        captured, or that screenshots are retained beyond your plan’s limits (older captures and runs are removed automatically). Keep
        your own copies of anything important — you can download every capture as a ZIP.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        The Service is provided “as is” and “as available”. To the extent the law allows, we disclaim all warranties, express or implied,
        including fitness for a particular purpose and non-infringement. Screenshots show websites as they rendered for our servers at
        that moment and may differ from what other visitors see.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent the law allows, we aren’t liable for indirect, incidental, special or consequential damages, or for lost profits,
        revenue or data. Our total liability for any claim relating to the Service is limited to the amount you paid us in the 12 months
        before the claim. Nothing in these terms limits liability that can’t be limited by law, or your rights as a consumer under the
        law where you live.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        If someone makes a claim against us because of websites you captured, credentials you supplied or how you used screenshots in
        breach of these terms, you’ll cover the reasonable costs of that claim.
      </p>

      <h2>11. Ending your account</h2>
      <p>
        You can stop using {product} at any time and ask us to delete your account by email. We may suspend or end accounts that break
        these terms; where reasonable we’ll tell you first. If we close the Service entirely, we’ll give at least 30 days’ notice so you can
        download your captures, and refund unused prepaid subscription time.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms. For significant changes we’ll notify you by email or in the app before they take effect. Continuing to
        use the Service afterwards means you accept the updated terms.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These terms are governed by the laws of {LEGAL.governingLaw}, and the courts of {LEGAL.courts} have jurisdiction, without limiting
        any mandatory consumer protections in the country where you live.
      </p>
    </LegalPage>
  );
}
