import { currentUserKey } from '@/auth';
import { billingEnabled, getBillingRecord, portalUrl } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/** A one-time link to Paddle's customer portal: card, invoices, cancel. */
export async function POST() {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (!billingEnabled()) return Response.json({ error: 'Billing is not set up.' }, { status: 400 });
  const record = await getBillingRecord(key);
  if (!record?.customerId) return Response.json({ error: 'You have no purchases yet.' }, { status: 400 });
  try {
    return Response.json({ url: await portalUrl(record) });
  } catch (err) {
    console.error('[Billing] portal:', err);
    return Response.json({ error: 'Could not open the billing portal. Try again in a minute.' }, { status: 502 });
  }
}
