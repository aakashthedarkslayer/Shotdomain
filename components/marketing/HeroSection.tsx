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
    <section
      id="capture"
      className={`relative scroll-mt-16 overflow-hidden border-b border-line bg-surface px-4 sm:px-6 ${start ? 'pt-12 pb-24 md:pt-14' : 'flex min-h-[calc(100dvh-64px)] flex-col justify-center py-16'}`}
    >
      {/* The brand gradient: hero scale only, the page's single decoration. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[420px] max-w-4xl opacity-25 dark:opacity-20">
        <div className="hero-mesh h-full w-full" />
      </div>

      {start ? (
        <div className="relative">
          <CaptureFlow start={start} />
        </div>
      ) : (
        // Counter: the capture form is the hero's visual, set large under a short head.
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <h1 className="text-[44px] leading-[1.02] font-semibold tracking-[-0.05em] text-fg sm:text-[64px] lg:text-[84px] xl:text-[96px] 2xl:text-[112px]">
            <span className="block">Every page</span>
            <span className="block">of a site.</span>
            <span className="block">One shot.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-7 text-muted sm:text-xl sm:leading-8">Type a domain and get every page on desktop, tablet and phone.</p>

          <div className="card-float mx-auto mt-12 max-w-2xl rounded-[28px] p-3 sm:p-4">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
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
                  className="h-16 w-full rounded-full border border-field-edge bg-surface pr-5 pl-13 text-lg text-fg transition-colors placeholder:text-faint hover:border-fg aria-invalid:border-danger"
                />
              </div>
              <Button type="submit" size="lg" shape="pill" iconRight="arrowRight" className="h-16 px-8 text-lg">
                Capture site
              </Button>
            </form>
            {error && (
              <p id="hero-url-error" role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="mt-3 border-t border-line px-2 pt-3 pb-1 text-sm text-muted sm:flex sm:items-center sm:justify-between sm:gap-4 sm:text-left">
              <p id="hero-terms">
                Free for sites up to 15 pages.{needsSignIn ? ' You’ll sign in with Google first.' : ''}
              </p>
              <p className="mt-1 sm:mt-0">
                Behind a login, or only one page?{' '}
                <button type="button" onClick={() => begin({ prefill: url.trim() })} className="-mx-1 -my-3 inline-block cursor-pointer px-1 py-3 font-medium text-fg underline-offset-2 hover:underline">
                  More options
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroSection;
