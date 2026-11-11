'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProductPreview } from './ProductPreview';

export function HeroSection() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    router.push(trimmed ? `/app?url=${encodeURIComponent(trimmed)}` : '/app');
  }

  return (
    <section className="relative px-4 pt-16 pb-24 sm:px-6 md:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <a
          href="#features"
          className="glass mb-7 inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs text-muted transition hover:text-fg"
        >
          <span className="bg-brand rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
          Logged-in captures & change alerts
          <Icon name="arrowRight" size={12} />
        </a>

        <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.035em] text-fg sm:text-6xl md:text-7xl">
          One URL. Every page.
          <br />
          Every device.
        </h1>
        <p className="text-brand mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">One Shot Every Domain</p>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          ShotDomain finds every page on a site — even behind a login — screenshots it on desktop, tablet and mobile, and hands you one
          organized ZIP.
        </p>

        <form onSubmit={handleSubmit} className="glass mx-auto mt-9 flex max-w-lg flex-col gap-2 rounded-2xl p-2 sm:flex-row">
          <label htmlFor="hero-url" className="sr-only">
            Website URL
          </label>
          <div className="relative flex-1">
            <Icon name="globe" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
            <input
              id="hero-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourdomain.com"
              className="h-11 w-full rounded-xl bg-transparent pr-3 pl-10 text-[15px] text-fg outline-none placeholder:text-faint"
            />
          </div>
          <Button type="submit" size="lg" iconRight="arrowRight">
            Capture site
          </Button>
        </form>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
          {['Respects robots.txt', 'Up to 500 pages per run', 'No password needed for logins'].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Icon name="check" size={14} className="text-success" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-20 max-w-5xl">
        <ProductPreview />
      </div>
    </section>
  );
}

export default HeroSection;
