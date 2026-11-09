'use client';

import { Card, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Controls';
import { Icon, Spinner } from '@/components/ui/Icon';
import { urlPath } from '@/lib/url';
import { thumbnailUrl } from './types';
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

  return (
    <Card>
      <div className="space-y-4 border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-fg">{isComplete ? 'Capture finished' : 'Capturing…'}</h2>
              {isComplete ? <Badge tone="success">Done</Badge> : <Badge tone="accent">Running</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {completed} captured
              {failed > 0 && <span className="text-danger"> · {failed} failed</span>}
              {' · '}
              {total} total
            </p>
          </div>
          <span className="font-mono text-2xl font-semibold tabular-nums text-fg">{pct}%</span>
        </div>
        <ProgressBar value={pct} tone={isComplete && failed === 0 ? 'success' : 'accent'} />
      </div>

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
                  <p className="truncate text-xs text-warning" title={r.warning}>
                    {r.warning}
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
                  src={thumbnailUrl(jobId, r.fileName)}
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

      <CardFooter>
        {isComplete ? (
          <>
            <span className="text-sm text-muted">
              {failed > 0 ? 'You can retry failed pages above.' : 'All pages captured.'}
            </span>
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
