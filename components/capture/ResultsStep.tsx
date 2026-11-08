'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button, buttonClass } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Controls';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { urlPath } from '@/lib/url';
import { thumbnailUrl } from './types';
import type { CaptureResult } from './types';

interface ResultsStepProps {
  jobId: string;
  results: CaptureResult[];
  onStartNew: () => void;
  onSaveSchedule?: () => void;
}

function baseName(fileName?: string) {
  return fileName?.split('/').pop() ?? '';
}

export default function ResultsStep({ jobId, results, onStartNew, onSaveSchedule }: ResultsStepProps) {
  const [device, setDevice] = useState('all');
  const [preview, setPreview] = useState<CaptureResult | null>(null);

  const done = results.filter((r) => r.status === 'done' && r.fileName);
  const failed = results.filter((r) => r.status === 'failed');
  const devices = useMemo(() => Array.from(new Set(done.map((r) => r.device).filter(Boolean))) as string[], [done]);
  const visible = device === 'all' ? done : done.filter((r) => r.device === device);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`${done.length} ${done.length === 1 ? 'screenshot' : 'screenshots'} ready`}
          description={failed.length > 0 ? `${failed.length} failed — see the list below.` : 'Download them individually or as one ZIP.'}
          actions={
            <>
              {onSaveSchedule && (
                <Button variant="ghost" icon="clock" onClick={onSaveSchedule}>
                  Save as schedule
                </Button>
              )}
              <Button variant="secondary" icon="plus" onClick={onStartNew}>
                New capture
              </Button>
              <a href={`/api/capture/download?jobId=${encodeURIComponent(jobId)}`} download className={buttonClass('primary', 'md')}>
                <Icon name="download" />
                Download ZIP
              </a>
            </>
          }
        />

        {devices.length > 1 && (
          <div className="border-b border-line px-5 py-3 sm:px-6">
            <Segmented
              size="sm"
              label="Filter by device"
              value={device}
              onChange={setDevice}
              options={[{ value: 'all', label: 'All' }, ...devices.map((d) => ({ value: d, label: d }))]}
            />
          </div>
        )}

        {visible.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">No screenshots were captured.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {visible.map((r, idx) => {
              const src = thumbnailUrl(jobId, r.fileName!);
              return (
                <li key={`${r.device ?? ''}-${r.fileName}-${idx}`} className="group overflow-hidden rounded-lg border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setPreview(r)}
                    className="block aspect-[4/3] w-full cursor-zoom-in overflow-hidden border-b border-line bg-subtle"
                    aria-label={`Preview ${r.url}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Screenshot of ${r.url}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                    />
                  </button>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[13px] text-fg" title={r.url}>
                        {urlPath(r.url)}
                      </p>
                      {r.device && <p className="text-xs text-muted">{r.device}</p>}
                    </div>
                    <a
                      href={src}
                      download={baseName(r.fileName)}
                      title="Download"
                      aria-label={`Download ${baseName(r.fileName)}`}
                      className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg"
                    >
                      <Icon name="download" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {failed.length > 0 && (
        <Card>
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium text-danger sm:px-6 [&::-webkit-details-marker]:hidden">
              <Icon name="alert" />
              {failed.length} {failed.length === 1 ? 'page' : 'pages'} failed
              <Icon name="chevronDown" className="ml-auto text-muted" />
            </summary>
            <ul className="divide-y divide-line border-t border-line">
              {failed.map((r, idx) => (
                <li key={idx} className="flex flex-col gap-0.5 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
                  <span className="truncate font-mono text-[13px] text-fg" title={r.url}>
                    {r.url}
                    {r.device ? <span className="text-muted"> · {r.device}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-danger">{r.error ?? 'Unknown error'}</span>
                </li>
              ))}
            </ul>
          </details>
        </Card>
      )}

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        size="xl"
        title={preview ? urlPath(preview.url) : ''}
        description={preview?.device}
        footer={
          preview?.fileName && (
            <a href={thumbnailUrl(jobId, preview.fileName)} download={baseName(preview.fileName)} className={buttonClass('primary', 'md')}>
              <Icon name="download" />
              Download
            </a>
          )
        }
      >
        {preview?.fileName && (
          <div className="bg-subtle p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl(jobId, preview.fileName)} alt={`Screenshot of ${preview.url}`} className="mx-auto w-auto max-w-full rounded border border-line" />
          </div>
        )}
      </Modal>
    </div>
  );
}
