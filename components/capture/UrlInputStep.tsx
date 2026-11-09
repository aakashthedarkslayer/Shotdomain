'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Controls';
import { isValidUrl, normalizeUrl } from '@/lib/url';
import { sanitizeAuth } from '@/lib/captureOptions';
import type { SiteAuth } from '@/lib/captureOptions';
import { SiteAuthFields } from './SiteAuthFields';

interface UrlInputStepProps {
  onDiscover: (url: string) => void;
  isLoading: boolean;
  initialValue?: string;
  auth: SiteAuth;
  onAuthChange: (auth: SiteAuth) => void;
}

export default function UrlInputStep({ onDiscover, isLoading, initialValue = '', auth, onAuthChange }: UrlInputStepProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const needsLogin = auth.method !== 'none';

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalized = normalizeUrl(value);
    if (!normalized) return setError('Enter a website address.');
    if (!isValidUrl(normalized)) return setError("That doesn't look like a valid website address.");
    if (needsLogin && !sanitizeAuth(auth)) return setError('Fill in the login details, or turn off “This site needs a login”.');
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

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="text-sm font-medium text-fg">This site needs a login</div>
            <div className="mt-0.5 text-[13px] text-muted">Capture pages behind a login — dashboards, web apps, staging sites.</div>
          </div>
          <Switch
            label="This site needs a login"
            checked={needsLogin}
            onChange={(on) => onAuthChange(on ? { ...auth, method: 'cookies' } : { ...auth, method: 'none' })}
          />
        </div>
        {needsLogin && (
          <div className="border-t border-line px-5 py-4">
            <SiteAuthFields siteUrl={value} auth={auth} onChange={onAuthChange} />
          </div>
        )}
      </Card>

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
