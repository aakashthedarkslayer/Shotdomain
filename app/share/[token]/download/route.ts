import { getShare, resolvePageShare, resolveScheduleShare, resolveShare } from '@/lib/shareStore';
import { getRunDir } from '@/lib/scheduleStore';
import { ZipArchive } from 'archiver';
import * as path from 'path';
import { toWebStream } from '@/lib/zip';

export const dynamic = 'force-dynamic';

/** Public ZIP of a shared capture / latest schedule run — only the listed screenshots. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);

  // Page shares: every kept capture of that page, named by UTC time.
  if (share?.kind === 'page') {
    const timeline = await resolvePageShare(share);
    if (!timeline?.shots.length) return new Response('Not found', { status: 404 });
    const archive = new ZipArchive({ zlib: { level: 5 } });
    const used = new Set<string>();
    for (const s of timeline.shots) {
      // e.g. 2026-11-09_22-17-05Z.png (UTC); suffix if two runs share a second
      const stamp = new Date(s.timestamp).toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-') + 'Z';
      let name = `${stamp}${path.extname(s.path)}`;
      for (let i = 2; used.has(name); i++) name = `${stamp}-${i}${path.extname(s.path)}`;
      used.add(name);
      archive.file(s.path, { name });
    }
    archive.finalize();
    const slug = `${new URL(timeline.pageUrl).hostname}${new URL(timeline.pageUrl).pathname}`.replace(/[^a-z0-9.-]+/gi, '_').replace(/_+$/, '');
    return new Response(toWebStream(archive), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}-history.zip"`,
        'X-Robots-Tag': 'noindex',
      },
    });
  }

  // Schedule shares: ?run=<id> downloads that run from the "All Screenshots" index.
  const runId = new URL(request.url).searchParams.get('run');
  if (share?.kind === 'schedule' && runId) {
    const run = (await resolveScheduleShare(share))?.runs.find((r) => r.runId === runId);
    if (!run?.shots.length) return new Response('Not found', { status: 404 });
    const dir = getRunDir(share.scheduleId!, run.runId);
    const archive = new ZipArchive({ zlib: { level: 5 } });
    for (const shot of run.shots) {
      const abs = path.resolve(dir, shot.fileName);
      if (abs.startsWith(dir + path.sep)) archive.file(abs, { name: shot.fileName.replace(/\\/g, '/') });
    }
    archive.finalize();
    const stamp = new Date(run.timestamp).toISOString().slice(0, 16).replace(/:/g, '-');
    return new Response(toWebStream(archive), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="screenshots-${stamp}Z.zip"`,
        'X-Robots-Tag': 'noindex',
      },
    });
  }

  const content = share ? await resolveShare(share) : null;
  const files = content?.results.filter((r) => r.status === 'done' && r.fileName) ?? [];
  if (!content || files.length === 0) return new Response('Not found', { status: 404 });

  const archive = new ZipArchive({ zlib: { level: 5 } });
  for (const r of files) {
    const abs = path.resolve(content.dir, r.fileName!);
    if (abs.startsWith(content.dir + path.sep)) archive.file(abs, { name: r.fileName!.replace(/\\/g, '/') });
  }
  archive.finalize();
  return new Response(toWebStream(archive), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${content.zipName.replace(/[^a-z0-9.-]/gi, '_')}"`,
      'X-Robots-Tag': 'noindex',
    },
  });
}
