import { NextRequest } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getShare, resolvePageShare, resolveShare, scheduleRunFilePath, sharedFilePath } from '@/lib/shareStore';

export const dynamic = 'force-dynamic';

/**
 * Public image for a share link (no sign-in).
 *   /share/<token>/image                       single-screenshot shares
 *   /share/<token>/image?file=desktop/home.png a file from a shared capture/run
 *   /share/<token>/image?url=<page>&device=…   schedule shares: always the latest run's image for that page
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);
  if (!share) return new Response('Not found', { status: 404 });
  const sp = request.nextUrl.searchParams;

  let file: string | null = null;
  if (share.kind === 'page') {
    // One page over time: ?run=<id> picks a run, otherwise the newest.
    const timeline = await resolvePageShare(share);
    const run = sp.get('run');
    file = (run ? timeline?.shots.find((s) => s.runId === run) : timeline?.shots[0])?.path ?? null;
  } else if (share.kind === 'schedule' && sp.get('run') && sp.get('file')) {
    // A screenshot from any kept run (the "All Screenshots" index)
    file = await scheduleRunFilePath(share, sp.get('run')!, sp.get('file')!);
  } else {
    const content = await resolveShare(share);
    if (content) file = sharedFilePath(content, { file: sp.get('file'), pageUrl: sp.get('url'), device: sp.get('device') });
  }
  if (!file) return new Response('Not found', { status: 404 });

  // Every shared file lives under data/; reading through a data/-scoped path
  // also keeps the build from tracing the whole project.
  const rel = path.relative(path.join(process.cwd(), 'data'), file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return new Response('Not found', { status: 404 });

  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', rel));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': path.extname(file).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
        // Short cache: schedule links change when a new run lands; revoked links should stop soon.
        'Cache-Control': 'public, max-age=300',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
