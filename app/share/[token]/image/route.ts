import { NextRequest } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getShare, resolveShare, sharedFilePath } from '@/lib/shareStore';

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
  const content = share ? await resolveShare(share) : null;
  if (!content) return new Response('Not found', { status: 404 });

  const sp = request.nextUrl.searchParams;
  const file = sharedFilePath(content, { file: sp.get('file'), pageUrl: sp.get('url'), device: sp.get('device') });
  if (!file) return new Response('Not found', { status: 404 });

  try {
    const data = await fs.readFile(file);
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
