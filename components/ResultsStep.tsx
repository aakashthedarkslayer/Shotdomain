'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface ResultsStepProps {
  jobId: string;
  results: Array<{
    url: string;
    device?: string;
    status: 'queued' | 'capturing' | 'done' | 'failed';
    fileName?: string;
    error?: string;
  }>;
  onStartNew: () => void;
  onSaveSchedule?: () => void;
}

export default function ResultsStep({ jobId, results, onStartNew, onSaveSchedule }: ResultsStepProps) {
  const [failedOpen, setFailedOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const doneResults = results.filter((r) => r.status === 'done');
  const failedResults = results.filter((r) => r.status === 'failed');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ViewfinderFrame
        frameLabel="FRAME 05 // PROOF SHEET ARCHIVE"
        badge={`${doneResults.length} EXPOSURES READY`}
        className="rounded-2xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900/90 shadow-xs overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          {/* Header & Success Celebration */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#121315] text-[#E54D2E] shadow-xs dark:bg-stone-100 dark:text-[#E54D2E]">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-white">
              Proof Sheet Ready
            </h2>
            <p className="mt-1 text-xs font-mono text-stone-500 dark:text-stone-400">
              {doneResults.length} {doneResults.length === 1 ? 'screenshot' : 'screenshots'} captured successfully
              {failedResults.length > 0 ? ` (${failedResults.length} failed)` : ''}
            </p>

            {/* Primary Action Buttons Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`/api/capture/download?jobId=${encodeURIComponent(jobId)}`}
                download
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#E54D2E] hover:bg-[#d03f22] text-white font-mono text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All (ZIP)
              </a>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onStartNew}
                leftIcon={
                  <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Start New Capture
              </Button>

              {onSaveSchedule && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onSaveSchedule}
                  leftIcon={
                    <svg className="h-4 w-4 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  Save as Schedule
                </Button>
              )}
            </div>
          </div>

          {/* Responsive Contact Sheet Thumbnail Grid */}
          {doneResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {doneResults.map((result, idx) => {
                const fileUrl = `/api/thumbnail?jobId=${encodeURIComponent(jobId)}&file=${encodeURIComponent(result.fileName ?? '')}`;
                const displayName = result.fileName ? (result.fileName.includes('/') ? result.fileName.split('/').pop() : result.fileName) : '';
                return (
                  <div
                    key={`${result.device || ''}-${result.fileName || result.url}-${idx}`}
                    className="group relative flex flex-col rounded-xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900 overflow-hidden shadow-xs hover:border-[#E54D2E]/60 transition-all"
                  >
                    {/* Frame Index Bar */}
                    <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-mono text-stone-500 bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                      <span>#{(idx + 1).toString().padStart(2, '0')}</span>
                      {result.device && (
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {result.device}
                        </span>
                      )}
                    </div>

                    {/* Thumbnail Image Container */}
                    <div
                      onClick={() => setLightboxUrl(fileUrl)}
                      className="aspect-video w-full overflow-hidden bg-stone-100 dark:bg-stone-800 relative cursor-zoom-in group"
                    >
                      <img
                        src={fileUrl}
                        alt={`Screenshot of ${result.url}`}
                        className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[#121315]/0 group-hover:bg-[#121315]/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-white bg-black/70 px-2 py-1 rounded">
                          Inspect
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Direct Download */}
                    <div className="p-2.5 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                      <span
                        title={result.fileName}
                        className="truncate text-xs font-mono text-stone-700 dark:text-stone-300"
                      >
                        {displayName || result.fileName}
                      </span>
                      <a
                        href={fileUrl}
                        download={displayName || result.fileName}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-[#E54D2E] hover:border-[#E54D2E]/40 shadow-xs transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400"
                        title="Download image"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Failed Captures Collapsible */}
          {failedResults.length > 0 && (
            <div className="mt-8 rounded-xl border border-rose-200/80 bg-rose-50/40 dark:border-rose-900/30 dark:bg-rose-950/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setFailedOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-5 py-3 text-xs font-mono font-medium text-rose-800 dark:text-rose-300 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{failedResults.length} {failedResults.length === 1 ? 'capture' : 'captures'} failed</span>
                </div>
                <svg
                  className={`h-4 w-4 text-rose-500 transition-transform duration-200 ${
                    failedOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {failedOpen && (
                <ul className="divide-y divide-rose-100 dark:divide-rose-900/30 border-t border-rose-200/60 dark:border-rose-900/40">
                  {failedResults.map((result, idx) => (
                    <li key={idx} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="truncate text-xs font-mono text-rose-900 dark:text-rose-200" title={result.url}>
                        {result.url}
                      </span>
                      <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 shrink-0">
                        {result.error ?? 'Unknown error'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </ViewfinderFrame>

      {/* Lightbox Zoom Modal */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121315]/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-auto bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxUrl}
              alt="Enlarged screenshot"
              className="rounded-xl max-h-[85vh] w-auto mx-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
