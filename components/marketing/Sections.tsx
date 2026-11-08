import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: ReactNode }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base text-muted">{description}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'globe', title: 'Enter a URL', body: 'We read sitemap.xml, or crawl internal links when there is no sitemap.' },
  { icon: 'sitemap', title: 'Pick pages', body: 'Every page is listed and selected. Filter and untick what you don’t need.' },
  { icon: 'monitor', title: 'Choose devices', body: 'Desktop, tablet, iOS and Android — set once, applied to every page.' },
  { icon: 'zip', title: 'Download', body: 'Preview each screenshot, then grab them all as one ZIP sorted by device.' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-line px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="How it works" title="From domain to ZIP in four steps" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-subtle text-fg">
                  <Icon name={s.icon} size={18} />
                </span>
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-fg">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'sitemap', title: 'Automatic page discovery', body: 'Sitemaps and sitemap indexes first, a polite same-origin crawl as the fallback.' },
  { icon: 'layers', title: 'Real device emulation', body: 'Mobile and tablet captures use proper viewport, pixel density and touch settings.' },
  { icon: 'maximize', title: 'Full-page or viewport', body: 'Capture the whole scrollable page, or just what is above the fold.' },
  { icon: 'shield', title: 'Well-behaved by default', body: 'Respects robots.txt, rate-limits each host and identifies itself honestly.' },
  { icon: 'sliders', title: 'Capture controls', body: 'Custom viewport size, PNG or JPG, ad blocking and background color.' },
  { icon: 'clock', title: 'Scheduled captures', body: 'Re-run any capture daily, weekly or monthly and get results by email.' },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-line bg-surface px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Features"
          title="Built for capturing whole sites"
          description="Not one screenshot at a time — every page, every breakpoint, in a single run."
        />
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-fg">
                <Icon name={f.icon} size={18} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-fg">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

const USE_CASES = [
  { who: 'Agencies', title: 'Proof of work, without the busywork', body: 'Hand clients a complete visual record of a launch in minutes instead of an afternoon.' },
  { who: 'Designers', title: 'Review every template at every size', body: 'Spot responsive layout problems across the whole site in one grid.' },
  { who: 'Migrations', title: 'Archive the old site before cut-over', body: 'Keep a full visual snapshot of the legacy site before DNS moves to the new build.' },
  { who: 'QA', title: 'Visual checks at scale', body: 'Check banners, overlays and layout regressions across hundreds of pages.' },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="scroll-mt-16 border-t border-line px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Use cases" title="Who it’s for" />
        <div className="grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <div key={u.who} className="rounded-xl border border-line bg-surface p-6">
              <p className="text-xs font-medium text-muted">{u.who}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-fg">{u.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{u.body}</p>
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
      'Unlimited schedules',
      'Email with ZIP link',
      'Permanent capture history',
      'All future updates',
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-line bg-surface px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Pricing" title="Simple, predictable pricing" description="No per-screenshot credits." />
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-xl border p-6 ${t.featured ? 'border-fg bg-bg ring-1 ring-fg' : 'border-line bg-bg'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-fg">{t.name}</h3>
                {t.badge && <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">{t.badge}</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-fg">{t.price}</span>
                <span className="text-sm text-muted">{t.cadence}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                    <Icon name="check" size={16} className="mt-0.5 text-success" />
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
    q: 'How are pages discovered? What if a site has no sitemap?',
    a: 'We check /sitemap.xml, /sitemap_index.xml and any sitemaps listed in robots.txt, then de-duplicate the URLs. If there is no sitemap, we crawl internal links on the same origin from the homepage, respecting robots.txt. Discovery stops at 500 pages.',
  },
  {
    q: 'Are mobile screenshots just a narrow desktop window?',
    a: 'No. Mobile and tablet captures use Playwright device profiles (iPhone 14 Pro, Pixel 7, iPad Pro 11) with the right viewport, pixel density and touch emulation, so mobile layouts render as they would on the device.',
  },
  {
    q: 'Can I capture the whole page, not just the first screen?',
    a: 'Yes — turn on “Full page” in capture settings to capture the full scrollable height. Pages that scroll inside an inner container rather than the window may not capture fully.',
  },
  {
    q: 'Will this get my IP blocked?',
    a: 'ShotDomain is deliberately polite: at most 4 pages at a time, at least 300 ms between requests to the same host, robots.txt respected, and an honest user agent. If a site blocks automated access, we report it rather than work around it.',
  },
  {
    q: 'How fast is it?',
    a: 'Pages are captured four at a time in a shared browser, so most small sites finish in a minute or two. Large sites and multiple devices take proportionally longer.',
  },
  {
    q: 'Can captures run automatically?',
    a: 'Yes. Save any capture as a schedule to re-run it daily, weekly or monthly. Each run is kept for download, and you can have results emailed to you.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-line px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions & answers" />
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {FAQS.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon name="chevronDown" className="text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
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
    <section className="border-t border-line px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-6 py-14 text-center text-primary-fg">
        <h2 className="text-3xl font-semibold tracking-tight">Capture your first site</h2>
        <p className="mx-auto mt-3 max-w-md opacity-70">Paste a URL and get every page back as a ZIP. No setup.</p>
        <Link
          href="/app"
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary-fg px-5 text-[15px] font-medium text-primary transition hover:opacity-90"
        >
          Open ShotDomain
          <Icon name="arrowRight" />
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-sm text-faint">© {new Date().getFullYear()}</span>
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
