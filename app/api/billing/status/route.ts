import { currentUserKey } from '@/auth';
import { getBillingRecord, planInfoFor } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/** The signed-in user's plan (polled after checkout until the webhook lands). */
export async function GET() {
  const key = await currentUserKey();
  const info = await planInfoFor(key);
  const record = key ? await getBillingRecord(key) : undefined;
  const sub = record?.subscription;
  return Response.json({
    ...info,
    subscription: sub ? { plan: sub.plan, interval: sub.interval, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd, cancelAt: sub.cancelAt } : null,
    lifetime: Boolean(record?.lifetime),
  });
}
