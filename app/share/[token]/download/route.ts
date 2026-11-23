import { ZipArchive } from 'archiver';
import { getShare, getSharedCapture, sharedFilePath, sharedZipName } from '@/lib/shareStore';
import { toWebStream } from '@/lib/zip';

export const dynamic = 'force-dynamic';

/** Public ZIP of a shared capture: only the screenshots it lists. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);
  const capture = share ? await getSharedCapture(share) : null;
  const files = (capture?.results ?? [])
    .map((r) => ({ name: r.fileName, abs: capture && r.fileName ? sharedFilePath(capture, r.fileName) : null }))
    .filter((f): f is { name: string; abs: string } => !!f.name && !!f.abs);
  if (!capture || files.length === 0) return new Response('Not found', { status: 404 });

  const archive = new ZipArchive({ zlib: { level: 5 } });
  for (const f of files) archive.file(f.abs, { name: f.name.replace(/\\/g, '/') });
  archive.finalize();
  return new Response(toWebStream(archive), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${sharedZipName(capture)}"`,
      'X-Robots-Tag': 'noindex',
    },
  });
}
