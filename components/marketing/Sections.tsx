import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LogoMark } from '@/components/ui/Logo';
import { CookieGuide } from '@/components/capture/CookieGuide';
import { MarketingPricing } from '@/components/billing/MarketingPricing';
import { CaptureButton } from './CaptureButton';
import { OutputPanel } from './OutputPanel';
import { SHARE_DAYS } from '@/lib/plans';
import { LEGAL } from '@/lib/legal';

/*
 * Homepage sections (DESIGN.md: Contact sheet). One sheet of proof paper
 * parted by hairlines; wide headings with no eyebrows; each section in its own
 * composition. The worked example shows real ShotDomain output.
 */

function Band({
  id,
  tone = 'soft',
  labelledBy,
  flushTop = false,
  children,
}: {
  id?: string;
  tone?: 'soft' | 'white';
  labelledBy?: string;
  /** Start right under the previous band (the worked example's capture shows at the hero's fold). */
  flushTop?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-16 border-b border-line px-4 sm:px-6 ${flushTop ? 'pt-8 pb-24 lg:pb-28' : 'py-24 lg:py-28'} ${tone === 'white' ? 'bg-surface' : 'bg-bg'}`}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function Heading({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={`type-wide text-[30px] leading-9 font-extrabold tracking-[-0.025em] text-fg sm:text-[36px] sm:leading-10 ${className}`}>
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * The two things a capture gives you, side by side: the share page a client
 * opens (a real capture of one, public/screens/README.md) and the ZIP.
 */
export function WorkedExampleSection() {
  return (
    <Band id="example" labelledBy="example-heading">
      <div className="max-w-2xl">
        <Heading id="example-heading">One ZIP, or a link for your client.</Heading>
        <p className="mt-4 text-lg leading-7 text-muted">ShotDomain run on its own site: a full-page screenshot of every page, on every device you pick.</p>
      </div>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <figure>
          <div className="overflow-hidden rounded-sm border border-line-strong bg-surface">
            <picture>
              {/* On a phone, the same share page as a phone shows it, so it stays readable. */}
              <source media="(max-width: 639px)" srcSet="/screens/share-phone.webp" width={780} height={1200} />
              <img
                src="/screens/share-desktop.webp"
                width={2304}
                height={1440}
                alt="A ShotDomain share page: the site's name, a Download ZIP button, device tabs and a grid of page screenshots."
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </picture>
          </div>
          <figcaption className="mt-4 max-w-xl text-sm leading-6 text-muted">
            <span className="font-semibold text-fg">The link your client opens.</span> Every page, by device, with one button for the ZIP. No account needed, and it is
            kept for {SHARE_DAYS} days.
          </figcaption>
        </figure>
        <OutputPanel />
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const STEPS: { title: string; body: string; detail: string }[] = [
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
    detail: 'Desktop, iPad Pro 11, iPhone 14 Pro and Pixel 7.',
  },
  {
    title: 'Hands them over',
    body: `One ZIP with a folder per device and a file per page. Or a link your client opens in the browser, kept for ${SHARE_DAYS} days.`,
    detail: 'No account needed to open a link.',
  },
];

/** What happens to one domain, as rows: the head block beside the four steps. */
export function HowItWorksSection() {
  return (
    <Band id="how-it-works" tone="white" labelledBy="how-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div>
          <Heading id="how-heading">One domain in, every page out.</Heading>
          <p className="mt-4 max-w-sm text-base leading-6 text-muted">
            It’s polite about it: at most four pages at a time, robots.txt respected and an honest user agent. If a site blocks bots, ShotDomain
            says so instead of working around it.
          </p>
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-7 sm:grid-cols-[3rem_minmax(0,2fr)_minmax(0,3fr)] sm:gap-x-6">
              <span aria-hidden="true" className="type-wide row-span-2 text-[28px] leading-7 font-extrabold text-fg tabular-nums sm:row-span-1">
                {i + 1}
              </span>
              <h3 className="type-wide text-lg leading-7 font-extrabold tracking-[-0.01em] text-fg">{s.title}</h3>
              <div>
                <p className="text-base leading-6 text-muted">{s.body}</p>
                <p className="mt-2 text-sm leading-5 font-semibold text-fg">{s.detail}</p>
              </div>
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
    <Band id="login-pages" labelledBy="login-heading">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <Heading id="login-heading">Screenshot what’s behind the login.</Heading>
          <p className="mt-4 max-w-md text-base leading-6 text-muted">
            Dashboards, client portals, staging sites. Copy your session from your own browser and paste it in. You never hand over a password,
            and it works with two-factor and single sign-on.
          </p>
          <h3 className="mt-8 text-sm font-extrabold text-fg">What happens to your session</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted">
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
            </CaptureButton>
            <span className="text-sm text-muted">In Pro and Lifetime.</span>
          </div>
        </div>

        <div className="card rounded-sm p-4 sm:p-5">
          <p id="session-security" className="mb-3 px-1 text-sm font-semibold text-fg">
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
    <Band id="pricing" tone="white" labelledBy="pricing-heading">
      <div className="mb-12 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
        <Heading id="pricing-heading">
          Free for small sites.
          <br />
          $5 a month for the rest.
        </Heading>
        <p className="text-base leading-6 text-muted">
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
    <Band id="faq" labelledBy="faq-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <Heading id="faq-heading">Common questions.</Heading>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-semibold text-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon name="plus" size={16} className="shrink-0 text-muted transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-2xl pb-6 text-base leading-7 text-muted">{f.a}</p>
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

/** A mast: the wordmark large over the page's real links and the legal line. */
export function Footer() {
  return (
    <footer className="bg-surface px-4 pt-20 pb-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
          <div>
            <Link href="/" className="type-wide inline-flex items-center gap-3 text-[36px] leading-none font-extrabold tracking-[-0.03em] text-fg sm:text-[52px]">
              <LogoMark size={44} />
              ShotDomain
            </Link>
            <p className="mt-4 max-w-xs text-base leading-6 text-muted">Every page of a site, screenshotted on every device.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.title} aria-labelledby={`footer-${col.title.toLowerCase()}`}>
                <p id={`footer-${col.title.toLowerCase()}`} className="text-sm font-semibold text-fg">
                  {col.title}
                </p>
                <ul className="mt-2 space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-block py-1 text-sm text-muted transition-colors hover:text-fg">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <p className="mt-16 border-t border-line pt-6 text-sm text-faint">© {new Date().getFullYear()} ShotDomain</p>
      </div>
    </footer>
  );
}
