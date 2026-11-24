import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { CookieGuide } from '@/components/capture/CookieGuide';
import { MarketingPricing } from '@/components/billing/MarketingPricing';
import { CaptureButton } from './CaptureButton';
import { SHARE_DAYS } from '@/lib/plans';
import { LEGAL } from '@/lib/legal';

/*
 * Homepage bands (DESIGN.md): canvas-soft / canvas sections divided by
 * hairlines, display-lg sentence-case headlines, mono only for eyebrows and
 * technical detail. Each band has its own layout so the page doesn't read as
 * one template repeated.
 */

function Band({ id, tone = 'soft', children }: { id?: string; tone?: 'soft' | 'white'; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-16 border-b border-line px-4 py-24 sm:px-6 ${tone === 'white' ? 'bg-surface' : 'bg-bg'}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, children, className = '' }: { eyebrow: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mono-label">{eyebrow}</p>
      <h2 className="mt-3 text-[32px] leading-10 font-semibold tracking-[-0.04em] text-fg">{children}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

const STEPS: { title: string; body: string; detail: string; mono?: boolean }[] = [
  {
    title: 'Finds the pages',
    body: 'Reads sitemap.xml and every sitemap robots.txt lists. No sitemap? It follows the site’s links, including menus built with JavaScript.',
    detail: 'Untick pages, or add ones it missed.',
  },
  {
    title: 'Cleans them up',
    body: 'Accepts or hides cookie banners, settles animations and scrolls the page so lazy images load before each shot.',
    detail: 'Hide elements or add your own CSS.',
  },
  {
    title: 'Shoots every device',
    body: 'Full-page screenshots in real device profiles, at their real pixel density and with touch on.',
    detail: 'Desktop · iPad Pro 11 · iPhone 14 Pro · Pixel 7',
    mono: true,
  },
  {
    title: 'Hands them over',
    body: `One ZIP with a folder per device and a file per page. Or a link your client opens in the browser, kept for ${SHARE_DAYS} days.`,
    detail: 'No account needed to open a link.',
  },
];

/** What happens to one domain, step by step (replaces separate "how it works" and "features" grids). */
export function HowItWorksSection() {
  return (
    <Band id="how-it-works">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <Heading eyebrow="How it works">One domain in, every page out.</Heading>
          <p className="mt-4 max-w-sm text-base leading-6 text-muted">
            It’s polite about it: at most four pages at a time, robots.txt respected and an honest user agent. If a site blocks bots, ShotDomain
            says so instead of working around it.
          </p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col bg-surface p-6 sm:p-7">
              <span className="font-mono text-xs text-faint">0{i + 1}</span>
              <h3 className="mt-3 text-xl leading-7 font-semibold tracking-[-0.03em] text-fg">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 tracking-[-0.01em] text-muted">{s.body}</p>
              <p className={`mt-auto pt-4 text-fg ${s.mono ? 'font-mono text-xs leading-5' : 'text-[13px] leading-5 font-medium tracking-[-0.01em]'}`}>{s.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

/** What happens to a pasted session, in plain words (true to the code: see lib/jobStore.ts, lib/shareStore.ts). */
const SESSION_FACTS = [
  'Only the login cookies and headers are kept. Everything else you paste, including your browser’s user agent, is dropped.',
  'It lives in server memory for that one capture and is cleared within about an hour. It is never written to disk.',
  'It is never logged, shown back, shared, or stored with your screenshots or share links.',
  'Log out of the site in your browser and it stops working everywhere.',
];

/** Pages behind a login (Pro), with the animated guide to copying a session. */
export function LoginPagesSection() {
  return (
    <Band id="login-pages" tone="white">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <Heading
            eyebrow={
              <>
                Pages behind a login <span className="ml-1 rounded-full border border-line px-1.5 py-px text-[11px] text-fg">PRO</span>
              </>
            }
          >
            Screenshot what’s behind the login.
          </Heading>
          <p className="mt-4 max-w-md text-base leading-6 text-muted">
            Dashboards, client portals, staging sites. Copy your session from your own browser and paste it in. You never hand over a password,
            and it works with two-factor and single sign-on.
          </p>
          <h3 className="mt-8 text-sm font-semibold tracking-[-0.01em] text-fg">What happens to your session</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 tracking-[-0.01em] text-muted">
            {SESSION_FACTS.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Icon name="check" size={15} className="mt-1 shrink-0 text-fg" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CaptureButton login className={buttonClass('primary', 'md', '', 'pill')}>
              Try it on your app
              <Icon name="arrowRight" />
            </CaptureButton>
            <span className="text-sm text-muted">In Pro and Lifetime.</span>
          </div>
        </div>

        <div className="card-float rounded-xl p-4 sm:p-5">
          <p id="session-security" className="mb-3 px-1 text-sm font-medium tracking-[-0.01em] text-fg">
            Copy your session in four clicks
          </p>
          <CookieGuide />
        </div>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

export function PricingSection({ billingEnabled = false, lifetimeLeft = 0 }: { billingEnabled?: boolean; lifetimeLeft?: number }) {
  return (
    <Band id="pricing">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Heading eyebrow="Pricing">Free for small sites. $5 a month for the rest.</Heading>
        <p className="mt-3 text-base leading-6 text-muted">
          Prices in USD, taxes added at checkout. Cancel any time, and get your money back within {LEGAL.refundDays} days if it isn’t for you.
        </p>
      </div>
      <MarketingPricing billingEnabled={billingEnabled} lifetimeLeft={lifetimeLeft} />
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'How does it capture pages behind a login without my password?',
    a: 'Log in to the site in your own browser, copy the page request as cURL from the developer tools, and paste it into ShotDomain. It keeps only your session cookies and login headers, in memory, for that one capture. It never sees your password, works with two-factor and single sign-on, and the session stops working the moment you log out.',
  },
  {
    q: 'What can I do for free?',
    a: 'Capture a whole site of up to 15 pages on desktop and iPhone, as often as you like. Download the ZIP or send up to 3 share links. Pro adds up to 500 pages, tablet and Android, pages behind a login and your own logo on share links.',
  },
  {
    q: 'What if a site has no sitemap?',
    a: 'ShotDomain checks /sitemap.xml, /sitemap_index.xml and any sitemap listed in robots.txt. Without one, it follows the site’s own links on the same domain, respecting robots.txt, including links a web app builds with JavaScript. You can add pages by hand. Discovery stops at 500 pages.',
  },
  {
    q: 'Are phone screenshots just a narrow desktop window?',
    a: 'No. Phone and tablet captures use real device profiles (iPhone 14 Pro, Pixel 7, iPad Pro 11) with the right viewport, pixel density and touch.',
  },
  {
    q: 'How long do you keep my screenshots?',
    a: `About an hour after a capture finishes, unless you share it. A share link keeps that capture for ${SHARE_DAYS} days, then the link and its screenshots are deleted. Stop sharing and they are deleted straight away. There is no archive of past captures, so download the ZIP to keep them.`,
  },
  {
    q: 'Can I cancel?',
    a: 'Yes, any time from Plan & billing. Pro stays active until the end of the period you paid for, then you move to Free. Payments go through Paddle, our reseller, which also handles invoices, VAT and refunds.',
  },
  {
    q: 'Will it get my IP blocked?',
    a: 'Unlikely. ShotDomain loads at most 4 pages at a time, waits at least 300 ms between requests to the same host, respects robots.txt and says who it is. If a site blocks automated visits, it reports that rather than working around it.',
  },
];

export function FaqSection() {
  return (
    <Band id="faq" tone="white">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <Heading eyebrow="FAQ">Common questions.</Heading>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium tracking-[-0.02em] text-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon name="plus" size={16} className="shrink-0 text-muted transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-2xl pb-6 text-sm leading-6 tracking-[-0.01em] text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/#capture', label: 'Capture' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Log in' },
      { href: '/billing', label: 'Plan & billing' },
      { href: '/profile', label: 'Share links' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/refunds', label: 'Refunds' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-surface px-4 py-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-5 tracking-[-0.01em] text-muted">Every page of a site, screenshotted on every device.</p>
          <p className="font-mono text-xs text-faint">© {new Date().getFullYear()} ShotDomain</p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mono-label">{col.title}</p>
            <ul className="mt-3 space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-1 text-sm tracking-[-0.01em] text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
