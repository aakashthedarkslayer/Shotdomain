import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { CookieGuide } from '@/components/capture/CookieGuide';
import { MarketingPricing } from '@/components/billing/MarketingPricing';
import { SHARE_DAYS } from '@/lib/plans';

/*
 * Homepage bands (DESIGN.md): alternating canvas-soft / canvas sections with
 * hairline dividers, mono eyebrows, display-lg sentence-case headlines, cards
 * held by hairline + stacked shadow, and one polarity-flipped dark band.
 */

function Band({ id, tone = 'soft', children }: { id?: string; tone?: 'soft' | 'white'; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 border-b border-line px-4 py-24 sm:px-6 ${tone === 'white' ? 'bg-surface' : 'bg-bg'}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, description, align = 'center' }: { eyebrow: string; title: string; description?: ReactNode; align?: 'center' | 'left' }) {
  return (
    <div className={`mb-12 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <p className="mono-label">{eyebrow}</p>
      <h2 className="mt-3 text-[32px] leading-10 font-semibold tracking-[-0.04em] text-fg">{title}</h2>
      {description && <p className="mt-3 text-lg leading-7 text-muted">{description}</p>}
    </div>
  );
}

/** Icon in a circular hairline container (icon-button-circular). */
function IconTile({ name }: { name: IconName }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-fg">
      <Icon name={name} size={16} />
    </span>
  );
}

/* ------------------------------------------------------------------------ */

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'globe', title: 'Enter a URL', body: 'We read the sitemap, or crawl the site — logged in, if it needs a login.' },
  { icon: 'sitemap', title: 'Pick pages', body: 'Every page is listed and selected. Filter, untick, or add app pages by hand.' },
  { icon: 'monitor', title: 'Choose devices', body: 'Desktop, tablet, iOS and Android — set once, applied to every page.' },
  { icon: 'zip', title: 'Download & share', body: `Preview everything, grab one ZIP sorted by device, or send a ${SHARE_DAYS}-day share link.` },
];

export function HowItWorksSection() {
  return (
    <Band id="how-it-works">
      <SectionHeading eyebrow="How it works" title="From domain to every screenshot in four steps." />
      <ol className="grid overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4 gap-px">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-surface p-6">
            <div className="flex items-center justify-between">
              <IconTile name={s.icon} />
              <span className="font-mono text-xs text-faint">0{i + 1}</span>
            </div>
            <h3 className="mt-6 text-base font-semibold tracking-[-0.02em] text-fg">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-5 tracking-[-0.01em] text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const FEATURES: { icon: IconName; title: string; body: string; wide?: boolean }[] = [
  {
    icon: 'shield',
    title: 'Pages behind a login — without your password',
    body: 'Paste your session cookies or token and capture dashboards and web apps as you see them. The session is used for that capture only and never saved.',
    wide: true,
  },
  { icon: 'sitemap', title: 'Automatic page discovery', body: 'Sitemaps first, a polite crawl as fallback, plus JavaScript-built navigation.' },
  { icon: 'layers', title: 'Real device emulation', body: 'Proper viewport, pixel density and touch for tablet and phones.' },
  { icon: 'sliders', title: 'Clean captures', body: 'Cookie banners accepted or hidden, elements removed, clicks and CSS before capture.' },
  { icon: 'zip', title: 'One ZIP, sorted by device', body: 'Every screenshot in one download, a folder per device, each file named after its page.' },
  { icon: 'refresh', title: 'Retry what failed', body: 'A page that timed out or errored can be captured again on its own, without re-running the site.' },
  {
    icon: 'link',
    title: 'Share links',
    body: `Send a whole capture as one link: your client opens it in the browser, no account needed. Links last ${SHARE_DAYS} days, and you can stop sharing anytime.`,
    wide: true,
  },
];

export function FeaturesSection() {
  return (
    <Band id="features" tone="white">
      <SectionHeading
        eyebrow="Features"
        title="Every page of a site, in one go."
        description="Enter a domain and get a screenshot of every page on desktop and phone: to hand over, archive or check before launch."
      />
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className={`bg-surface p-6 sm:p-8 ${f.wide ? 'md:col-span-2' : ''}`}>
            <IconTile name={f.icon} />
            <h3 className="mt-6 text-xl leading-7 font-semibold tracking-[-0.03em] text-fg">{f.title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 tracking-[-0.01em] text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const LOGIN_POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'shield', title: 'No password shared', body: 'Paste your session from your own browser. Works with 2FA, SSO and magic-link logins.' },
  { icon: 'refresh', title: 'Test before you capture', body: 'Test login opens the site with your session and shows you the page you’ll get.' },
  { icon: 'sitemap', title: 'Finds app pages too', body: 'Discovery runs logged in and reads JavaScript-built menus — or add pages by hand.' },
  { icon: 'link', title: 'You stay in control', body: 'The session is used for one capture and never saved. Log out of the site and it stops working.' },
];

/** Plain-language account of what happens to a pasted session (true to the code: see lib/jobStore.ts, lib/shareStore.ts). */
const SESSION_FACTS = [
  'We keep only the login cookies and headers from what you paste. Everything else, including your browser’s User-Agent, is dropped.',
  'The session lives in server memory for that capture only and is cleared within about an hour. It is never written to disk.',
  'Sessions are never logged, never shown back to anyone, never shared, and never stored with your screenshots or share links.',
  'You can end it at any time: log out of the site in your browser and the session stops working everywhere.',
];

/** Premium feature: capture pages behind a login, with the animated cookie guide. */
export function LoginPagesSection() {
  return (
    <Band id="login-pages">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="inline-flex items-center gap-2">
          <span className="mono-label">Access login pages</span>
          <span className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-fg">PRO</span>
        </p>
        <h2 className="mt-3 text-[32px] leading-10 font-semibold tracking-[-0.04em] text-fg">Screenshot what’s behind the login.</h2>
        <p className="mt-3 text-lg leading-7 text-muted">
          Dashboards, web apps, client portals, staging sites — captured exactly as you see them signed in. About 20 seconds to set up, and you
          never hand over a password.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {LOGIN_POINTS.map((p) => (
              <li key={p.title} className="flex gap-4 p-5">
                <IconTile name={p.icon} />
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-fg">{p.title}</h3>
                  <p className="mt-1 text-sm leading-5 tracking-[-0.01em] text-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/app" className={buttonClass('primary', 'md', '', 'pill')}>
              Try it on your app
              <Icon name="arrowRight" />
            </Link>
            <a href="#pricing" className={buttonClass('ghost', 'md', '', 'pill')}>
              Included in Pro and Lifetime
            </a>
          </div>
        </div>

        <div className="card-float rounded-xl p-4 sm:p-5">
          <div id="session-security" className="mb-3 flex items-center gap-2 px-1 text-sm font-medium tracking-[-0.01em] text-fg">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg text-fg">
              <Icon name="play" size={11} />
            </span>
            How it works — copy your session in 4 clicks
          </div>
          <CookieGuide />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-lg border border-line bg-surface p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-fg">
          <Icon name="lock" size={16} />
          What happens to your session.
        </h3>
        <ul className="mt-4 grid gap-x-8 gap-y-3 text-sm leading-6 tracking-[-0.01em] text-muted sm:grid-cols-2">
          {SESSION_FACTS.map((f) => (
            <li key={f} className="flex gap-2">
              <Icon name="check" size={15} className="mt-1 shrink-0 text-fg" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const USE_CASES = [
  { who: 'Agencies', title: 'Hand over every page of a client site', body: 'Capture the whole site at launch or before a redesign, and send the client one link with every page on desktop and phone.' },
  { who: 'Product teams', title: 'Snapshot your logged-in app', body: 'Capture every dashboard screen for release notes, docs and QA — no shared passwords.' },
  { who: 'Migrations', title: 'Archive the old site before cut-over', body: 'Keep a full visual snapshot of the legacy site before DNS moves to the new build.' },
  { who: 'Launches & QA', title: 'Check every page before go-live', body: 'See every page on four devices side by side and catch the broken layout before your client does.' },
];

export function UseCasesSection() {
  return (
    <Band id="use-cases" tone="white">
      <SectionHeading eyebrow="Use cases" title="Who it’s for." />
      <div className="grid gap-4 sm:grid-cols-2">
        {USE_CASES.map((u) => (
          <div key={u.who} className="card rounded-lg p-6 sm:p-8">
            <p className="mono-label">{u.who}</p>
            <h3 className="mt-3 text-xl leading-7 font-semibold tracking-[-0.03em] text-fg">{u.title}</h3>
            <p className="mt-2 text-sm leading-6 tracking-[-0.01em] text-muted">{u.body}</p>
          </div>
        ))}
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

export function PricingSection({ billingEnabled = false, lifetimeLeft = 0 }: { billingEnabled?: boolean; lifetimeLeft?: number }) {
  return (
    <Band id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple, predictable pricing."
        description="No per-screenshot credits. Prices in USD; taxes are calculated at checkout. Cancel anytime."
      />
      <MarketingPricing billingEnabled={billingEnabled} lifetimeLeft={lifetimeLeft} />
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'Can it capture pages behind a login without my password?',
    a: 'Yes. Log in to the site in your own browser, then copy the page request as cURL from DevTools and paste it — ShotDomain keeps only your session cookies and login headers. ShotDomain never sees your password, works with 2FA and single sign-on, and the session stops working the moment you log out. The session is used for that capture only and never saved.',
  },
  {
    q: 'What happens to the session I paste?',
    a: 'Only the login cookies and headers are kept. They stay in server memory for that capture and are cleared within about an hour; they are never written to disk, logged or shared. Logging out of the site in your browser ends them immediately.',
  },
  {
    q: 'What can I try for free?',
    a: 'A whole site of up to 15 pages, on desktop and iPhone, as often as you like. Download the screenshots as a ZIP or send up to 3 share links. Up to 500 pages, tablet and Android, pages behind a login and your own logo on share links come with Pro.',
  },
  {
    q: 'How are pages discovered? What if a site has no sitemap?',
    a: 'We check /sitemap.xml, /sitemap_index.xml and any sitemaps listed in robots.txt. If there is no sitemap, we crawl internal links on the same origin, respecting robots.txt, and also read links that a web app builds with JavaScript. You can add pages by hand too. Discovery stops at 500 pages.',
  },
  {
    q: 'Are mobile screenshots just a narrow desktop window?',
    a: 'No. Mobile and tablet captures use real device profiles (iPhone 14 Pro, Pixel 7, iPad Pro 11) with the right viewport, pixel density and touch emulation.',
  },
  {
    q: 'What about cookie banners and chat widgets?',
    a: 'Common consent banners are accepted or hidden automatically. You can also hide any element, click things before capture (menus, tabs, dialogs) and inject your own CSS.',
  },
  {
    q: 'How long do you keep my screenshots?',
    a: `About an hour after a capture finishes, unless you share it. A share link keeps that capture for ${SHARE_DAYS} days, then the link and its screenshots are deleted; stop sharing and they are deleted straight away. There is no archive of past captures, so download the ZIP to keep them.`,
  },
  {
    q: 'Can I cancel or change plans anytime?',
    a: 'Yes. Switch Pro between monthly and yearly from Plan & billing — the difference is prorated. If you cancel, Pro stays active until the end of the period you paid for, then you move to Free. Payments are handled by Paddle, our reseller, which also takes care of invoices, VAT/GST and refunds.',
  },
  {
    q: 'Will this get my IP blocked?',
    a: 'ShotDomain is deliberately polite: at most 4 pages at a time, at least 300 ms between requests to the same host, robots.txt respected, and an honest user agent. If a site blocks automated access, we report it rather than work around it.',
  },
];

export function FaqSection() {
  return (
    <Band id="faq" tone="white">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions and answers." />
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium tracking-[-0.02em] text-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
                  <Icon name="plus" size={14} className="text-muted transition-transform group-open:rotate-45" />
                </span>
              </summary>
              <p className="pb-6 text-sm leading-6 tracking-[-0.01em] text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------------------ */

/** The polarity-flipped dark band (showcase-band-dark). */
export function FinalCta() {
  return (
    <section className="band-dark border-b border-line px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mono-label">One Shot Every Domain</p>
        <h2 className="mt-3 text-[32px] leading-10 font-semibold tracking-[-0.04em] text-fg sm:text-5xl sm:leading-[1.05]">
          Capture your first site.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg leading-7 text-muted">Paste a URL and see every page on desktop and iPhone. Free, no card.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/app" className={buttonClass('primary', 'lg', '', 'pill')}>
            Start capturing
            <Icon name="arrowRight" />
          </Link>
          <a href="#pricing" className={buttonClass('secondary', 'lg', '', 'pill')}>
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/app', label: 'Capture' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Log in' },
      { href: '/signup', label: 'Sign up' },
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
          <p className="max-w-xs text-sm leading-5 tracking-[-0.01em] text-muted">Screenshots of every page of a site, on every device, in one go.</p>
          <p className="font-mono text-xs text-faint">© {new Date().getFullYear()} ShotDomain</p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mono-label">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm tracking-[-0.01em] text-muted transition-colors hover:text-fg">
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
