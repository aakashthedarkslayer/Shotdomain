import { NextRequest, NextResponse } from 'next/server';
import { getRunDir, isValidId } from '@/lib/scheduleStore';
import { getOwnedSchedule } from '@/lib/scheduleAccess';
import { createZipBufferFromDir } from '@/lib/zip';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const { id, runId } = await params;
  if (!isValidId(runId) || !(await getOwnedSchedule(id))) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }
  const runDir = getRunDir(id, runId);

  if (!fs.existsSync(runDir)) {
    return NextResponse.json({ error: 'Run directory not found' }, { status: 404 });
  }

  const zipPath = path.join(runDir, 'archive.zip');

  let buffer: Buffer;
  try {
    if (fs.existsSync(zipPath) && fs.statSync(zipPath).size > 0) {
      buffer = await fs.promises.readFile(zipPath);
    } else {
      // Build ZIP on the fly from directory images
      buffer = await createZipBufferFromDir(runDir);
      // Cache it to disk in the background for next time
      fs.promises.writeFile(zipPath, buffer).catch(() => {});
    }
  } catch (err) {
    console.error(`[DownloadRoute] Error reading/creating zip for run ${runId}:`, err);
    return NextResponse.json({ error: 'Failed to generate archive' }, { status: 500 });
  }

  const body = new Uint8Array(buffer);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="scheduled-run-${runId.slice(0, 8)}.zip"`,
      'Content-Length': body.length.toString(),
    },
  });
}
