'use client';

import { useCallback, useMemo, useState } from 'react';
import { Card, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Controls';
import { Icon, Spinner } from '@/components/ui/Icon';
import { siteKey, urlHost, urlPath } from '@/lib/url';
import { LimitAwareError } from '@/components/billing/Upgrade';
import { usePlan } from '@/components/billing/PlanContext';
import { PLANS, cheapestPlanWith } from '@/lib/plans';

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
  /** Discovery was limited to this path (the URL entered had one). */
  pathPrefix?: string;
  /** Add pages the discovery didn't find (they're appended and selected). */
  onAddUrls?: (urls: string[]) => void;
  /** Go back to step 1 with the login section opened. */
  onAddLogin?: () => void;
  /** Most pages one capture may include (plan limit). */
  pageLimit?: number;
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
  pathPrefix,
  onAddUrls,
  onAddLogin,
  pageLimit = Infinity,
}: PageSelectionStepProps) {
  const { plan } = usePlan();
  const overLimit = selectedUrls.length > pageLimit;
  const nextPlan = overLimit ? cheapestPlanWith((l) => l.pagesPerRun >= selectedUrls.length) : undefined;
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
        if (siteKey(u.hostname) !== siteKey(root.hostname) || !/^https?:$/.test(u.protocol)) throw new Error();
        u.hash = '';
        added.push(u.toString());
      } catch {
        bad.push(line);
      }
    }
    if (bad.length) {
      setAddError(`Not on ${siteKey(root.hostname)}: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}`);
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
        <Spinner size={28} className="mx-auto text-fg" />
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
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-none bg-danger-soft text-danger">
          <Icon name="alert" size={20} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-fg">Couldn&apos;t discover pages</h2>
        <div className="mx-auto mt-3 max-w-md text-left">
          <LimitAwareError message={discoveryError} />
        </div>
        <Button className="mt-6" variant="secondary" icon="arrowLeft" onClick={onBack}>
          Try another URL
        </Button>
      </Card>
    );
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => selectedSet.has(u));
  // Each page keeps its number in the order it was found, whatever the filter.
  const frameNo = new Map(urls.map((u, i) => [u, i + 1]));

  // Home page and top-level sections, shortest first; capped at 25.
  const keyPageCap = Math.min(25, Number.isFinite(pageLimit) ? pageLimit : 25);
  const selectKeyPages = () => {
    const depth = (u: string) => {
      try {
        return new URL(u).pathname.split('/').filter(Boolean).length;
      } catch {
        return 99;
      }
    };
    const ranked = [...urls].sort((a, b) => depth(a) - depth(b) || a.length - b.length);
    const top = ranked.filter((u) => depth(u) <= 1);
    onSelectionChange((top.length >= 3 ? top : ranked).slice(0, keyPageCap));
  };

  return (
    <Card>
      <CardHeader
        title={`${urls.length} ${urls.length === 1 ? 'page' : 'pages'} found`}
        description={rootUrl ? urlHost(rootUrl) : undefined}
        actions={
          <>
            {pathPrefix && <Badge>Only {pathPrefix}</Badge>}
            {loggedIn && <Badge tone="success">Logged in</Badge>}
            <Badge>{discoveryMethod === 'sitemap' ? 'From sitemap' : 'From crawl'}</Badge>
          </>
        }
      />

      <div className="space-y-3 px-5 pt-4 sm:px-6">
        {truncated && <Alert tone="warning">Discovery stopped at 500 pages. This site may have more.</Alert>}
        {!loggedIn && urls.length <= 3 && onAddLogin && (
          <div className="flex flex-col gap-3 rounded-none border border-line-strong bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 text-[13px] text-fg">
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
          <div className="flex flex-wrap items-center gap-1">
            {onAddUrls && (
              <Button variant="ghost" size="sm" icon="plus" onClick={() => setAddOpen((o) => !o)}>
                Add pages
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon="sitemap"
              onClick={selectKeyPages}
              title={`Home page and top-level sections (up to ${keyPageCap})`}
            >
              Key pages
            </Button>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>
              Select none
            </Button>
          </div>
        </div>
        {addOpen && (
          <div className="space-y-2 rounded-none border border-line bg-subtle p-3">
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

      <div className="mx-5 mt-3 mb-4 overflow-hidden rounded-none border border-line-strong sm:mx-6">
        <label className="flex cursor-pointer items-center gap-3 border-b border-line bg-subtle px-3 py-2 text-xs font-semibold text-muted">
          <Checkbox
            checked={allFilteredSelected}
            onChange={() => (allFilteredSelected ? selectNone() : selectAll())}
            label="Toggle all visible pages"
          />
          <span>{query ? `${filtered.length} matching` : 'Page'}</span>
        </label>
        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-muted">{query ? 'No pages match this filter.' : 'No pages discovered.'}</li>
          ) : (
            filtered.map((url) => {
              const checked = selectedSet.has(url);
              // A picked page is marked in red, like a frame circled on a proof sheet.
              return (
                <li key={url}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 border-l-2 py-2 pr-3 pl-2.5 hover:bg-subtle ${checked ? 'border-accent' : 'border-transparent'}`}
                  >
                    <Checkbox checked={checked} onChange={() => toggle(url)} />
                    <span className="type-cond w-7 shrink-0 text-right text-[13px] text-faint tabular-nums">{frameNo.get(url)}</span>
                    <span className={`type-cond truncate text-[15px] ${checked ? 'text-fg' : 'text-muted'}`} title={url}>
                      {urlPath(url)}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {overLimit && (
        <div className="px-5 pb-4 sm:px-6">
          <LimitAwareError
            message={`${selectedUrls.length} pages selected. The ${PLANS[plan].name} plan captures up to ${pageLimit} at a time. Deselect some pages${nextPlan ? `, or Upgrade to ${nextPlan.name} for up to ${nextPlan.limits.pagesPerRun}` : ''}.`}
          />
          <button
            type="button"
            onClick={() => onSelectionChange(selectedUrls.slice(0, pageLimit))}
            className="mt-2 cursor-pointer text-[13px] font-semibold text-fg underline underline-offset-4 hover:decoration-2"
          >
            Keep the first {pageLimit} pages
          </button>
        </div>
      )}

      {selectedUrls.length > LARGE_SELECTION && (
        <div className="px-5 pb-4 sm:px-6">
          <Alert tone="warning">
            {selectedUrls.length} pages selected. Large captures can take a while.
          </Alert>
        </div>
      )}

      <CardFooter>
        <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            <span className="font-black text-fg tabular-nums">{selectedUrls.length}</span> of {urls.length} selected
          </span>
          <Button disabled={selectedUrls.length === 0 || overLimit} onClick={onContinue}>
            Continue
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
