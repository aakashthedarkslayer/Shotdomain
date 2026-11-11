import { currentUserKey } from '@/auth';
import { revokeShare } from '@/lib/shareStore';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const key = await currentUserKey();
  if (!key) return Response.json({ error: 'Sign in required' }, { status: 401 });
  const { token } = await params;
  const ok = await revokeShare(key, token);
  return ok ? Response.json({ ok: true }) : Response.json({ error: 'Not found' }, { status: 404 });
}
