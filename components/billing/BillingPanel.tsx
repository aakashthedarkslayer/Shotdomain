'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PricingCards } from './PricingCards';
import { PLANS, isPlanId } from '@/lib/plans';
import { LEGAL } from '@/lib/legal';
import type { Interval, Plan, PlanId } from '@/lib/plans';
import type { CheckoutConfig } from '@/lib/billing';

// ---------------------------------------------------------------------------
// Paddle.js (loaded on demand from Paddle's CDN)
// ---------------------------------------------------------------------------

interface PaddleEventData {
  name?: string;
}
interface PaddleJs {
  Environment: { set: (env: string) => void };
  Initialize: (opts: { token: string; eventCallback?: (e: PaddleEventData) => void }) => void;
  Checkout: {
    open: (opts: {
      items: { priceId: string; quantity: number }[];
      customer?: { email: string };
      customData?: Record<string, string>;
      settings?: Record<string, unknown>;
    }) => void;
  };
}
declare global {
  interface Window {
    Paddle?: PaddleJs;
  }
}

let paddlePromise: Promise<PaddleJs> | null = null;
const paddleListeners = new Set<(e: PaddleEventData) => void>();

function loadPaddle(config: CheckoutConfig): Promise<PaddleJs> {
  paddlePromise ??= new Promise<PaddleJs>((resolve, reject) => {
    const init = () => {
      const P = window.Paddle;
      if (!P) return reject(new Error('Paddle did not load'));
      if (config.environment === 'sandbox') P.Environment.set('sandbox');
      P.Initialize({ token: config.clientToken, eventCallback: (e) => paddleListeners.forEach((fn) => fn(e)) });
      resolve(P);
    };
    if (window.Paddle) return init();
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = init;
    script.onerror = () => {
      paddlePromise = null;
      reject(new Error('Could not load the checkout. Check your connection or ad blocker and try again.'));
    };
    document.head.appendChild(script);
  });
  return paddlePromise;
}

// ---------------------------------------------------------------------------

export interface SubscriptionSummary {
  plan: PlanId;
  interval: Interval;
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled';
  currentPeriodEnd?: number;
  cancelAt?: number;
}

interface Props {
  enabled: boolean;
  plan: PlanId;
  subscription: SubscriptionSummary | null;
  lifetime: boolean;
  hasCustomer: boolean;
  email: string;
  userKey: string;
  config: CheckoutConfig | null;
  wantPlan?: string;
  wantInterval?: string;
  autoCheckout?: boolean;
}

const fmtDate = (ms?: number) => (ms ? new Date(ms).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '');
const ACTIVE = ['active', 'trialing', 'past_due'];

function limitsSummary(id: PlanId): string[] {
  const l = PLANS[id].limits;
  return [
    `${l.pagesPerRun} pages per capture`,
    l.devices.length > 1 ? 'All devices' : 'Desktop only',
    l.loginPages ? 'Login pages' : 'No login pages',
    l.schedules ? `${l.schedules} schedules × ${l.pagesPerSchedule} pages` : 'No schedules',
    `${l.historyKept} captures kept`,
  ];
}

export function BillingPanel({ enabled, plan, subscription, lifetime, hasCustomer, email, userKey, config, wantPlan, wantInterval, autoCheckout }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const activeSub = subscription && ACTIVE.includes(subscription.status) ? subscription : null;
  const autoStarted = useRef(false);

  /** After a payment or change: poll until the webhook has updated the plan. */
  const waitForUpdate = useCallback(
    async (done: (s: { plan: PlanId; lifetime: boolean; subscription: SubscriptionSummary | null }) => boolean, message: string) => {
      setWaiting(true);
      setNotice(message);
      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const s = await fetch('/api/billing/status', { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null);
        if (s && done(s)) {
          setWaiting(false);
          setNotice(`You’re on ${PLANS[s.plan as PlanId].name} now. Thanks!`);
          router.refresh();
          return;
        }
      }
      setWaiting(false);
      setNotice('Payment received. Your plan will update within a few minutes — refresh this page to see it.');
    },
    [router],
  );

  const openCheckout = useCallback(
    async (target: PlanId, interval: Interval | 'once') => {
      if (!config) return;
      const priceId = target === 'lifetime' ? config.prices.lifetime.once : config.prices[target as 'studio' | 'agency']?.[interval as Interval];
      if (!priceId) return setError('That plan isn’t available yet.');
      setError(null);
      setBusy(`${target}-${interval}`);
      try {
        const paddle = await loadPaddle(config);
        const onEvent = (e: PaddleEventData) => {
          if (e.name !== 'checkout.completed') return;
          paddleListeners.delete(onEvent);
          void waitForUpdate(
            (s) => (target === 'lifetime' ? s.lifetime : s.plan === target),
            'Payment received — activating your plan…',
          );
        };
        paddleListeners.add(onEvent);
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: { email },
          customData: { userKey },
          settings: { displayMode: 'overlay', allowLogout: false, theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not open the checkout.');
      } finally {
        setBusy(null);
      }
    },
    [config, email, userKey, waitForUpdate],
  );

  async function changePlan(target: PlanId, interval: Interval) {
    const label = `${PLANS[target].name} (${interval === 'year' ? 'yearly' : 'monthly'})`;
    if (!window.confirm(`Switch to ${label}? The difference is prorated and charged or credited now.`)) return;
    setError(null);
    setBusy(`${target}-${interval}`);
    try {
      const res = await fetch('/api/billing/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: target, interval }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not change the plan.');
      void waitForUpdate((s) => s.subscription?.plan === target && s.subscription?.interval === interval, `Switching to ${label}…`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the plan.');
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    setError(null);
    setBusy('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not open the billing portal.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the billing portal.');
      setBusy(null);
    }
  }

  // Arriving from the homepage ("Get Studio"): open that checkout right away.
  useEffect(() => {
    if (autoStarted.current || !autoCheckout || !enabled || !isPlanId(wantPlan) || wantPlan === 'free') return;
    autoStarted.current = true;
    router.replace('/billing', { scroll: false });
    const interval = wantPlan === 'lifetime' ? 'once' : wantInterval === 'year' ? 'year' : 'month';
    const alreadyHas = wantPlan === 'lifetime' ? lifetime : activeSub?.plan === wantPlan;
    if (alreadyHas || activeSub) return;
    // Deferred (opening the checkout updates state). Not cancelled on re-run: the URL
    // change above re-runs this effect, and autoStarted keeps it to one checkout.
    setTimeout(() => void openCheckout(wantPlan, interval), 0);
  }, [autoCheckout, enabled, wantPlan, wantInterval, lifetime, activeSub, openCheckout, router]);

  function action(p: Plan, interval: Interval) {
    const key = `${p.id}-${p.id === 'lifetime' ? 'once' : interval}`;
    const loading = busy === key;
    const disabled = (label: string) => (
      <Button variant="secondary" className="w-full" disabled>
        {label}
      </Button>
    );
    if (!enabled) return disabled('Billing not set up');
    if (waiting) return disabled('Updating…');

    if (p.id === 'free') {
      if (plan === 'free') return disabled('Current plan');
      if (activeSub && hasCustomer)
        return (
          <Button variant="secondary" className="w-full" isLoading={busy === 'portal'} onClick={openPortal}>
            Cancel in billing portal
          </Button>
        );
      return disabled('Included');
    }

    if (p.id === 'lifetime') {
      if (lifetime) return disabled('Purchased');
      return (
        <Button variant={plan === 'free' ? 'primary' : 'secondary'} className="w-full" isLoading={loading} onClick={() => openCheckout('lifetime', 'once')}>
          Buy once
        </Button>
      );
    }

    // Studio / Agency
    if (activeSub) {
      if (activeSub.plan === p.id && activeSub.interval === interval) return disabled('Current plan');
      return (
        <Button variant="secondary" className="w-full" isLoading={loading} onClick={() => changePlan(p.id, interval)}>
          Switch to {p.name}
          {activeSub.plan === p.id ? (interval === 'year' ? ' yearly' : ' monthly') : ''}
        </Button>
      );
    }
    if (lifetime && p.id === 'studio') return disabled('Included in Lifetime');
    return (
      <Button variant={p.badge ? 'primary' : 'secondary'} className="w-full" isLoading={loading} onClick={() => openCheckout(p.id, interval)}>
        Upgrade to {p.name}
      </Button>
    );
  }

  let status: ReactNode;
  if (!enabled) status = 'Billing isn’t set up on this server, so every feature is available.';
  else if (activeSub?.status === 'past_due') status = <span className="text-warning">The last payment failed — update your card in the billing portal to keep {PLANS[activeSub.plan].name}.</span>;
  else if (activeSub?.cancelAt) status = `${PLANS[activeSub.plan].name} ends on ${fmtDate(activeSub.cancelAt)}; you’ll move to ${lifetime ? 'Lifetime' : 'Free'} after that.`;
  else if (activeSub) status = `${activeSub.interval === 'year' ? 'Yearly' : 'Monthly'} — renews on ${fmtDate(activeSub.currentPeriodEnd)}.`;
  else if (lifetime) status = 'Paid once — yours for good.';
  else status = 'Upgrade any time; you can cancel whenever you like.';

  return (
    <div className="space-y-10">
      <Card>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <span className="bg-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
            <Icon name="card" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-fg">{enabled ? `${PLANS[plan].name} plan` : 'All features'}</h2>
              {enabled && activeSub && <Badge tone={activeSub.status === 'past_due' ? 'warning' : 'success'}>{activeSub.status === 'past_due' ? 'Payment due' : 'Active'}</Badge>}
              {enabled && lifetime && <Badge tone="accent">Lifetime</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted">{status}</p>
            {enabled && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {limitsSummary(plan).map((t) => (
                  <span key={t} className="rounded-md bg-subtle px-2 py-0.5 text-xs text-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          {enabled && hasCustomer && (
            <Button variant="secondary" icon="external" isLoading={busy === 'portal'} onClick={openPortal}>
              Invoices &amp; payment method
            </Button>
          )}
        </div>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      {notice && <Alert tone={waiting ? 'info' : 'success'}>{notice}</Alert>}

      <PricingCards
        action={action}
        current={enabled ? plan : undefined}
        highlight={isPlanId(wantPlan) ? wantPlan : undefined}
        initialInterval={activeSub?.interval ?? (wantInterval === 'year' ? 'year' : 'month')}
      />

      <p className="text-center text-xs text-muted">
        Payments are processed by Paddle, our reseller and merchant of record — they handle taxes, invoices and refunds. Prices in USD; local
        taxes are added at checkout. {LEGAL.refundDays}-day money-back guarantee —{' '}
        <a href="/refunds" className="underline underline-offset-2 hover:text-fg">
          Refund Policy
        </a>{' '}
        ·{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-fg">
          Terms
        </a>
        .
      </p>
    </div>
  );
}
