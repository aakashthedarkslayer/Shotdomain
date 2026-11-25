import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Footer } from '@/components/marketing/Sections';
import { LEGAL, legalIsDraft } from '@/lib/legal';

const PAGES = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refunds', label: 'Refund Policy' },
];

/**
 * Shared layout for /terms, /privacy and /refunds: the title as a banner,
 * the three pages as a rail beside the text, the text at a 65ch measure.
 */
export function LegalPage({ title, intro, current, children }: { title: string; intro: ReactNode; current: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="px-4 pt-14 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {legalIsDraft && (
            <div role="note" className="mb-8 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
              <b>Draft.</b> Fill in the business details in <code className="font-mono">lib/legal.ts</code> and have these pages reviewed
              before taking payments.
            </div>
          )}
          <header className="border-b border-line pb-8">
            <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.045em] text-fg sm:text-[48px]">{title}</h1>
            <p className="mt-3 text-sm text-faint">Last updated {LEGAL.updated}</p>
          </header>
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:gap-12">
            <nav aria-label="Legal pages" className="lg:sticky lg:top-24 lg:self-start">
              <ul className="flex flex-wrap gap-2 text-sm lg:flex-col lg:gap-1">
                {PAGES.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      aria-current={p.href === current ? 'page' : undefined}
                      className={`inline-block rounded-full px-3 py-1.5 whitespace-nowrap transition-colors ${p.href === current ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-subtle hover:text-fg'}`}
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <article
              className="card max-w-[calc(65ch+5rem)] rounded-xl px-6 py-8 text-base leading-7 text-muted sm:px-10 sm:py-10
                [&_a]:font-medium [&_a]:text-accent [&_a:hover]:underline [&_b]:font-semibold [&_b]:text-fg
                [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-fg
                [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:mt-1.5 [&_p]:mt-3
                [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6
                [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top
                [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg"
            >
              <div className="text-fg/90 [&>*:first-child]:mt-0">{intro}</div>
              {children}
              <h2>Contact</h2>
              <p>
                {LEGAL.company}
                <br />
                {LEGAL.address}
                <br />
                <a href={`mailto:${LEGAL.email.replace(/^\[|\]$/g, '')}`}>{LEGAL.email}</a>
              </p>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
