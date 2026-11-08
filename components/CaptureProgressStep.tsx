'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface CaptureResult {
  url: string;
  device?: string;
  status: 'queued' | 'capturing' | 'done' | 'failed';
  fileName?: string;
  error?: string;
}

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
      return (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 text-xs font-mono font-semibold"
          title="Queued"
        >
          ○
        </span>
      );
    case 'capturing':
      return (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-[#E54D2E] dark:bg-orange-950/50 dark:text-[#FF5733]"
          title="Capturing screenshot"
        >
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      );
    case 'done':
      return (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          title="Captured successfully"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    case 'failed':
      return (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
          title="Failed to capture"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
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
  const percentage = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((completed + failed) / total) * 100);
  }, [total, completed, failed]);

  return (
    <div className="mx-auto max-w-3xl">
      <ViewfinderFrame
        frameLabel="FRAME 04 // DARKROOM EXPOSURE PROGRESS"
        badge={`${percentage}% EXPOSED`}
        className="rounded-2xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900/90 shadow-xs overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-6 sm:p-7 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-2xl font-normal tracking-tight text-stone-900 dark:text-white">
                  Darkroom Developing
                </h2>
                <Badge
                  variant={isComplete ? 'success' : 'info'}
                  dot
                >
                  {isComplete ? 'Exposure Complete' : 'Capturing in progress'}
                </Badge>
              </div>
              <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-1">
                Using Playwright headless browser pool with 4 concurrent workers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-stone-900 dark:text-white font-mono">
                {percentage}%
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                ({completed} of {total} captured{failed > 0 ? `, ${failed} failed` : ''})
              </span>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-800">
            <div
              className="h-full rounded-full bg-[#E54D2E] transition-all duration-300 ease-out shadow-xs shadow-orange-500/30"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Per-URL Result Rows */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-stone-400 dark:text-stone-500">
              No URLs queued for capture.
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={`${result.device || ''}-${result.url}-${idx}`}
                className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <StatusIcon status={result.status} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {result.device && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shrink-0">
                          {result.device}
                        </span>
                      )}
                      <p className="truncate text-xs font-mono text-stone-800 dark:text-stone-200" title={result.url}>
                        {result.url}
                      </p>
                    </div>
                    {result.status === 'failed' && result.error && (
                      <p className="mt-0.5 truncate text-[11px] font-mono text-rose-500 dark:text-rose-400" title={result.error}>
                        {result.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side status / preview / retry */}
                <div className="shrink-0 flex items-center gap-3">
                  {result.status === 'done' && result.fileName && (
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[11px] font-mono text-stone-400 dark:text-stone-500">
                        {result.fileName}
                      </span>
                      <img
                        src={`/api/thumbnail?jobId=${encodeURIComponent(jobId)}&file=${encodeURIComponent(result.fileName)}`}
                        alt={`Preview of ${result.url}`}
                        className="h-9 w-14 rounded-lg border border-stone-200/80 object-cover shadow-xs dark:border-stone-700 bg-stone-100"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {result.status === 'failed' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(result.url, result.device)}
                      leftIcon={
                        <svg className="h-3.5 w-3.5 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      }
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/30 dark:bg-stone-900/30">
          {!isComplete ? (
            <>
              <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                You can cancel remaining queued captures at any time.
              </span>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={onCancel}
              >
                Cancel Capture
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-stone-700 dark:text-stone-300">
                  Finished exposing all plates
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={onViewResults}
                rightIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              >
                View Results ({completed})
              </Button>
            </>
          )}
        </div>
      </ViewfinderFrame>
    </div>
  );
}
