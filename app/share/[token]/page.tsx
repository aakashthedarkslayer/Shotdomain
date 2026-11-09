import { notFound } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Card, CardHeader } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ScreenshotGrid } from '@/components/capture/ScreenshotGrid';
import { getShare, resolvePageShare, resolveScheduleShare, resolveShare } from '@/lib/shareStore';
import type { PageTimeline, ScheduleIndex } from '@/lib/shareStore';
import { Badge } from '@/components/ui/Badge';
import { baseName, formatDateTime } from '@/lib/format';
import { urlPath } from '@/lib/url';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shared screenshots — ShotDomain', robots: { index: false, follow: false } };

function utc(ts: number) {
  return new Date(ts).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC';
}

function ShareHeader() {
  return (
    <header className="glass-strong border-x-0 border-t-0 !shadow-none">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <span className="text-xs text-muted">Shared read-only link</span>
      </div>
    </header>
  );
}

/** "All screenshots" of one page across scheduled runs, newest first. */
function PageTimelineView({ token, timeline }: { token: string; timeline: PageTimeline }) {
  const [latest, ...older] = timeline.shots;
  const img = (runId: string) => `/share/${token}/image?run=${runId}`;
  return (
    <div className="min-h-screen pb-24">
      <ShareHeader />
      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-8 sm:px-6">
        <Card>
          <CardHeader
            title={<span className="font-mono text-[15px]">{urlPath(timeline.pageUrl)}</span>}
            description={`${new URL(timeline.pageUrl).hostname} · ${timeline.device ?? 'Desktop'} · ${timeline.shots.length} ${
              timeline.shots.length === 1 ? 'screenshot' : 'screenshots'
            } from “${timeline.scheduleName}”`}
            actions={
              timeline.shots.length > 0 && (
                <a href={`/share/${token}/download`} className={buttonClass('primary', 'md')}>
                  <Icon name="download" />
                  Download all
                </a>
              )
            }
          />
          {!latest ? (
            <p className="px-6 py-12 text-center text-sm text-muted">No screenshots of this page yet — check back after the next scheduled run.</p>
          ) : (
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-fg">
                  <Badge tone="accent">Latest</Badge>
                  {utc(latest.timestamp)}
                </div>
                <a href={`/share/${token}/latest`} className={buttonClass('ghost', 'sm')}>
                  <Icon name="link" size={14} /> Always-latest image link
                </a>
              </div>
              <a href={img(latest.runId)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(latest.runId)} alt={`Latest screenshot of ${timeline.pageUrl}`} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain object-top" />
              </a>
            </div>
          )}
        </Card>

        {older.length > 0 && (
          <Card>
            <CardHeader title="Earlier screenshots" description="Newest first. Times are in UTC." />
            <ul className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 sm:p-6 lg:grid-cols-4">
              {older.map((s) => (
                <li key={s.runId} className="glass group overflow-hidden rounded-xl">
                  <a href={img(s.runId)} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden border-b border-line bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(s.runId)} alt={`Screenshot from ${utc(s.timestamp)}`} loading="lazy" className="h-full w-full object-cover object-top transition group-hover:scale-[1.02]" />
                  </a>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-xs text-fg">{utc(s.timestamp)}</span>
                    <a href={img(s.runId)} download={`${new Date(s.timestamp).toISOString().slice(0, 16).replace(/:/g, '-')}${s.fileName.slice(s.fileName.lastIndexOf('.'))}`} aria-label="Download" className="rounded-md p-1 text-muted hover:bg-subtle hover:text-fg">
                      <Icon name="download" size={14} />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <p className="pt-4 text-center text-xs text-faint">Captured with ShotDomain</p>
      </main>
    </div>
  );
}

/** Stillio-style "All Screenshots" index of a schedule: every kept run, newest first. */
function ScheduleIndexView({ token, index, latestOnly }: { token: string; index: ScheduleIndex; latestOnly: boolean }) {
  const runs = latestOnly ? index.runs.slice(0, 1) : index.runs;
  const host = new URL(index.targetUrl).hostname;
  return (
    <div className="min-h-screen pb-24">
      <ShareHeader />
      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-8 sm:px-6">
        <Card>
          <CardHeader
            title={index.scheduleName}
            description={
              latestOnly
                ? `Latest screenshots of ${host}. Times are in UTC.`
                : `All screenshots of ${host} · ${index.runs.length} ${index.runs.length === 1 ? 'capture' : 'captures'}, newest first. Times are in UTC.`
            }
            actions={
              latestOnly ? (
                <a href={`/share/${token}`} className={buttonClass('secondary', 'md')}>
                  <Icon name="layers" /> All screenshots
                </a>
              ) : null
            }
          />
          {index.runs.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">No screenshots yet — check back after the first scheduled run.</p>}
        </Card>

        {runs.map((run, i) => {
          const items = run.shots.map((shot, j) => ({
            key: `${run.runId}-${j}`,
            url: shot.url,
            device: shot.device,
            src: `/share/${token}/image?run=${run.runId}&file=${encodeURIComponent(shot.fileName)}`,
            fileName: baseName(shot.fileName),
            badge:
              typeof shot.changePct === 'number' && shot.changePct >= 1
                ? { text: `${shot.changePct}% changed`, tone: 'warning' as const }
                : undefined,
          }));
          const status = !run.compared ? (
            <Badge>First capture</Badge>
          ) : run.changedPages ? (
            <Badge tone="warning" dot>
              {run.changedPages} {run.changedPages === 1 ? 'page' : 'pages'} changed
            </Badge>
          ) : (
            <Badge tone="success">No changes</Badge>
          );
          const header = (
            <div className="flex flex-wrap items-center gap-2">
              {i === 0 && <Badge tone="accent">Latest</Badge>}
              <span className="text-sm font-semibold text-fg">{utc(run.timestamp)}</span>
              {status}
              <span className="text-xs text-muted">
                {run.shots.length} {run.shots.length === 1 ? 'screenshot' : 'screenshots'}
              </span>
            </div>
          );
          const zip = (
            <a href={`/share/${token}/download?run=${run.runId}`} className={buttonClass('ghost', 'sm')}>
              <Icon name="download" size={14} /> ZIP
            </a>
          );
          return i === 0 ? (
            <Card key={run.runId}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-6">
                {header}
                {zip}
              </div>
              <ScreenshotGrid items={items} />
            </Card>
          ) : (
            <Card key={run.runId}>
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6 [&::-webkit-details-marker]:hidden">
                  {header}
                  <span className="flex items-center gap-2">
                    {zip}
                    <Icon name="chevronDown" size={16} className="text-muted transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t border-line">
                  <ScreenshotGrid items={items} />
                </div>
              </details>
            </Card>
          );
        })}

        {index.runs[0] && (
          <Card>
            <details>
              <summary className="cursor-pointer px-5 py-3.5 text-sm font-medium text-fg sm:px-6">Embed the latest screenshot of a page</summary>
              <div className="border-t border-line px-5 py-3 text-[13px] text-muted sm:px-6">
                These image links always show the newest capture — paste them into docs, Notion or an &lt;img&gt; tag.
                <ul className="mt-3 space-y-1.5">
                  {index.runs[0].shots.map((r, i) => (
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

/** Public, read-only view of a share link. No sign-in. */
export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { token } = await params;
  const { view } = await searchParams;
  const share = await getShare(token);
  if (share?.kind === 'schedule') {
    const index = await resolveScheduleShare(share);
    if (!index) notFound();
    return <ScheduleIndexView token={token} index={index} latestOnly={view === 'latest'} />;
  }
  if (share?.kind === 'page') {
    const timeline = await resolvePageShare(share);
    if (!timeline) notFound();
    return <PageTimelineView token={token} timeline={timeline} />;
  }
  const content = share ? await resolveShare(share) : null;
  if (!share || !content) notFound();

  const done = content.results.filter((r) => r.status === 'done' && r.fileName);
  const img = (file: string) => `/share/${token}/image?file=${encodeURIComponent(file)}`;

  return (
    <div className="min-h-screen pb-24">
      <ShareHeader />
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

        <p className="pt-4 text-center text-xs text-faint">Captured with ShotDomain</p>
      </main>
    </div>
  );
}
