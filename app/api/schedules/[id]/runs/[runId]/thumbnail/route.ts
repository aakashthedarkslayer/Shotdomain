import { NextRequest, NextResponse } from 'next/server';
import { getRunDir, isValidId } from '@/lib/scheduleStore';
import { getOwnedSchedule } from '@/lib/scheduleAccess';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const { id, runId } = await params;
  const file = request.nextUrl.searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'file param is required' }, { status: 400 });
  }

  if (!isValidId(runId) || !(await getOwnedSchedule(id))) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const runDir = getRunDir(id, runId);
  // Allow device subfolders (e.g. "mobile-ios/home.png") but never escape the run folder.
  const filePath = path.resolve(runDir, file);
  const sanitizedFile = path.basename(filePath);
  if (!filePath.startsWith(runDir + path.sep) || sanitizedFile === 'manifest.json') {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(sanitizedFile).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
