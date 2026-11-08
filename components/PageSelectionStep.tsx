'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

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
}

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
}: PageSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUrls = useMemo(() => {
    if (!searchQuery.trim()) return urls;
    const lower = searchQuery.toLowerCase();
    return urls.filter((url) => url.toLowerCase().includes(lower));
  }, [urls, searchQuery]);

  const selectedSet = useMemo(() => new Set(selectedUrls), [selectedUrls]);

  const handleToggle = useCallback(
    (url: string) => {
      if (selectedSet.has(url)) {
        onSelectionChange(selectedUrls.filter((u) => u !== url));
      } else {
        onSelectionChange([...selectedUrls, url]);
      }
    },
    [selectedSet, selectedUrls, onSelectionChange],
  );

  const handleSelectAll = useCallback(() => {
    const combined = new Set(selectedUrls);
    for (const url of filteredUrls) {
      combined.add(url);
    }
    onSelectionChange(Array.from(combined));
  }, [filteredUrls, selectedUrls, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    const filtered = new Set(filteredUrls);
    onSelectionChange(selectedUrls.filter((u) => !filtered.has(u)));
  }, [filteredUrls, selectedUrls, onSelectionChange]);

  const totalCount = urls.length;
  const selectedCount = selectedUrls.length;
  const isDisabled = selectedCount === 0 || isDiscovering;

  // Render discovering loading state
  if (isDiscovering) {
    return (
      <div className="mx-auto max-w-xl">
        <ViewfinderFrame
          frameLabel="FRAME 02 // SITEMAP DISCOVERY ENGINE"
          badge="SCANNING"
          className="rounded-2xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900/90 shadow-xs overflow-hidden"
        >
          <div className="text-center py-12 px-6">
            <div className="mb-5 flex justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#121315] text-[#E54D2E] shadow-xs dark:bg-stone-100 dark:text-[#E54D2E]">
                <svg
                  className="h-8 w-8 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-stone-900 dark:text-white mb-2">
              Discovering Pages
            </h2>
            <p className="text-xs font-mono font-medium text-[#E54D2E] dark:text-[#FF5733] tracking-wide animate-pulse">
              {discoveryStatus}
            </p>
            <p className="mt-4 text-xs font-mono text-stone-400 dark:text-stone-500 max-w-xs mx-auto">
              Scanning sitemap.xml and tracing internal site routes.
            </p>
          </div>
        </ViewfinderFrame>
      </div>
    );
  }

  // Render discovery error state
  if (discoveryError) {
    return (
      <div className="mx-auto max-w-xl">
        <ViewfinderFrame
          frameLabel="FRAME 02 // SITEMAP DISCOVERY ENGINE"
          badge="FAILED"
          className="rounded-2xl border border-rose-200 bg-white dark:border-rose-900/40 dark:bg-stone-900/90 shadow-xs overflow-hidden"
        >
          <div className="text-center py-10 px-6">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-xs dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-400">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-stone-900 dark:text-white mb-2">
              Discovery Failed
            </h2>
            <p className="text-xs font-mono text-stone-600 dark:text-stone-400 mb-6 max-w-sm mx-auto">
              {discoveryError}
            </p>
            <Button variant="primary" onClick={onBack}>
              Try Another URL
            </Button>
          </div>
        </ViewfinderFrame>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ViewfinderFrame
        frameLabel="FRAME 02 // PAGE CURATION"
        badge={`${selectedCount} / ${totalCount} SELECTED`}
        className="rounded-2xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900/90 shadow-xs overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-6 sm:p-7 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-2xl font-normal tracking-tight text-stone-900 dark:text-white">
                  Found {totalCount} {totalCount === 1 ? 'Page' : 'Pages'}
                </h2>
                <Badge
                  variant={discoveryMethod === 'sitemap' ? 'success' : 'purple'}
                  dot
                >
                  {discoveryMethod === 'sitemap' ? 'Via Sitemap' : 'Via Web Crawl'}
                </Badge>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Curate the URLs you want to expose in this contact sheet capture run.
              </p>
            </div>

            <span className="text-xs font-mono text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
              <span className="font-bold text-[#E54D2E] dark:text-[#FF5733]">{selectedCount}</span> of {totalCount} pages selected
            </span>
          </div>
        </div>

        {/* Truncation warning */}
        {truncated && (
          <div className="mx-6 mt-5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Stopped after finding 500 pages — this site may have more.</span>
          </div>
        )}

        {/* Sticky Filter & Actions Toolbar */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Filter URLs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs font-mono text-stone-900 placeholder-stone-400 focus:border-[#E54D2E] focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
          </div>
        </div>

        {/* Scrollable Checkbox List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
          {filteredUrls.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-stone-400 dark:text-stone-500">
              {searchQuery.trim()
                ? 'No URLs match your filter query.'
                : 'No pages discovered.'}
            </div>
          ) : (
            filteredUrls.map((url, idx) => {
              const checked = selectedSet.has(url);
              return (
                <div
                  key={url}
                  onClick={() => handleToggle(url)}
                  className={`group flex items-center gap-3.5 px-6 py-3 transition-colors cursor-pointer select-none ${
                    checked
                      ? 'bg-stone-100/70 border-l-2 border-[#E54D2E] dark:bg-stone-800/40'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/40 border-l-2 border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}} // handled by row click
                    className="h-4 w-4 rounded-md border-stone-300 text-[#E54D2E] focus:ring-[#E54D2E] shrink-0 cursor-pointer dark:border-stone-600 dark:bg-stone-800"
                  />
                  <span className="text-[10px] font-mono text-stone-400 w-7 shrink-0">
                    #{(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span
                      title={url}
                      className={`truncate text-xs font-mono transition-colors ${
                        checked
                          ? 'text-stone-900 font-medium dark:text-stone-100'
                          : 'text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200'
                      }`}
                    >
                      {url}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {checked ? 'Deselect' : 'Select'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Large selection warning */}
        {selectedCount > 200 && (
          <div className="mx-6 my-4 rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-3 text-xs text-orange-900 dark:bg-orange-950/30 dark:border-orange-900/40 dark:text-orange-300 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>More than 200 pages selected. Capture may take a while.</span>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/30 dark:bg-stone-900/30">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isDisabled}
            onClick={onContinue}
            rightIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          >
            Continue to Settings
          </Button>
        </div>
      </ViewfinderFrame>
    </div>
  );
}
