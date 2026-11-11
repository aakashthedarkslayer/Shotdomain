'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { urlPath } from '@/lib/url';
import { ShareDialog } from './ShareDialog';
import type { ShareTarget } from './ShareDialog';

/**
 * Per-page sharing for a schedule (like Stillio's per-webpage sharing):
 * pick a page (and device) to get an "all screenshots" link and an
 * always-latest image link.
 */
export function SharePagesList({ scheduleId, urls, devices }: { scheduleId: string; urls: string[]; devices: string[] }) {
  const [device, setDevice] = useState(devices[0] ?? 'Desktop');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<ShareTarget | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? urls.filter((u) => u.toLowerCase().includes(q)) : urls;
  }, [urls, query]);

  return (
    <details className="group mb-4 rounded-xl border border-line bg-field">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden">
        <Icon name="link" size={14} className="text-accent" />
        Share individual pages
        <span className="text-xs font-normal text-muted">— a timeline and an always-latest image per page</span>
        <Icon name="chevronDown" size={14} className="ml-auto text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-line p-3">
        <div className="flex flex-wrap items-center gap-2">
          {urls.length > 6 && (
            <div className="min-w-48 flex-1">
              <Input icon="search" placeholder="Filter pages…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter pages to share" />
            </div>
          )}
          {devices.length > 1 && (
            <Segmented size="sm" label="Device" value={device} onChange={setDevice} options={devices.map((d) => ({ value: d, label: d }))} />
          )}
        </div>
        <ul className="max-h-72 divide-y divide-line overflow-y-auto">
          {filtered.map((u) => (
            <li key={u} className="flex items-center justify-between gap-3 py-1.5">
              <span className="truncate font-mono text-[13px] text-fg" title={u}>
                {urlPath(u)}
              </span>
              <Button size="sm" variant="ghost" icon="link" onClick={() => setTarget({ kind: 'page', scheduleId, pageUrl: u, device })}>
                Share
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <ShareDialog target={target} onClose={() => setTarget(null)} />
    </details>
  );
}

export default SharePagesList;
