import { NextRequest } from 'next/server';
import * as path from 'path';
import { imageResponse } from '@/lib/thumbnails';
import { getShare, getSharedCapture, sharedFilePath } from '@/lib/shareStore';

export const dynamic = 'force-dynamic';

/**
 * Public image from a share link (no sign-in):
 *   /share/<token>/image?file=desktop/home.png          full size
 *   /share/<token>/image?file=desktop/home.png&thumb=1  thumbnail
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);
  const capture = share ? await getSharedCapture(share) : null;
  const sp = request.nextUrl.searchParams;
  const file = capture ? sharedFilePath(capture, sp.get('file')) : null;
  if (!file) return new Response('Not found', { status: 404 });

  // Every shared file lives under data/; reading through a data/-scoped path
  // also keeps the build from tracing the whole project.
  const rel = path.relative(path.join(process.cwd(), 'data'), file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return new Response('Not found', { status: 404 });

  try {
    return await imageResponse(path.join(process.cwd(), 'data', rel), sp.get('thumb') === '1', {
      // Short cache, so a stopped or expired link stops working soon.
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex',
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
