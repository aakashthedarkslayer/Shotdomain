'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProductPreview } from './ProductPreview';

/** DESIGN.md hero-band: mono badge, display-xl headline, body-lg lead, pill CTAs, mesh gradient behind. */
export function HeroSection() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    router.push(trimmed ? `/app?url=${encodeURIComponent(trimmed)}` : '/app');
  }

  return (
    <section className="relative overflow-hidden border-b border-line bg-surface px-4 pt-20 pb-24 sm:px-6 md:pt-28">
      {/* The brand gradient: hero scale only, the page's single decoration. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[420px] max-w-5xl opacity-35 dark:opacity-25">
        <div className="hero-mesh h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <a
          href="#pricing"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1 text-sm tracking-[-0.01em] text-muted transition-colors hover:text-fg"
        >
          <span className="font-mono text-xs text-fg">FREE</span>
          <span className="h-3 w-px bg-line" />
          Try a whole site on desktop and iPhone
          <Icon name="arrowRight" size={12} />
        </a>

        <p className="mono-label mb-5">One Shot Every Domain</p>
        <h1 className="text-[40px] leading-[1.05] font-semibold tracking-[-0.05em] text-fg sm:text-[56px]">
          Every page of a site.
          <br />
          In one shot.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-7 text-muted">
          Enter a domain. ShotDomain finds every page and screenshots it on desktop, tablet and phone. Download one ZIP, or send your client a
          link they can open.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row">
          <label htmlFor="hero-url" className="sr-only">
            Website URL
          </label>
          <div className="relative flex-1">
            <Icon name="globe" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
            <input
              id="hero-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourdomain.com"
              className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-base text-fg shadow-[var(--shadow-card)] outline-none placeholder:text-faint hover:border-line-strong focus:border-fg focus:ring-3 focus:ring-fg/10"
            />
          </div>
          <Button type="submit" size="lg" shape="pill" iconRight="arrowRight">
            Capture site
          </Button>
        </form>
        <div className="mt-4 flex justify-center">
          <a href="#pricing" className={buttonClass('ghost', 'sm', '', 'pill')}>
            See plans and pricing
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-muted">
          {['15 pages free, desktop + iPhone', 'Cookie banners hidden automatically', 'No password needed for logins'].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Icon name="check" size={13} className="text-fg" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-20 max-w-5xl">
        <ProductPreview />
      </div>
    </section>
  );
}

export default HeroSection;
