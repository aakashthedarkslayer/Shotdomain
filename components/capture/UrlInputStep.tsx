'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { isValidUrl, normalizeUrl } from '@/lib/url';

interface UrlInputStepProps {
  onDiscover: (url: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function UrlInputStep({ onDiscover, isLoading, initialValue = '' }: UrlInputStepProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalized = normalizeUrl(value);
    if (!normalized) return setError('Enter a website address.');
    if (!isValidUrl(normalized)) return setError("That doesn't look like a valid website address.");
    setError('');
    onDiscover(normalized);
  }

  return (
    <div className="mx-auto max-w-xl pt-6 sm:pt-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Screenshot an entire website</h1>
        <p className="mt-2 text-[15px] text-muted">
          Enter a domain. We&apos;ll find its pages from the sitemap, or crawl it if there isn&apos;t one.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="website-url" className="sr-only">
          Website URL
        </label>
        <Input
          id="website-url"
          icon="globe"
          inputSize="lg"
          autoFocus
          placeholder="example.com"
          value={value}
          invalid={!!error}
          disabled={isLoading}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
        />
        <Button type="submit" size="lg" isLoading={isLoading} iconRight="arrowRight">
          Find pages
          </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 px-1 text-[13px] text-danger">
          {error}
        </p>
      )}

      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
        {['Reads sitemap.xml', 'Respects robots.txt', 'Up to 500 pages'].map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <Icon name="check" size={14} className="text-success" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
