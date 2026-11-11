import { currentUserKey } from '@/auth';
import { captureDirPath, getCapture } from '@/lib/userData';
import { createZipStreamFromDir, toWebStream } from '@/lib/zip';

export const dynamic = 'force-dynamic';

/** ZIP of every screenshot in one saved capture. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userKey = await currentUserKey();
  if (!userKey) return Response.json({ error: 'Sign in required' }, { status: 401 });
  const meta = await getCapture(userKey, id);
  if (!meta) return Response.json({ error: 'Not found' }, { status: 404 });

  const archive = await createZipStreamFromDir(captureDirPath(userKey, id), ['meta.json']);
  if (!archive) return Response.json({ error: 'No screenshots in this capture' }, { status: 404 });

  let host = 'capture';
  try {
    host = new URL(meta.rootUrl).hostname;
  } catch {}
  const date = new Date(meta.createdAt).toISOString().slice(0, 10);
  return new Response(toWebStream(archive), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${host.replace(/[^a-z0-9.-]/gi, '_')}-${date}.zip"`,
    },
  });
}
