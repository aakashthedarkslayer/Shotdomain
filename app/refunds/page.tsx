import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';
import { PLANS } from '@/lib/plans';

export const metadata = { title: 'Refund Policy — ShotDomain' };

export default function RefundsPage() {
  const { product, refundDays: days } = LEGAL;
  return (
    <LegalPage
      title="Refund Policy"
      current="/refunds"
      intro={
        <p>
          We want you to be happy with {product}. If it isn’t right for you, you can get your money back within <b>{days} days</b> of any
          payment — no questions asked.
        </p>
      }
    >
      <h2>{days}-day money-back guarantee</h2>
      <ul>
        <li>
          <b>
            {PLANS.studio.name} and {PLANS.agency.name}, monthly or yearly
          </b>
          : full refund of any payment — the first one or a renewal — if you ask within {days} days of being charged.
        </li>
        <li>
          <b>{PLANS.lifetime.name}</b>: full refund if you ask within {days} days of purchase.
        </li>
        <li>
          <b>Plan changes</b>: if you upgrade, the prorated amount charged for the upgrade is refundable within {days} days as well.
        </li>
      </ul>
      <p>
        After {days} days, payments aren’t refundable, except where the law requires otherwise or as described in our{' '}
        <Link href="/terms">Terms</Link> (for example if we close the Service).
      </p>

      <h2>How to ask for a refund</h2>
      <ol>
        <li>
          Reply to your Paddle receipt email, or find your order at{' '}
          <a href="https://paddle.net" target="_blank" rel="noreferrer">
            paddle.net
          </a>{' '}
          and request a refund there; <b>or</b>
        </li>
        <li>
          Email us at <a href={`mailto:${LEGAL.email.replace(/^\[|\]$/g, '')}`}>{LEGAL.email}</a> from your account’s email address, with
          the date of the payment.
        </li>
      </ol>
      <p>
        Payments are processed by Paddle, our reseller and Merchant of Record, so refunds are issued by Paddle to your original payment
        method. They usually arrive within 5–10 business days, depending on your bank.
      </p>

      <h2>What happens to your account</h2>
      <ul>
        <li>A refunded subscription is cancelled, and your account moves to the Free plan straight away.</li>
        <li>A refunded {PLANS.lifetime.name} purchase is removed, and your account moves to Free (or to your subscription, if you have one).</li>
        <li>
          Your captures stay in your history within the Free plan’s limits; schedules stop running. Download anything you want to keep
          first.
        </li>
      </ul>

      <h2>Cancelling instead</h2>
      <p>
        You don’t need a refund to stop paying: cancel any time from <Link href="/billing">Plan &amp; billing</Link>. Your plan stays active
        until the end of the period you’ve paid for, and you won’t be charged again.
      </p>

      <h2>Abuse</h2>
      <p>
        We may decline refunds that look like abuse of this policy — for example, repeated buy-and-refund cycles, or buying, using a plan
        heavily and refunding repeatedly.
      </p>
    </LegalPage>
  );
}
