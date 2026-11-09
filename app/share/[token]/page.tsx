import { notFound } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Card, CardHeader } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ScreenshotGrid } from '@/components/capture/ScreenshotGrid';
import { getShare, resolveShare } from '@/lib/shareStore';
import { baseName, formatDateTime } from '@/lib/format';
import { urlPath } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shared screenshots — ShotDomain', robots: { index: false, follow: false } };

/** Public, read-only view of a share link. No sign-in. */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);
  const content = share ? await resolveShare(share) : null;
  if (!share || !content) notFound();

  const done = content.results.filter((r) => r.status === 'done' && r.fileName);
  const img = (file: string) => `/share/${token}/image?file=${encodeURIComponent(file)}`;

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-line bg-bg/85">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" />
          <span className="text-xs text-muted">Shared read-only link</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-8 sm:px-6">
        <Card>
          <CardHeader
            title={content.title}
            description={`${content.subtitle} · ${formatDateTime(content.createdAt)}`}
            actions={
              done.length > 1 ? (
                <a href={`/share/${token}/download`} className={buttonClass('primary', 'md')}>
                  <Icon name="download" />
                  Download ZIP
                </a>
              ) : done.length === 1 ? (
                <a href={img(done[0].fileName!)} download={baseName(done[0].fileName)} className={buttonClass('primary', 'md')}>
                  <Icon name="download" />
                  Download
                </a>
              ) : null
            }
          />
          {share.kind === 'screenshot' && done[0] ? (
            <div className="bg-subtle p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(done[0].fileName!)} alt={`Screenshot of ${done[0].url}`} className="mx-auto max-w-full rounded border border-line" />
              <p className="mt-3 text-center font-mono text-[13px] text-muted">
                {done[0].url}
                {done[0].device ? ` · ${done[0].device}` : ''}
              </p>
            </div>
          ) : (
            <ScreenshotGrid
              emptyText="No screenshots yet."
              items={done.map((r, i) => ({
                key: `${r.device ?? ''}-${r.fileName}-${i}`,
                url: r.url,
                device: r.device,
                src: img(r.fileName!),
                fileName: baseName(r.fileName),
              }))}
            />
          )}
        </Card>

        {share.kind === 'schedule' && done.length > 0 && (
          <Card>
            <details>
              <summary className="cursor-pointer px-5 py-3.5 text-sm font-medium text-fg sm:px-6">Embed the latest screenshots</summary>
              <div className="border-t border-line px-5 py-3 text-[13px] text-muted sm:px-6">
                These image links always show the newest run — paste them into docs, Notion or an &lt;img&gt; tag.
                <ul className="mt-3 space-y-1.5">
                  {done.map((r, i) => (
                    <li key={i} className="truncate font-mono text-fg">
                      {urlPath(r.url)}
                      {r.device ? ` (${r.device})` : ''}:{' '}
                      <span className="select-all text-muted">{`/share/${token}/image?url=${encodeURIComponent(r.url)}${r.device ? `&device=${encodeURIComponent(r.device)}` : ''}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </Card>
        )}

        <p className="pt-4 text-center text-xs text-faint">Captured with ShotDomain</p>
      </main>
    </div>
  );
}
