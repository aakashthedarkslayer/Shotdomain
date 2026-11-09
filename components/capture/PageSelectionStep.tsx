'use client';

import { useCallback, useMemo, useState } from 'react';
import { Card, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Controls';
import { Icon, Spinner } from '@/components/ui/Icon';
import { urlHost, urlPath } from '@/lib/url';

interface PageSelectionStepProps {
  urls: string[];
  selectedUrls: string[];
  onSelectionChange: (urls: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  discoveryMethod: 'sitemap' | 'crawl';
  truncated: boolean;
  isDiscovering?: boolean;
  discoveryStatus?: string;
  discoveryError?: string;
  rootUrl?: string;
  loggedIn?: boolean;
  /** Add pages the discovery didn't find (they're appended and selected). */
  onAddUrls?: (urls: string[]) => void;
  /** Go back to step 1 with the login section opened. */
  onAddLogin?: () => void;
}

const LARGE_SELECTION = 200;

export default function PageSelectionStep({
  urls,
  selectedUrls,
  onSelectionChange,
  onContinue,
  onBack,
  discoveryMethod,
  truncated,
  isDiscovering = false,
  discoveryStatus = 'Checking sitemap.xml…',
  discoveryError,
  rootUrl,
  loggedIn,
  onAddUrls,
  onAddLogin,
}: PageSelectionStepProps) {
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState('');
  const [addError, setAddError] = useState('');

  function addPages() {
    if (!rootUrl || !onAddUrls) return;
    const root = new URL(rootUrl);
    const added: string[] = [];
    const bad: string[] = [];
    for (const line of addText.split(/\n|,/).map((l) => l.trim()).filter(Boolean)) {
      try {
        const u = new URL(line, root);
        if (u.hostname !== root.hostname || !/^https?:$/.test(u.protocol)) throw new Error();
        u.hash = '';
        added.push(u.toString());
      } catch {
        bad.push(line);
      }
    }
    if (bad.length) {
      setAddError(`Not on ${root.hostname}: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}`);
      return;
    }
    if (added.length) onAddUrls(added);
    setAddText('');
    setAddError('');
    setAddOpen(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? urls.filter((u) => u.toLowerCase().includes(q)) : urls;
  }, [urls, query]);

  const selectedSet = useMemo(() => new Set(selectedUrls), [selectedUrls]);

  const toggle = useCallback(
    (url: string) => {
      onSelectionChange(selectedSet.has(url) ? selectedUrls.filter((u) => u !== url) : [...selectedUrls, url]);
    },
    [selectedSet, selectedUrls, onSelectionChange],
  );

  const selectAll = useCallback(() => {
    const next = new Set(selectedUrls);
    filtered.forEach((u) => next.add(u));
    onSelectionChange(Array.from(next));
  }, [filtered, selectedUrls, onSelectionChange]);

  const selectNone = useCallback(() => {
    const remove = new Set(filtered);
    onSelectionChange(selectedUrls.filter((u) => !remove.has(u)));
  }, [filtered, selectedUrls, onSelectionChange]);

  if (isDiscovering) {
    return (
      <Card className="mx-auto max-w-xl px-6 py-14 text-center">
        <Spinner size={28} className="mx-auto text-accent" />
        <h2 className="mt-5 text-base font-semibold text-fg">Finding pages{rootUrl ? ` on ${urlHost(rootUrl)}` : ''}</h2>
        <p className="mt-1 text-sm text-muted" aria-live="polite">
          {discoveryStatus}
        </p>
      </Card>
    );
  }

  if (discoveryError) {
    return (
      <Card className="mx-auto max-w-xl px-6 py-12 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon name="alert" size={20} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-fg">Couldn&apos;t discover pages</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{discoveryError}</p>
        <Button className="mt-6" variant="secondary" icon="arrowLeft" onClick={onBack}>
          Try another URL
        </Button>
      </Card>
    );
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => selectedSet.has(u));

  return (
    <Card>
      <CardHeader
        title={`${urls.length} ${urls.length === 1 ? 'page' : 'pages'} found`}
        description={rootUrl ? urlHost(rootUrl) : undefined}
        actions={
          <>
            {loggedIn && <Badge tone="success" dot>Logged in</Badge>}
            <Badge tone={discoveryMethod === 'sitemap' ? 'success' : 'accent'}>{discoveryMethod === 'sitemap' ? 'From sitemap' : 'From crawl'}</Badge>
          </>
        }
      />

      <div className="space-y-3 px-5 pt-4 sm:px-6">
        {truncated && <Alert tone="warning">Discovery stopped at 500 pages — this site may have more.</Alert>}
        {!loggedIn && urls.length <= 3 && onAddLogin && (
          <div className="flex flex-col gap-3 rounded-xl bg-accent-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 text-[13px] text-accent">
              <Icon name="shield" size={16} className="mt-px shrink-0" />
              <span>
                <b>Only {urls.length} {urls.length === 1 ? 'page' : 'pages'} found.</b> If this site needs a login (a web app or dashboard),
                ShotDomain only sees its public sign-in page. Add your session to find and capture the pages behind it.
              </span>
            </div>
            <Button size="sm" icon="shield" onClick={onAddLogin}>
              Add a login
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input icon="search" placeholder="Filter by URL…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter pages" />
          </div>
          <div className="flex items-center gap-1">
            {onAddUrls && (
              <Button variant="ghost" size="sm" icon="plus" onClick={() => setAddOpen((o) => !o)}>
                Add pages
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              Select none
            </Button>
          </div>
        </div>
        {addOpen && (
          <div className="space-y-2 rounded-lg border border-line bg-subtle/50 p-3">
            <Textarea
              aria-label="Pages to add"
              rows={3}
              placeholder={'/dashboard\n/settings/billing\nhttps://app.example.com/reports'}
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
            />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[13px] ${addError ? 'text-danger' : 'text-muted'}`}>
                {addError || 'One path or URL per line, on the same site. Useful for app pages that aren’t linked.'}
              </span>
              <Button size="sm" onClick={addPages} disabled={!addText.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-5 mt-3 mb-4 overflow-hidden rounded-lg border border-line sm:mx-6">
        <div className="flex items-center gap-3 border-b border-line bg-subtle px-3 py-2 text-xs font-medium text-muted">
          <Checkbox
            checked={allFilteredSelected}
            onChange={() => (allFilteredSelected ? selectNone() : selectAll())}
            label="Toggle all visible pages"
          />
          <span>{query ? `${filtered.length} matching` : 'Page'}</span>
        </div>
        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-muted">{query ? 'No pages match this filter.' : 'No pages discovered.'}</li>
          ) : (
            filtered.map((url) => {
              const checked = selectedSet.has(url);
              return (
                <li key={url}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-subtle">
                    <Checkbox checked={checked} onChange={() => toggle(url)} />
                    <span className={`truncate font-mono text-[13px] ${checked ? 'text-fg' : 'text-muted'}`} title={url}>
                      {urlPath(url)}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {selectedUrls.length > LARGE_SELECTION && (
        <div className="px-5 pb-4 sm:px-6">
          <Alert tone="warning">
            {selectedUrls.length} pages selected — large captures can take a while.
          </Alert>
        </div>
      )}

      <CardFooter>
        <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            <span className="font-medium text-fg">{selectedUrls.length}</span> of {urls.length} selected
          </span>
          <Button iconRight="arrowRight" disabled={selectedUrls.length === 0} onClick={onContinue}>
            Continue
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
