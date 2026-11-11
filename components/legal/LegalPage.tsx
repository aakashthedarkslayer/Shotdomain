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

/** Shared layout for /terms, /privacy and /refunds: readable long-form text on a glass panel. */
export function LegalPage({ title, intro, current, children }: { title: string; intro: ReactNode; current: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {legalIsDraft && (
            <div role="note" className="mb-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
              <b>Draft.</b> Fill in the business details in <code className="font-mono">lib/legal.ts</code> and have these pages reviewed
              before taking payments.
            </div>
          )}
          <nav aria-label="Legal pages" className="mb-6 flex flex-wrap gap-2 text-sm">
            {PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={p.href === current ? 'page' : undefined}
                className={`rounded-full px-3 py-1 transition ${p.href === current ? 'bg-brand text-white' : 'glass text-muted hover:text-fg'}`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <article
            className="glass rounded-2xl px-6 py-8 text-[15px] leading-relaxed text-muted sm:px-10 sm:py-10
              [&_a]:font-medium [&_a]:text-accent [&_a:hover]:underline [&_b]:font-semibold [&_b]:text-fg
              [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fg
              [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:mt-1.5 [&_p]:mt-3
              [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6
              [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top
              [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg"
          >
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="!mt-2 text-sm text-faint">Last updated {LEGAL.updated}</p>
            <div className="mt-6 text-fg/90">{intro}</div>
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
      </main>
      <Footer />
    </div>
  );
}
