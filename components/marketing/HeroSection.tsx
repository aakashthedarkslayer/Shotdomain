'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CaptureFlow } from '@/components/capture/CaptureFlow';
import type { CaptureStart } from '@/components/capture/CaptureFlow';
import { isValidUrl, normalizeUrl } from '@/lib/url';
import { ProductPreview } from './ProductPreview';
import { CAPTURE_EVENT } from './captureEvents';
import type { OpenCaptureDetail } from './captureEvents';

/**
 * DESIGN.md hero-band, and the front door to the tool: entering a domain
 * swaps the hero for the capture flow right here. Signed-out visitors (when
 * sign-in is on) go through Google first and come back to the same capture
 * via /?url=… or /?capture=login.
 */
export function HeroSection({ needsSignIn = false }: { needsSignIn?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [start, setStart] = useState<CaptureStart | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Start the tool, or send a signed-out visitor to sign in and back. */
  const begin = useCallback(
    (next: CaptureStart) => {
      if (needsSignIn) {
        const back = next.url ? `/?url=${encodeURIComponent(next.url)}` : `/?capture=${next.login ? 'login' : 'open'}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(back)}`);
        return;
      }
      setStart(next);
    },
    [needsSignIn, router],
  );

  // Arriving with /?url=example.com (after sign-in, or an old /app link) starts right away.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('url');
    const capture = params.get('capture');
    if (!param && !capture) return;
    const normalized = param ? normalizeUrl(param) : '';
    const timer = setTimeout(() => {
      window.history.replaceState(null, '', `/${window.location.hash}`);
      if (param && isValidUrl(normalized)) begin({ url: normalized });
      else if (capture === 'login' || capture === 'open') begin({ login: capture === 'login' });
    }, 0);
    return () => clearTimeout(timer);
  }, [begin]);

  // "Start capturing", "Try it on your app" and other buttons on the page.
  const active = start !== null;
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenCaptureDetail>).detail ?? {};
      if (active) return; // a capture is already open: just scroll to it
      if (detail.login) begin({ login: true });
      else inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener(CAPTURE_EVENT, onOpen);
    return () => window.removeEventListener(CAPTURE_EVENT, onOpen);
  }, [active, begin]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url.trim());
    if (!normalized) return setError('Enter a website address.');
    if (!isValidUrl(normalized)) return setError('That doesn’t look like a website address.');
    setError('');
    begin({ url: normalized });
  }

  return (
    <section id="capture" className="relative scroll-mt-16 overflow-hidden border-b border-line bg-surface px-4 pt-20 pb-24 sm:px-6 md:pt-28">
      {/* The brand gradient: hero scale only, the page's single decoration. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[420px] max-w-5xl opacity-35 dark:opacity-25">
        <div className="hero-mesh h-full w-full" />
      </div>

      {start ? (
        <div className="relative -mt-8 md:-mt-14">
          <CaptureFlow start={start} />
        </div>
      ) : (
        <>
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
              Enter a domain. ShotDomain finds every page and screenshots it on desktop, tablet and phone. Download one ZIP, or send your client
              a link they can open.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-url" className="sr-only">
                Website URL
              </label>
              <div className="relative flex-1">
                <Icon name="globe" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
                <input
                  id="hero-url"
                  ref={inputRef}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="yourdomain.com"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'hero-url-error' : undefined}
                  className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-base text-fg shadow-[var(--shadow-card)] outline-none placeholder:text-faint hover:border-line-strong focus:border-fg focus:ring-3 focus:ring-fg/10 aria-invalid:border-danger"
                />
              </div>
              <Button type="submit" size="lg" shape="pill" iconRight="arrowRight">
                Capture site
              </Button>
            </form>
            {error && (
              <p id="hero-url-error" role="alert" className="mt-2 text-[13px] text-danger">
                {error}
              </p>
            )}
            <p className="mt-4 text-[13px] text-muted">
              {needsSignIn ? 'Free with a Google account; you’ll sign in first. ' : ''}
              Site behind a login, or just one page?{' '}
              <button type="button" onClick={() => begin({ prefill: url.trim() })} className="cursor-pointer font-medium text-fg underline-offset-2 hover:underline">
                More options
              </button>
            </p>
            <div className="mt-3 flex justify-center">
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
        </>
      )}
    </section>
  );
}

export default HeroSection;
