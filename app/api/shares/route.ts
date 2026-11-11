import { NextRequest } from 'next/server';
import { currentUserKey } from '@/auth';
import { createShare, listShares } from '@/lib/shareStore';
import type { ShareKind } from '@/lib/shareStore';
import { getCapture } from '@/lib/userData';
import { getOwnedSchedule } from '@/lib/scheduleAccess';
import { hostOf, formatDateTime } from '@/lib/format';
import { urlPath } from '@/lib/url';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  return Response.json(await listShares(key));
}

/** Create a share link for something the caller owns. */
export async function POST(request: NextRequest) {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const kind = body.kind as ShareKind;

  if (kind === 'capture' || kind === 'screenshot') {
    const meta = await getCapture(key, String(body.captureId ?? ''));
    if (!meta) return Response.json({ error: 'Capture not found' }, { status: 404 });
    if (kind === 'screenshot') {
      const result = meta.results.find((r) => r.status === 'done' && r.fileName === body.file);
      if (!result) return Response.json({ error: 'Screenshot not found' }, { status: 404 });
      const share = await createShare({
        ownerKey: key,
        kind,
        captureId: meta.id,
        file: result.fileName,
        label: `${hostOf(meta.rootUrl)}${urlPath(result.url)}${result.device ? ` · ${result.device}` : ''}`,
      });
      return Response.json(share);
    }
    const share = await createShare({ ownerKey: key, kind, captureId: meta.id, label: `${hostOf(meta.rootUrl)} · ${formatDateTime(meta.createdAt)}` });
    return Response.json(share);
  }

  if (kind === 'schedule') {
    const schedule = await getOwnedSchedule(String(body.scheduleId ?? ''));
    // Shares are tied to an owner; legacy ownerless schedules can't be shared.
    if (!schedule || schedule.ownerKey !== key) return Response.json({ error: 'Schedule not found' }, { status: 404 });
    const share = await createShare({ ownerKey: key, kind, scheduleId: schedule.id, label: `${schedule.name} (latest run)` });
    return Response.json(share);
  }

  if (kind === 'page') {
    const schedule = await getOwnedSchedule(String(body.scheduleId ?? ''));
    if (!schedule || schedule.ownerKey !== key) return Response.json({ error: 'Schedule not found' }, { status: 404 });
    const pageUrl = String(body.pageUrl ?? '');
    if (!schedule.urls.includes(pageUrl)) return Response.json({ error: 'That page is not part of this schedule' }, { status: 400 });
    const devices = schedule.settings?.devices?.length ? schedule.settings.devices : [schedule.settings?.device ?? 'Desktop'];
    const device = body.device ? String(body.device) : devices[0];
    if (!devices.includes(device as (typeof devices)[number])) return Response.json({ error: 'Unknown device for this schedule' }, { status: 400 });
    const share = await createShare({
      ownerKey: key,
      kind,
      scheduleId: schedule.id,
      pageUrl,
      device,
      label: `${hostOf(pageUrl)}${urlPath(pageUrl)} · ${device} (all screenshots)`,
    });
    return Response.json(share);
  }

  return Response.json({ error: 'Unknown share type' }, { status: 400 });
}
