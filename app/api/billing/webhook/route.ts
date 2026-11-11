import { NextRequest } from 'next/server';
import { applyPaddleEvent, verifyPaddleSignature } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/**
 * Paddle notifications. Not behind sign-in (Paddle calls it); trusted only
 * when the Paddle-Signature matches PADDLE_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim() ?? '';
  if (!verifyPaddleSignature(raw, request.headers.get('paddle-signature'), secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  let event: Parameters<typeof applyPaddleEvent>[0];
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const outcome = await applyPaddleEvent(event);
    console.log(`[Billing] ${event.event_type} ${event.event_id ?? ''}: ${outcome}`);
    return Response.json({ ok: true, outcome });
  } catch (err) {
    // 5xx makes Paddle retry later.
    console.error('[Billing] webhook failed:', err);
    return Response.json({ error: 'Failed to process' }, { status: 500 });
  }
}
