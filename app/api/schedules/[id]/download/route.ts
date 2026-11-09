import { NextRequest, NextResponse } from 'next/server';
import { getScheduledRuns, getRunDir } from '@/lib/scheduleStore';
import { createZipBufferFromDir } from '@/lib/zip';
import { getOwnedSchedule } from '@/lib/scheduleAccess';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await getOwnedSchedule(id))) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }
  const runs = await getScheduledRuns(id);

  if (runs.length === 0) {
    return NextResponse.json({ error: 'No capture runs recorded yet for this schedule' }, { status: 404 });
  }

  const latestRun = runs[0];
  const runDir = getRunDir(id, latestRun.id);

  if (!fs.existsSync(runDir)) {
    return NextResponse.json({ error: 'Run directory not found' }, { status: 404 });
  }

  const zipPath = path.join(runDir, 'archive.zip');

  let buffer: Buffer;
  try {
    if (fs.existsSync(zipPath) && fs.statSync(zipPath).size > 0) {
      buffer = await fs.promises.readFile(zipPath);
    } else {
      buffer = await createZipBufferFromDir(runDir);
      fs.promises.writeFile(zipPath, buffer).catch(() => {});
    }
  } catch (err) {
    console.error(`[DownloadRoute] Error reading/creating zip for schedule ${id}:`, err);
    return NextResponse.json({ error: 'Failed to generate archive' }, { status: 500 });
  }

  const body = new Uint8Array(buffer);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="schedule-latest-${latestRun.id.slice(0, 8)}.zip"`,
      'Content-Length': body.length.toString(),
    },
  });
}
