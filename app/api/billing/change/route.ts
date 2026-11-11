import { NextRequest } from 'next/server';
import { currentUserKey } from '@/auth';
import { billingEnabled, changeSubscription, getBillingRecord } from '@/lib/billing';
import { isPlanId } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/** Switch an active subscription between Studio/Agency and monthly/yearly (prorated). */
export async function POST(request: NextRequest) {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (!billingEnabled()) return Response.json({ error: 'Billing is not set up.' }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { plan?: unknown; interval?: unknown };
  if (!isPlanId(body.plan) || (body.plan !== 'studio' && body.plan !== 'agency') || (body.interval !== 'month' && body.interval !== 'year')) {
    return Response.json({ error: 'Choose Studio or Agency, monthly or yearly.' }, { status: 400 });
  }
  const record = await getBillingRecord(key);
  if (!record) return Response.json({ error: 'No active subscription to change.' }, { status: 400 });
  try {
    await changeSubscription(record, body.plan, body.interval);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[Billing] change:', err);
    return Response.json({ error: err instanceof Error ? err.message : 'Could not change the plan.' }, { status: 502 });
  }
}
