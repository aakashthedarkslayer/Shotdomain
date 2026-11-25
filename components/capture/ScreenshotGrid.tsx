'use client';

import { useMemo, useState } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Controls';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { urlPath } from '@/lib/url';

export interface GridItem {
  key: string;
  url: string;
  device?: string;
  /** Image for the grid (a small preview when available). */
  src: string;
  /** Full-size image for the preview dialog and download (defaults to src). */
  fullSrc?: string;
  fileName: string;
  /** Note from the capture, e.g. "The page returned HTTP 404". */
  warning?: string;
}

/** Thumbnail grid with a device filter and a full-size preview; used by Results and share pages. */
export function ScreenshotGrid({
  items,
  emptyText = 'No screenshots.',
}: {
  items: GridItem[];
  emptyText?: string;
}) {
  const [device, setDevice] = useState('all');
  const [preview, setPreview] = useState<GridItem | null>(null);

  const devices = useMemo(() => Array.from(new Set(items.map((i) => i.device).filter(Boolean))) as string[], [items]);
  const visible = device === 'all' ? items : items.filter((i) => i.device === device);

  return (
    <>
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
        <p className="px-6 py-12 text-center text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {visible.map((item, index) => (
            <li key={item.key} className="card group overflow-hidden rounded-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
              <button
                type="button"
                onClick={() => setPreview(item)}
                className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden border-b border-line bg-subtle"
                aria-label={`Preview ${item.url}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={`Screenshot of ${item.url}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className="h-full w-full object-cover object-top"
                />
                {item.warning && (
                  <span title={item.warning} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-surface shadow-sm">
                    <Icon name="alert" size={13} />
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-fg" title={item.url}>
                    {urlPath(item.url)}
                  </p>
                  {item.warning ? (
                    <p className="truncate text-xs text-warning" title={item.warning}>
                      {item.warning}
                    </p>
                  ) : (
                    item.device && <p className="text-xs text-muted">{item.device}</p>
                  )}
                </div>
                <a
                  href={item.fullSrc ?? item.src}
                  download={item.fileName}
                  title="Download"
                  aria-label={`Download ${item.fileName}`}
                  className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg"
                >
                  <Icon name="download" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        size="xl"
        title={preview ? urlPath(preview.url) : ''}
        description={preview?.device}
        footer={
          preview && (
            <a href={preview.fullSrc ?? preview.src} download={preview.fileName} className={buttonClass('primary', 'md')}>
              <Icon name="download" />
              Download
            </a>
          )
        }
      >
        {preview && (
          <div className="bg-subtle p-4">
            {preview.warning && (
              <p className="mb-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">
                <Icon name="alert" size={15} className="mt-px shrink-0" />
                {preview.warning}
              </p>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.fullSrc ?? preview.src} alt={`Screenshot of ${preview.url}`} className="mx-auto w-auto max-w-full rounded border border-line" />
          </div>
        )}
      </Modal>
    </>
  );
}

/** Collapsible list of failed pages. */
export function FailedList({ items }: { items: { url: string; device?: string; error?: string }[] }) {
  if (items.length === 0) return null;
  return (
    <details className="card rounded-lg">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium text-danger sm:px-6 [&::-webkit-details-marker]:hidden">
        <Icon name="alert" />
        {items.length} {items.length === 1 ? 'page' : 'pages'} failed
        <Icon name="chevronDown" className="ml-auto text-muted" />
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {items.map((r, idx) => (
          <li key={idx} className="flex flex-col gap-0.5 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
            <span className="flex min-w-0 items-baseline gap-3">
              <span className="truncate font-mono text-[13px] text-fg" title={r.url}>
                {r.url}
              </span>
              {r.device ? <span className="shrink-0 text-xs text-muted">{r.device}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-danger">{r.error ?? 'Unknown error'}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
