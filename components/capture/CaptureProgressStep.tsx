'use client';

import { useEffect, useState } from 'react';
import { Card, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Controls';
import { Icon, Spinner } from '@/components/ui/Icon';
import { urlPath } from '@/lib/url';
import { previewUrl } from './types';
import type { CaptureResult } from './types';

interface CaptureProgressStepProps {
  jobId: string;
  total: number;
  completed: number;
  failed: number;
  results: CaptureResult[];
  onRetry: (url: string, device?: string) => void;
  onCancel: () => void;
  onViewResults: () => void;
  isComplete: boolean;
}

function StatusIcon({ status }: { status: CaptureResult['status'] }) {
  switch (status) {
    case 'queued':
      return <span className="block h-4 w-4 rounded-full border-[1.5px] border-dashed border-line-strong" title="Queued" />;
    case 'capturing':
      return <Spinner size={16} className="text-accent" />;
    case 'done':
      return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-white" title="Done">
          <Icon name="check" size={11} strokeWidth={3} />
        </span>
      );
    case 'failed':
      return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white" title="Failed">
          <Icon name="x" size={11} strokeWidth={3} />
        </span>
      );
  }
}

/** "1m 05s" */
function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

export default function CaptureProgressStep({
  jobId,
  total,
  completed,
  failed,
  results,
  onRetry,
  onCancel,
  onViewResults,
  isComplete,
}: CaptureProgressStepProps) {
  const processed = completed + failed;
  const pct = total === 0 ? 0 : Math.round((processed / total) * 100);
  const showDevice = new Set(results.map((r) => r.device)).size > 1;
  const notes = results.filter((r) => r.status === 'done' && r.warning).length;

  // Elapsed time, ticking once a second while the capture runs.
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    if (isComplete) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isComplete]);
  const elapsed = now - startedAt;
  const etaMs = processed > 0 && processed < total ? ((total - processed) * elapsed) / processed : undefined;

  // The newest finished screenshot: captures run in list order, four at a time.
  const latest = [...results].reverse().find((r) => r.status === 'done' && r.fileName);

  return (
    <Card>
      <div className="space-y-4 border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-fg">{isComplete ? 'Capture finished' : 'Capturing…'}</h2>
              {isComplete ? <Badge tone={failed > 0 ? 'warning' : 'success'}>Done</Badge> : <Badge tone="accent">Running</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {completed} captured
              {failed > 0 && <span className="text-danger"> · {failed} failed</span>}
              {notes > 0 && <span className="text-warning"> · {notes} with notes</span>}
              {' · '}
              {total} total
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-semibold tabular-nums text-fg">{pct}%</span>
            <p className="text-xs text-muted tabular-nums">
              {isComplete ? `Took ${duration(elapsed)}` : etaMs !== undefined ? `${duration(elapsed)} · about ${duration(etaMs)} left` : duration(elapsed)}
            </p>
          </div>
        </div>
        <ProgressBar value={pct} tone={isComplete && failed === 0 ? 'success' : 'accent'} />
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_240px]">
        <ul className="max-h-[460px] divide-y divide-line overflow-y-auto">
          {results.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-muted">Nothing queued.</li>
          ) : (
            results.map((r, idx) => (
              <li key={`${r.device ?? ''}-${r.url}-${idx}`} className="flex items-center gap-3 px-5 py-2.5 sm:px-6">
                <StatusIcon status={r.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[13px] text-fg" title={r.url}>
                      {urlPath(r.url)}
                    </span>
                    {showDevice && r.device && <Badge>{r.device}</Badge>}
                  </div>
                  {r.status === 'done' && r.warning && (
                    <p className="flex items-start gap-1 text-xs text-warning" title={r.warning}>
                      <Icon name="alert" size={12} className="mt-0.5 shrink-0" />
                      <span className="truncate">{r.warning}</span>
                    </p>
                  )}
                  {r.status === 'failed' && r.error && (
                    <p className="truncate text-xs text-danger" title={r.error}>
                      {r.error}
                    </p>
                  )}
                </div>
                {r.status === 'done' && r.fileName && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl(jobId, r.fileName)}
                    alt=""
                    loading="lazy"
                    className="h-8 w-12 shrink-0 rounded border border-line bg-subtle object-cover object-top"
                  />
                )}
                {r.status === 'failed' && (
                  <Button variant="secondary" size="sm" icon="refresh" onClick={() => onRetry(r.url, r.device)}>
                    Retry
                  </Button>
                )}
              </li>
            ))
          )}
        </ul>

        {/* Live preview of the newest screenshot */}
        <aside className="hidden border-l border-line bg-subtle/40 p-4 md:block">
          {latest?.fileName ? (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                {!isComplete && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />}
                {isComplete ? 'Last captured' : 'Just captured'}
              </p>
              <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={latest.fileName} src={previewUrl(jobId, latest.fileName)} alt={`Screenshot of ${latest.url}`} className="block max-h-72 w-full object-cover object-top" />
              </div>
              <p className="truncate font-mono text-xs text-fg" title={latest.url}>
                {urlPath(latest.url)}
              </p>
              {latest.device && <p className="text-xs text-muted">{latest.device}</p>}
            </div>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted">
              <Icon name="image" size={20} className="text-faint" />
              The first screenshot appears here
            </div>
          )}
        </aside>
      </div>

      <CardFooter>
        {isComplete ? (
          <>
            <span className="text-sm text-muted">{failed > 0 ? 'You can retry failed pages above.' : 'All pages captured.'}</span>
            <Button iconRight="arrowRight" onClick={onViewResults} disabled={completed === 0}>
              View {completed} {completed === 1 ? 'screenshot' : 'screenshots'}
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-muted">Up to 4 pages are captured at a time.</span>
            <Button variant="danger" onClick={onCancel}>
              Cancel remaining
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
