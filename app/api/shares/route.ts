import { NextRequest } from 'next/server';
import { currentUserKey } from '@/auth';
import { createShare, listShares } from '@/lib/shareStore';
import { getOwnedJob } from '@/lib/jobAccess';
import { checkShareLinks, currentPlanInfo, limitResponse } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

/** The signed-in user's live share links. */
export async function GET() {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  return Response.json(await listShares(key));
}

/** Share a finished capture of yours for 30 days: { jobId }. */
export async function POST(request: NextRequest) {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const job = await getOwnedJob(typeof body.jobId === 'string' ? body.jobId : null);
  if (!job) {
    return Response.json(
      { error: 'This capture is no longer on the server (captures are kept for about an hour). Run it again to share it.' },
      { status: 404 },
    );
  }
  if (job.completed + job.failed < job.total && !job.cancelled) {
    return Response.json({ error: 'Wait for the capture to finish, then share it.' }, { status: 409 });
  }

  const shares = await listShares(key);
  if (!shares.some((s) => s.captureId === job.id)) {
    const denial = checkShareLinks(await currentPlanInfo(), shares.length);
    if (denial) return limitResponse(denial);
  }

  const share = await createShare(key, { ...job, results: job.results.values() });
  if (!share) return Response.json({ error: 'There are no screenshots in this capture to share.' }, { status: 400 });
  return Response.json(share);
}
