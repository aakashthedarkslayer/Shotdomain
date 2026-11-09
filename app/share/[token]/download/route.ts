import { getShare, resolveShare } from '@/lib/shareStore';
import { ZipArchive } from 'archiver';
import * as path from 'path';
import { toWebStream } from '@/lib/zip';

export const dynamic = 'force-dynamic';

/** Public ZIP of a shared capture / latest schedule run — only the listed screenshots. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);
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
