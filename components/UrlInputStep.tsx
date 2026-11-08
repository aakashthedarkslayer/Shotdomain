'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface UrlInputStepProps {
  onDiscover: (url: string) => void;
  isLoading: boolean;
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  // Strip trailing slash
  url = url.replace(/\/+$/, '');
  return url;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (!parsed.hostname || parsed.hostname.includes(' ') || parsed.hostname.includes('%20')) {
      return false;
    }
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function UrlInputStep({ onDiscover, isLoading }: UrlInputStepProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const normalized = normalizeUrl(inputValue);

    if (!normalized) {
      setError('Please enter a website URL.');
      return;
    }

    if (!isValidUrl(normalized)) {
      setError('Unable to parse the URL. Please enter a valid website address.');
      return;
    }

    onDiscover(normalized);
  }

  return (
    <div className="mx-auto max-w-xl">
      <ViewfinderFrame
        frameLabel="FRAME 01 // SITEMAP DISCOVERY ENGINE"
        badge="STEP 01"
        className="rounded-2xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900/90 shadow-xs overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#121315] text-white shadow-xs dark:bg-stone-100 dark:text-[#121315]">
              <svg className="h-7 w-7 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl font-normal tracking-tight text-stone-900 dark:text-white">
              Discover Website Pages
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Enter any domain to crawl its sitemap and assemble full-resolution captures across responsive viewports.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <Input
                id="website-url"
                type="text"
                label="Domain or Website URL"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder="shotdomain.com"
                disabled={isLoading}
                error={error}
                prefixIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                }
                helperText="E.g. shotdomain.com, quotes.toscrape.com, or yourbrand.com"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Inspecting Sitemap…"
              className="w-full"
              rightIcon={
                !isLoading ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                ) : undefined
              }
            >
              Discover Pages
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-4 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sitemap.xml inspection
            </span>
            <span className="h-1 w-1 rounded-full bg-stone-300 dark:bg-stone-700" />
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Robots.txt compliant
            </span>
          </div>
        </div>
      </ViewfinderFrame>
    </div>
  );
}
