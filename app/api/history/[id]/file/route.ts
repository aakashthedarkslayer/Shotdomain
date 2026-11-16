import { NextRequest } from 'next/server';
import { imageResponse } from '@/lib/thumbnails';
import { currentUserKey } from '@/auth';
import { captureFilePath, getCapture } from '@/lib/userData';

export const dynamic = 'force-dynamic';

/** One screenshot from the signed-in user's capture history. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = request.nextUrl.searchParams.get('name');
  const userKey = await currentUserKey();
  if (!userKey) return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (!name || !(await getCapture(userKey, id))) return Response.json({ error: 'Not found' }, { status: 404 });

  const filePath = captureFilePath(userKey, id, name);
  if (!filePath) return Response.json({ error: 'Invalid file path' }, { status: 400 });

  try {
    return await imageResponse(filePath, request.nextUrl.searchParams.get('thumb') === '1', { 'Cache-Control': 'private, max-age=86400' });
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
}
