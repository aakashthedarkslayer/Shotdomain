import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PLANS, UNLIMITED, isPlanId } from './plans';
import type { Interval, PlanId, PlanInfo } from './plans';

/**
 * Billing with Paddle (merchant of record: Paddle sells on our behalf and
 * handles VAT/GST, invoices and refunds worldwide).
 *
 *   - Checkout: Paddle.js overlay in the browser (client token + price IDs).
 *   - Webhooks (/api/billing/webhook): the only thing that changes a plan.
 *   - Customer portal: Paddle-hosted page to update the card, see invoices, cancel.
 *
 * Billing is off unless sign-in and all Paddle env vars are set; then every
 * feature is allowed (self-hosted / local mode). Records: data/billing.json.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const env = (k: string) => process.env[k]?.trim() || '';

export const paddleEnv: 'sandbox' | 'production' = env('PADDLE_ENV') === 'production' ? 'production' : 'sandbox';
const API_BASE = paddleEnv === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';

/** Paddle price ID -> plan + interval. */
function priceTable(): Record<string, { plan: PlanId; interval: Interval | 'once' }> {
  const rows: [string, PlanId, Interval | 'once'][] = [
    [env('PADDLE_PRICE_STUDIO_MONTH'), 'studio', 'month'],
    [env('PADDLE_PRICE_STUDIO_YEAR'), 'studio', 'year'],
    [env('PADDLE_PRICE_AGENCY_MONTH'), 'agency', 'month'],
    [env('PADDLE_PRICE_AGENCY_YEAR'), 'agency', 'year'],
    [env('PADDLE_PRICE_LIFETIME'), 'lifetime', 'once'],
  ];
  return Object.fromEntries(rows.filter(([id]) => id).map(([id, plan, interval]) => [id, { plan, interval }]));
}

export function priceIdFor(plan: PlanId, interval: Interval | 'once'): string | undefined {
  return Object.entries(priceTable()).find(([, v]) => v.plan === plan && v.interval === interval)?.[0];
}

export function billingEnabled(): boolean {
  const authOn = Boolean(env('AUTH_GOOGLE_ID') && env('AUTH_GOOGLE_SECRET'));
  return authOn && Boolean(env('PADDLE_API_KEY') && env('PADDLE_CLIENT_TOKEN') && env('PADDLE_WEBHOOK_SECRET') && env('PADDLE_PRICE_STUDIO_MONTH'));
}

/** What the browser needs to open a checkout (all public). */
export function checkoutConfig() {
  return {
    environment: paddleEnv,
    clientToken: env('PADDLE_CLIENT_TOKEN'),
    prices: {
      studio: { month: priceIdFor('studio', 'month'), year: priceIdFor('studio', 'year') },
      agency: { month: priceIdFor('agency', 'month'), year: priceIdFor('agency', 'year') },
      lifetime: { once: priceIdFor('lifetime', 'once') },
    },
  };
}
export type CheckoutConfig = ReturnType<typeof checkoutConfig>;

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled';

export interface SubscriptionRecord {
  id: string;
  plan: PlanId;
  interval: Interval;
  priceId: string;
  status: SubscriptionStatus;
  /** End of the paid period (ms). */
  currentPeriodEnd?: number;
  /** Set when the user cancelled: the plan stays until this time (ms). */
  cancelAt?: number;
  /** occurred_at of the event this came from (ms), to ignore out-of-order events. */
  updatedAt: number;
}

export interface BillingRecord {
  userKey: string;
  customerId?: string;
  subscription?: SubscriptionRecord;
  lifetime?: { transactionId: string; purchasedAt: number };
}

const FILE = path.join(process.cwd(), 'data', 'billing.json');
let writing: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Record<string, BillingRecord>> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Record<string, BillingRecord>;
  } catch {
    return {};
  }
}

/** Serialised read-modify-write, so two webhooks can't overwrite each other. */
async function mutate<T>(fn: (all: Record<string, BillingRecord>) => T): Promise<T> {
  const run = writing.then(async () => {
    const all = await readAll();
    const out = fn(all);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
    await fs.rename(tmp, FILE);
    return out;
  });
  writing = run.catch(() => undefined);
  return run;
}

export async function getBillingRecord(userKey: string): Promise<BillingRecord | undefined> {
  return (await readAll())[userKey];
}

/** Statuses that keep the plan: past_due is Paddle's retry window, so access continues meanwhile. */
const PAID_STATUSES: SubscriptionStatus[] = ['active', 'trialing', 'past_due'];

const RANK: Record<PlanId, number> = { free: 0, studio: 1, lifetime: 1, agency: 2 };

export function effectivePlan(record: BillingRecord | undefined): PlanId {
  let plan: PlanId = 'free';
  if (record?.lifetime) plan = 'lifetime';
  const sub = record?.subscription;
  if (sub && PAID_STATUSES.includes(sub.status) && RANK[sub.plan] > RANK[plan]) plan = sub.plan;
  return plan;
}

/** The user's plan and limits. Without billing configured, everything is allowed. */
export async function planInfoFor(userKey: string | null): Promise<PlanInfo> {
  if (!billingEnabled()) return { billingEnabled: false, plan: 'free', limits: UNLIMITED };
  const plan = userKey ? effectivePlan(await getBillingRecord(userKey)) : 'free';
  return { billingEnabled: true, plan, limits: PLANS[plan].limits };
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/**
 * Paddle-Signature: "ts=1671552777;h1=<hex>" (several h1 during secret
 * rotation). h1 = HMAC-SHA256(secret, `${ts}:${rawBody}`). Rejects
 * signatures older than 5 minutes (replays).
 */
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, nowMs = Date.now()): boolean {
  if (!header || !secret) return false;
  let ts = '';
  const sigs: string[] = [];
  for (const part of header.split(';')) {
    const [k, v] = part.split('=');
    if (k?.trim() === 'ts') ts = v?.trim() ?? '';
    if (k?.trim() === 'h1' && v) sigs.push(v.trim());
  }
  if (!/^\d+$/.test(ts) || Math.abs(nowMs / 1000 - Number(ts)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest();
  return sigs.some((s) => {
    const got = Buffer.from(s, 'hex');
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}

interface PaddleEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: Record<string, unknown> & {
    id?: string;
    status?: string;
    customer_id?: string;
    subscription_id?: string | null;
    transaction_id?: string;
    action?: string;
    /** adjustment: "full" or "partial" refund. */
    type?: string;
    custom_data?: { userKey?: string } | null;
    items?: { price?: { id?: string }; price_id?: string }[];
    current_billing_period?: { ends_at?: string } | null;
    scheduled_change?: { action?: string; effective_at?: string } | null;
  };
}

const time = (s?: string | null) => (s ? Date.parse(s) || undefined : undefined);

function findUser(all: Record<string, BillingRecord>, test: (r: BillingRecord) => boolean): string | undefined {
  return Object.values(all).find(test)?.userKey;
}

/** Apply one verified webhook event. Returns what happened (for logs/tests). */
export async function applyPaddleEvent(evt: PaddleEvent): Promise<string> {
  const type = evt.event_type ?? '';
  const d = evt.data;
  if (!d) return 'ignored: no data';
  const occurred = time(evt.occurred_at) ?? Date.now();
  const table = priceTable();
  const priceId = d.items?.[0]?.price?.id ?? d.items?.[0]?.price_id ?? '';
  const mapped = table[priceId];

  return mutate((all) => {
    const keyFromData = typeof d.custom_data?.userKey === 'string' ? d.custom_data.userKey : undefined;

    if (type.startsWith('subscription.')) {
      if (!d.id) return 'ignored: no subscription id';
      const userKey =
        findUser(all, (r) => r.subscription?.id === d.id) ?? keyFromData ?? findUser(all, (r) => !!d.customer_id && r.customerId === d.customer_id);
      if (!userKey) return 'ignored: unknown user';
      if (!mapped || mapped.interval === 'once') return `ignored: unknown price ${priceId}`;
      const rec = (all[userKey] ??= { userKey });
      if (rec.subscription?.id === d.id && rec.subscription.updatedAt > occurred) return 'ignored: older event';
      const status = (['active', 'trialing', 'past_due', 'paused', 'canceled'] as const).find((s) => s === d.status) ?? 'canceled';
      rec.customerId = d.customer_id ?? rec.customerId;
      // A new subscription replaces an older cancelled one; an active one is only replaced by itself.
      if (rec.subscription && rec.subscription.id !== d.id && PAID_STATUSES.includes(rec.subscription.status) && !PAID_STATUSES.includes(status)) {
        return 'ignored: inactive subscription while another is active';
      }
      rec.subscription = {
        id: d.id,
        plan: mapped.plan,
        interval: mapped.interval,
        priceId,
        status,
        currentPeriodEnd: time(d.current_billing_period?.ends_at),
        cancelAt: d.scheduled_change?.action === 'cancel' ? time(d.scheduled_change.effective_at) : undefined,
        updatedAt: occurred,
      };
      return `subscription ${status}: ${userKey} -> ${mapped.plan}`;
    }

    if (type === 'transaction.completed' && !d.subscription_id && mapped?.plan === 'lifetime' && d.id) {
      const userKey = keyFromData ?? findUser(all, (r) => !!d.customer_id && r.customerId === d.customer_id);
      if (!userKey) return 'ignored: unknown user';
      const rec = (all[userKey] ??= { userKey });
      rec.customerId = d.customer_id ?? rec.customerId;
      rec.lifetime = { transactionId: d.id, purchasedAt: occurred };
      return `lifetime: ${userKey}`;
    }

    // A full refund of the lifetime purchase removes it.
    if ((type === 'adjustment.created' || type === 'adjustment.updated') && d.action === 'refund' && d.status === 'approved' && d.type !== 'partial') {
      const userKey = findUser(all, (r) => r.lifetime?.transactionId === d.transaction_id);
      if (!userKey) return 'ignored: refund not for a lifetime purchase';
      delete all[userKey].lifetime;
      return `lifetime refunded: ${userKey}`;
    }

    return `ignored: ${type}`;
  });
}

// ---------------------------------------------------------------------------
// Paddle API (server-side)
// ---------------------------------------------------------------------------

async function paddleApi<T>(method: string, pathname: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${env('PADDLE_API_KEY')}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: { detail?: string } };
  if (!res.ok || !json.data) throw new Error(json.error?.detail || `Paddle API error (${res.status})`);
  return json.data;
}

/** One-time link to Paddle's customer portal (card, invoices, cancel). */
export async function portalUrl(record: BillingRecord): Promise<string> {
  if (!record.customerId) throw new Error('No billing account yet.');
  const data = await paddleApi<{ urls: { general: { overview: string } } }>('POST', `/customers/${record.customerId}/portal-sessions`, {
    subscription_ids: record.subscription ? [record.subscription.id] : [],
  });
  return data.urls.general.overview;
}

/**
 * Side effects that need Paddle's API, run after an event is stored. A full
 * refund of a subscription payment cancels that subscription right away (as
 * the Refund Policy says); Paddle then sends subscription.canceled.
 */
export async function afterPaddleEvent(evt: PaddleEvent): Promise<string | null> {
  const d = evt.data;
  const isFullRefund =
    (evt.event_type === 'adjustment.created' || evt.event_type === 'adjustment.updated') &&
    d?.action === 'refund' &&
    d.status === 'approved' &&
    d.type === 'full' &&
    typeof d.subscription_id === 'string';
  if (!isFullRefund) return null;
  await paddleApi('POST', `/subscriptions/${d!.subscription_id}/cancel`, { effective_from: 'immediately' });
  return `cancelled ${d!.subscription_id} after full refund`;
}

/** Switch an existing subscription to another plan/interval, prorated now. */
export async function changeSubscription(record: BillingRecord, plan: PlanId, interval: Interval): Promise<void> {
  const sub = record.subscription;
  const priceId = priceIdFor(plan, interval);
  if (!sub || !PAID_STATUSES.includes(sub.status)) throw new Error('No active subscription to change.');
  if (!priceId) throw new Error('That plan is not available.');
  await paddleApi('PATCH', `/subscriptions/${sub.id}`, {
    items: [{ price_id: priceId, quantity: 1 }],
    proration_billing_mode: 'prorated_immediately',
  });
}

export { isPlanId };
