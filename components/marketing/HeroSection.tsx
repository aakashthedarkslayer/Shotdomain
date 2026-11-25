'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CaptureFlow } from '@/components/capture/CaptureFlow';
import type { CaptureStart } from '@/components/capture/CaptureFlow';
import { isValidUrl, normalizeUrl } from '@/lib/url';
import { CAPTURE_EVENT } from './captureEvents';
import { FilmStrip } from './FilmStrip';
import type { OpenCaptureDetail } from './captureEvents';

/**
 * The hero (DESIGN.md: Contact sheet), and the front door to the tool: entering a domain
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
    <section id="capture" className={`relative scroll-mt-16 bg-bg ${start ? 'border-b border-line px-4 pt-12 pb-24 sm:px-6 md:pt-14' : ''}`}>
      {start ? (
        <div className="relative">
          <CaptureFlow start={start} />
        </div>
      ) : (
        <>
          {/* Counter: the capture form under a short head; the strip of real frames below is what you get. */}
          <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
            <h1 className="display text-[44px] text-fg sm:text-[60px] lg:text-[72px]">
              Every page of a site.
              <br />
              One shot.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-7 text-muted sm:text-xl sm:leading-8">Desktop, tablet and phone screenshots, as one ZIP or a client link.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-10 flex max-w-[720px] flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-url" className="sr-only">
                Website URL
              </label>
              <div className="relative flex-1">
                <Icon name="globe" size={20} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-faint" />
                <input
                  id="hero-url"
                  ref={inputRef}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="yourdomain.com"
                  autoComplete="url"
                  inputMode="url"
                  spellCheck={false}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'hero-url-error hero-terms' : 'hero-terms'}
                  className="h-14 w-full rounded-md border border-field-edge bg-surface pr-5 pl-13 text-lg text-fg transition-colors placeholder:text-faint hover:border-fg aria-invalid:border-danger sm:h-16"
                />
              </div>
              <Button type="submit" size="lg" shape="pill" className="h-14 px-8 text-lg sm:h-16">
                Capture site
              </Button>
            </form>
            {error && (
              <p id="hero-url-error" role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="mt-4 flex max-w-[720px] flex-col gap-1 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p id="hero-terms">
                Free for sites up to 15 pages.{needsSignIn ? ' You’ll sign in with Google first.' : ''}
              </p>
              <p>
                Behind a login, or only one page?{' '}
                <button type="button" onClick={() => begin({ prefill: url.trim() })} className="-mx-1 -my-3 inline-block cursor-pointer px-1 py-3 font-semibold text-fg underline underline-offset-4 hover:decoration-2">
                  More options
                </button>
              </p>
            </div>
          </div>
          <div className="mt-12 sm:mt-14">
            <FilmStrip />
          </div>
        </>
      )}
    </section>
  );
}

export default HeroSection;
