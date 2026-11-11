import { redirect } from 'next/navigation';
import { currentUser, currentUserKey } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { BillingPanel } from '@/components/billing/BillingPanel';
import { billingEnabled, checkoutConfig, getBillingRecord, planInfoFor } from '@/lib/billing';

export const metadata = { title: 'Plan & billing — ShotDomain' };
export const dynamic = 'force-dynamic';

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string; checkout?: string }> }) {
  const key = await currentUserKey();
  if (!key) redirect('/login?callbackUrl=/billing');
  const [user, info, sp] = await Promise.all([currentUser(), planInfoFor(key), searchParams]);
  const enabled = billingEnabled();
  const record = enabled ? await getBillingRecord(key) : undefined;
  const sub = record?.subscription;

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Plan &amp; billing</h1>
          <p className="mt-1 text-sm text-muted">Change plans, switch to yearly billing, or download invoices.</p>
        </div>
        <BillingPanel
          enabled={enabled}
          plan={info.plan}
          subscription={
            sub ? { plan: sub.plan, interval: sub.interval, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd, cancelAt: sub.cancelAt } : null
          }
          lifetime={Boolean(record?.lifetime)}
          hasCustomer={Boolean(record?.customerId)}
          email={user?.email ?? ''}
          userKey={key}
          config={enabled ? checkoutConfig() : null}
          wantPlan={sp.plan}
          wantInterval={sp.interval}
          autoCheckout={sp.checkout === '1'}
        />
      </main>
    </div>
  );
}
