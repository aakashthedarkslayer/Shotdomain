import { NextRequest } from 'next/server';
import { GET as image } from '../image/route';
import { getShare } from '@/lib/shareStore';

export const dynamic = 'force-dynamic';

/**
 * "Latest Screenshot" link.
 * - schedule shares: the newest run's screenshots (page links back to all screenshots)
 * - page / screenshot shares: the newest image itself, ready to embed
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const share = await getShare(token);
  if (share?.kind === 'schedule' || share?.kind === 'capture') {
    return Response.redirect(new URL(`/share/${token}?view=latest`, request.url), 307);
  }
  const url = new URL(request.url);
  url.search = '';
  return image(new NextRequest(url), ctx);
}
