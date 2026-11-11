import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata = { title: 'Privacy Policy — ShotDomain' };

export default function PrivacyPage() {
  const { product, company } = LEGAL;
  return (
    <LegalPage
      title="Privacy Policy"
      current="/privacy"
      intro={
        <p>
          This policy explains what personal data {company} (“we”) collects when you use {product}, why, and the choices you have. We
          collect as little as we can: no advertising, no tracking pixels, no analytics cookies, and we never sell your data.
        </p>
      }
    >
      <h2>1. What we collect</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>Google account basics</b>: name, email address, profile picture
            </td>
            <td>To sign you in and show your account. We don’t get your Google password or access to your Google data.</td>
          </tr>
          <tr>
            <td>
              <b>Profile details</b> you add: display name, company
            </td>
            <td>Shown in your account.</td>
          </tr>
          <tr>
            <td>
              <b>What you capture</b>: website addresses, settings, screenshots, schedules, change comparisons, share links
            </td>
            <td>To provide the Service: your history, scheduled runs, downloads and the share links you turn on.</td>
          </tr>
          <tr>
            <td>
              <b>Website logins you provide</b>: session cookies, tokens, headers, or a username and password for a site you capture
            </td>
            <td>
              Only to load that site as you while capturing. For one-off captures they’re kept in server memory for the job (cleared within
              about an hour). For schedules they’re stored encrypted (AES-256-GCM) and used only for that schedule’s runs; deleting the
              schedule deletes them. We never use them for anything else.
            </td>
          </tr>
          <tr>
            <td>
              <b>Email addresses</b> you add as schedule recipients
            </td>
            <td>To send the run summaries and change alerts you asked for.</td>
          </tr>
          <tr>
            <td>
              <b>Billing records</b>: your Paddle customer ID, plan, subscription status and renewal dates
            </td>
            <td>
              To give you the features you paid for. Paddle, our reseller, collects your payment details; we never see or store your card
              number.
            </td>
          </tr>
          <tr>
            <td>
              <b>Technical logs</b>: IP address, browser, pages requested, errors
            </td>
            <td>To keep the Service secure and working, and to investigate abuse. Kept for up to 30 days.</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Legal bases (EU/UK users)</h2>
      <ul>
        <li>
          <b>Contract</b>: running your account, captures, schedules, emails and billing.
        </li>
        <li>
          <b>Legitimate interests</b>: security, preventing abuse, and improving the Service, balanced against your rights.
        </li>
        <li>
          <b>Legal obligation</b>: keeping records we’re required to keep.
        </li>
      </ul>

      <h2>3. Cookies</h2>
      <p>
        We use only essential cookies: a sign-in session cookie (and short-lived security cookies during sign-in) that keep you logged in.
        There are no analytics or advertising cookies, so we don’t show a cookie banner. Paddle’s checkout may set its own cookies when you
        pay; see{' '}
        <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noreferrer">
          Paddle’s privacy notice
        </a>
        .
      </p>

      <h2>4. Who we share data with</h2>
      <p>We share personal data only with service providers that help us run {product}, under contracts that protect it:</p>
      <ul>
        <li>
          <b>Google</b> — sign-in.
        </li>
        <li>
          <b>Paddle</b> — payments, taxes, invoices and refunds, as Merchant of Record. Paddle is an independent controller of the payment
          data it collects.
        </li>
        <li>
          <b>Our hosting provider</b> — servers and storage where the Service and your captures live.
        </li>
        <li>
          <b>Our email provider</b> — delivering schedule emails.
        </li>
      </ul>
      <p>
        Share links you turn on are visible to anyone who has the link. We may disclose data if the law requires it, or to protect the
        rights and safety of our users or others. If {product} is sold or merged, data would transfer under this policy.
      </p>
      <p>
        When {product} captures a website, that website sees a visit from our servers (not from you), identified by our own user agent.
      </p>

      <h2>5. International transfers</h2>
      <p>
        Our providers may process data outside your country. Where required, transfers are protected by safeguards such as the EU
        Standard Contractual Clauses.
      </p>

      <h2>6. How long we keep data</h2>
      <ul>
        <li>Capture history and schedule runs: up to your plan’s limits — older items are deleted automatically.</li>
        <li>Account and profile: until you ask us to delete your account.</li>
        <li>Billing records: as long as tax and accounting laws require (Paddle keeps its own records).</li>
        <li>Technical logs: up to 30 days.</li>
      </ul>
      <p>When you delete a capture, schedule or share link, it’s removed from our servers; backups expire within 30 days.</p>

      <h2>7. Security</h2>
      <p>
        Connections use HTTPS, website logins saved with schedules are encrypted at rest, share links use long random tokens and can be
        turned off at any time, and each account can only access its own data. No system is perfectly secure; if a breach affects your
        data we’ll notify you and the authorities as the law requires.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on where you live (for example under the GDPR, UK GDPR, or India’s Digital Personal Data Protection Act, 2023) you can
        ask to access, correct, download or delete your data, object to or restrict some processing, and withdraw consent. Email us from
        your account address and we’ll respond within 30 days. You can also complain to your local data protection authority.
      </p>
      <p>
        You can do much of this yourself: edit your profile, delete captures and schedules, and turn off share links from your{' '}
        <Link href="/profile">profile</Link> and <Link href="/schedules">schedules</Link>.
      </p>

      <h2>9. Children</h2>
      <p>{product} isn’t meant for anyone under 18, and we don’t knowingly collect their data.</p>

      <h2>10. Changes</h2>
      <p>We’ll post updates here and, for significant changes, tell you by email or in the app.</p>
    </LegalPage>
  );
}
