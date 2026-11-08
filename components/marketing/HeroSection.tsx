'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

function ProductPreview() {
  const tiles = [
    { path: '/', device: 'Desktop', w: 'col-span-2' },
    { path: '/pricing', device: 'Mobile', w: '' },
    { path: '/about', device: 'Desktop', w: '' },
    { path: '/blog', device: 'Tablet', w: '' },
    { path: '/contact', device: 'Mobile', w: '' },
    { path: '/docs', device: 'Tablet', w: '' },
    { path: '/careers', device: 'Desktop', w: '' },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 rounded-md bg-subtle px-2.5 py-0.5 font-mono text-xs text-muted">example.com · 24 screenshots</span>
        <span className="ml-auto hidden items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-fg sm:flex">
          <Icon name="download" size={12} /> Download ZIP
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 bg-subtle/60 p-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.path} className={`overflow-hidden rounded-lg border border-line bg-surface ${t.w}`}>
            <div className="space-y-2 p-3">
              <div className="h-2 w-1/3 rounded bg-line-strong" />
              <div className="h-12 rounded bg-subtle" />
              <div className="h-2 w-3/4 rounded bg-line" />
              <div className="h-2 w-1/2 rounded bg-line" />
            </div>
            <div className="flex items-center justify-between border-t border-line px-3 py-1.5">
              <span className="font-mono text-[11px] text-fg">{t.path}</span>
              <span className="text-[11px] text-muted">{t.device}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    router.push(trimmed ? `/app?url=${encodeURIComponent(trimmed)}` : '/app');
  }

  return (
    <section className="px-4 pt-16 pb-20 sm:px-6 md:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Full-site screenshots
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-6xl">
          One URL. Every page.
          <br />
          <span className="text-muted">Every device. One ZIP.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          ShotDomain finds every page on a site, screenshots each one on desktop, tablet and mobile, and hands you a single
          organized ZIP.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-2 rounded-xl border border-line bg-surface p-1.5 shadow-sm sm:flex-row">
          <label htmlFor="hero-url" className="sr-only">
            Website URL
          </label>
          <div className="relative flex-1">
            <Icon name="globe" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <input
              id="hero-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourdomain.com"
              className="h-10 w-full rounded-lg bg-transparent pr-3 pl-9 text-sm text-fg outline-none placeholder:text-faint"
            />
          </div>
          <Button type="submit" iconRight="arrowRight" className="h-10">
            Capture site
          </Button>
        </form>
        <p className="mt-3 text-xs text-faint">Respects robots.txt · Up to 500 pages per run</p>
      </div>

      <div className="mx-auto mt-16 max-w-5xl">
        <ProductPreview />
      </div>
    </section>
  );
}

export default HeroSection;
