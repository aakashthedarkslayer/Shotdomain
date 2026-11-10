import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { CookieGuide } from '@/components/capture/CookieGuide';

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: ReactNode }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <p className="text-brand text-sm font-semibold tracking-wide uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-[2.6rem] sm:leading-tight">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

function IconTile({ name }: { name: IconName }) {
  return (
    <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--accent)_80%,transparent)]">
      <Icon name={name} size={18} />
    </span>
  );
}

/* ------------------------------------------------------------------------ */

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'globe', title: 'Enter a URL', body: 'We read the sitemap, or crawl the site — logged in, if it needs a login.' },
  { icon: 'sitemap', title: 'Pick pages', body: 'Every page is listed and selected. Filter, untick, or add app pages by hand.' },
  { icon: 'monitor', title: 'Choose devices', body: 'Desktop, tablet, iOS and Android — set once, applied to every page.' },
  { icon: 'zip', title: 'Download & share', body: 'Preview everything, grab one ZIP sorted by device, or send a share link.' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="How it works" title="From domain to ZIP in four steps" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="glass relative rounded-2xl p-6">
              <span className="absolute top-5 right-5 font-mono text-xs text-faint">0{i + 1}</span>
              <IconTile name={s.icon} />
              <h3 className="mt-5 text-[15px] font-semibold text-fg">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const FEATURES: { icon: IconName; title: string; body: string; wide?: boolean }[] = [
  {
    icon: 'shield',
    title: 'Pages behind a login — without your password',
    body: 'Paste your session cookies or token and capture dashboards and web apps as you see them. Sessions are stored encrypted and die when you log out.',
    wide: true,
  },
  { icon: 'sitemap', title: 'Automatic page discovery', body: 'Sitemaps first, a polite crawl as fallback, plus JavaScript-built navigation.' },
  { icon: 'layers', title: 'Real device emulation', body: 'Proper viewport, pixel density and touch for tablet and phones.' },
  { icon: 'sliders', title: 'Clean captures', body: 'Cookie banners accepted or hidden, elements removed, clicks and CSS before capture.' },
  { icon: 'clock', title: 'Scheduled captures', body: 'Re-run any capture daily, weekly or monthly — every run lands in your history.' },
  { icon: 'refresh', title: 'Change alerts', body: 'Scheduled runs are compared page by page — get an email only when something changed.' },
  {
    icon: 'link',
    title: 'Share links',
    body: 'Send a single screenshot, a whole capture, or an always-latest view of a schedule. Revoke anytime.',
    wide: true,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Features"
          title="Built for capturing whole sites"
          description="Not one screenshot at a time — every page, every breakpoint, in a single run."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`glass rounded-2xl p-6 ${f.wide ? 'md:col-span-2' : ''}`}>
              <IconTile name={f.icon} />
              <h3 className="mt-5 text-base font-semibold tracking-tight text-fg">{f.title}</h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const LOGIN_POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'shield', title: 'No password shared', body: 'Paste your session from your own browser. Works with 2FA, SSO and magic-link logins.' },
  { icon: 'refresh', title: 'Test before you capture', body: 'Test login opens the site with your session and shows you the page you’ll get.' },
  { icon: 'sitemap', title: 'Finds app pages too', body: 'Discovery runs logged in and reads JavaScript-built menus — or add pages by hand.' },
  { icon: 'link', title: 'You stay in control', body: 'Sessions are stored encrypted. Log out of the site and access ends instantly.' },
];

/** Premium feature: capture pages behind a login, with the animated cookie guide. */
export function LoginPagesSection() {
  return (
    <section id="login-pages" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="inline-flex items-center gap-2">
            <span className="text-brand text-sm font-semibold tracking-wide uppercase">Access login pages</span>
            <span className="bg-brand rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">Premium</span>
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-[2.6rem] sm:leading-tight">
            Screenshot what’s behind the login
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Dashboards, web apps, client portals, staging sites — capture them exactly as you see them when signed in. It takes about 20 seconds
            to set up, and you never hand over a password.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
          <ul className="space-y-4">
            {LOGIN_POINTS.map((p) => (
              <li key={p.title} className="glass flex gap-4 rounded-2xl p-5">
                <IconTile name={p.icon} />
                <div>
                  <h3 className="text-[15px] font-semibold text-fg">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
                </div>
              </li>
            ))}
            <li className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/app" className={buttonClass('primary', 'md')}>
                Try it on your app
                <Icon name="arrowRight" />
              </Link>
              <a href="#pricing" className="text-sm text-muted hover:text-fg">
                Included in Studio and Lifetime →
              </a>
            </li>
          </ul>

          <div className="glass-strong rounded-3xl p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-medium text-fg">
              <span className="bg-brand flex h-6 w-6 items-center justify-center rounded-md text-white">
                <Icon name="play" size={12} />
              </span>
              How it works — copy your session in 4 clicks
            </div>
            <CookieGuide />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const USE_CASES = [
  { who: 'Agencies', title: 'Proof of work, without the busywork', body: 'Hand clients a complete visual record of a launch in minutes instead of an afternoon.' },
  { who: 'Product teams', title: 'Snapshot your logged-in app', body: 'Capture every dashboard screen for release notes, docs and QA — no shared passwords.' },
  { who: 'Migrations', title: 'Archive the old site before cut-over', body: 'Keep a full visual snapshot of the legacy site before DNS moves to the new build.' },
  { who: 'Monitoring', title: 'Know when pages change', body: 'Schedule weekly captures of competitors or your own site and get alerted on changes.' },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Use cases" title="Who it’s for" />
        <div className="grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <div key={u.who} className="glass rounded-2xl p-7">
              <p className="text-brand text-xs font-semibold tracking-wide uppercase">{u.who}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-fg">{u.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{u.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

interface Tier {
  name: string;
  price: string;
  cadence: string;
  description: string;
  cta: string;
  featured?: boolean;
  badge?: string;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'Try the full workflow on smaller sites.',
    cta: 'Start free',
    features: ['Up to 15 pages per run', 'Desktop viewport', 'Sitemap auto-discovery', 'Full-page PNG or JPG', 'ZIP download', 'No watermark'],
  },
  {
    name: 'Studio',
    price: '$5',
    cadence: 'per month',
    description: 'For agencies, designers and QA who capture sites weekly.',
    cta: 'Get Studio',
    featured: true,
    badge: 'Most popular',
    features: [
      'Up to 100 pages per run',
      'All 4 devices in one run',
      'High-DPI capture',
      'ZIP sorted by device',
      'Capture pages behind a login',
      'Recurring schedules',
      'Email when a run finishes',
      'Ad and tracker blocking',
    ],
  },
  {
    name: 'Lifetime',
    price: '$50',
    cadence: 'one-time',
    description: 'Pay once, keep it forever, including future updates.',
    cta: 'Get Lifetime',
    features: [
      'Unlimited pages per run',
      'All 4 devices + custom viewports',
      'High-DPI capture',
      'Capture pages behind a login',
      'Unlimited schedules',
      'Email with ZIP link',
      'Permanent capture history',
      'All future updates',
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Pricing" title="Simple, predictable pricing" description="No per-screenshot credits." />
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl p-7 ${
                t.featured ? 'glass-strong ring-2 ring-accent/60 shadow-[0_24px_60px_-20px_color-mix(in_srgb,var(--accent)_45%,transparent)]' : 'glass'
              }`}
            >
              {t.badge && (
                <span className="bg-brand absolute -top-3 left-7 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">{t.badge}</span>
              )}
              <h3 className="text-[15px] font-semibold text-fg">{t.name}</h3>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className={`text-5xl font-semibold tracking-tight ${t.featured ? 'text-brand' : 'text-fg'}`}>{t.price}</span>
                <span className="text-sm text-muted">{t.cadence}</span>
              </p>
              <ul className="mt-7 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                    <Icon name="check" size={16} className="mt-0.5 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/app" className={buttonClass(t.featured ? 'primary' : 'secondary', 'md', 'mt-8 w-full')}>
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'Can it capture pages behind a login without my password?',
    a: 'Yes. Log in to the site in your own browser, then paste your session cookies (or a token from Local Storage, or an Authorization header). ShotDomain never sees your password, works with 2FA and single sign-on, and the session stops working the moment you log out. Saved sessions are stored encrypted.',
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
    q: 'How do change alerts work?',
    a: 'Each scheduled run is compared with the previous one, page by page. You see how much of each page changed, and can choose to be emailed only when something did.',
  },
  {
    q: 'Will this get my IP blocked?',
    a: 'ShotDomain is deliberately polite: at most 4 pages at a time, at least 300 ms between requests to the same host, robots.txt respected, and an honest user agent. If a site blocks automated access, we report it rather than work around it.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions & answers" />
        <div className="glass divide-y divide-line overflow-hidden rounded-2xl">
          {FAQS.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-medium text-fg transition hover:bg-subtle [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="glass flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  <Icon name="chevronDown" size={14} className="text-muted transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="px-6 pb-6 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="glass-strong relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-6 py-16 text-center">
        <div className="bg-brand pointer-events-none absolute -top-24 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl" />
        <p className="text-brand relative text-sm font-semibold tracking-wide uppercase">One Shot Every Domain</p>
        <h2 className="relative mt-3 text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-4xl">Capture your first site</h2>
        <p className="relative mx-auto mt-3 max-w-md text-muted">Paste a URL and get every page back as a ZIP. No setup.</p>
        <Link href="/app" className={buttonClass('primary', 'lg', 'relative mt-8')}>
          Open ShotDomain
          <Icon name="arrowRight" />
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-4 pt-6 pb-12 sm:px-6">
      <div className="glass mx-auto flex max-w-6xl flex-col gap-6 rounded-2xl px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-sm text-faint">© {new Date().getFullYear()} · One Shot Every Domain</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/app" className="hover:text-fg">
            App
          </Link>
          <Link href="/schedules" className="hover:text-fg">
            Schedules
          </Link>
          <a href="#pricing" className="hover:text-fg">
            Pricing
          </a>
          <a href="#faq" className="hover:text-fg">
            FAQ
          </a>
          <Link href="/login" className="hover:text-fg">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-fg">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
