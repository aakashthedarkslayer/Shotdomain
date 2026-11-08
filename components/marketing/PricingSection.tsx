'use client';

import React, { useState } from 'react';
import { ViewfinderFrame } from '../ui/ViewfinderFrame';

interface PricingTier {
  id: string;
  frameNum: string;
  name: string;
  badge?: string;
  price: string;
  cadence: string;
  description: string;
  featured?: boolean;
  ctaText: string;
  ctaHref: string;
  features: string[];
  specs: {
    maxPages: string;
    devices: string;
    concurrency: string;
    schedules: string;
    retina: boolean;
  };
}

const TIERS: PricingTier[] = [
  {
    id: 'free',
    frameNum: 'FRAME 01',
    name: 'Free Evaluation',
    price: '$0',
    cadence: 'forever',
    description: 'Perfect for trying the full workflow on smaller sites with zero commitment.',
    ctaText: 'Start Free Run',
    ctaHref: '/app',
    features: [
      'Up to 15 pages per sitemap crawl',
      'Desktop viewport capture',
      'Sitemap auto-discovery',
      'Lazy-load scroll & font wait',
      'Full-page continuous PNG/JPEG',
      'Clean ZIP folder download',
      'No watermark ever',
    ],
    specs: {
      maxPages: '15 pages',
      devices: 'Desktop',
      concurrency: 'Standard queue',
      schedules: 'Manual only',
      retina: false,
    },
  },
  {
    id: 'monthly',
    frameNum: 'FRAME 02',
    name: 'Monthly Studio',
    badge: 'MOST POPULAR',
    price: '$5',
    cadence: 'per month',
    description: 'For active agencies, designers, and QA engineers who capture sites weekly.',
    featured: true,
    ctaText: 'Get Studio Pass',
    ctaHref: '/app',
    features: [
      'Up to 100 pages per sitemap crawl',
      'All 4 device sizes in 1 run (Desktop, Tablet, iOS, Android)',
      '2× Retina high-DPI capture',
      'Structured device subfolder ZIP',
      'Automated recurring schedules',
      'Email notifications on complete',
      'Cookie banner auto-dismissal',
      'Ad & tracking script blocking',
    ],
    specs: {
      maxPages: '100 pages',
      devices: 'All 4 viewports',
      concurrency: '3–5 parallel pages',
      schedules: 'Daily & Weekly',
      retina: true,
    },
  },
  {
    id: 'lifetime',
    frameNum: 'FRAME 03',
    name: 'Lifetime Darkroom',
    badge: 'PAY ONCE FOREVER',
    price: '$50',
    cadence: 'one-time payment',
    description: 'Own your screenshot engine forever. Zero recurring subscriptions, lifetime updates.',
    ctaText: 'Claim Lifetime Access',
    ctaHref: '/app',
    features: [
      'Unlimited pages per job crawl',
      'All 4 device sizes + custom viewports',
      '2× Retina ultra-sharp capture',
      'Unlimited scheduled monitor jobs',
      'Email delivery with direct ZIP link',
      'Priority concurrency processing pool',
      'Permanent capture history',
      'All future engine updates included',
    ],
    specs: {
      maxPages: 'Unlimited',
      devices: 'All 4 + Custom',
      concurrency: 'Dedicated pool',
      schedules: 'Unlimited schedules',
      retina: true,
    },
  },
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="py-24 border-b border-stone-200 dark:border-stone-800 bg-[#FBFBFA] dark:bg-[#121315]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="w-2 h-2 rounded-full bg-[#E54D2E]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] font-semibold">
              [SECTION 05 / PRICING]
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 dark:text-stone-100 tracking-tight">
            Transparent pricing. Zero screenshot tax.
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            Other tools charge per screenshot credit or require \$50/month enterprise plans.
            Shotdomain offers honest, predictable pricing for individuals and teams.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier) => {
            const isFeatured = tier.featured;

            return (
              <ViewfinderFrame
                key={tier.id}
                frameLabel={`${tier.frameNum} // ${tier.name.toUpperCase()}`}
                badge={tier.badge}
                active={isFeatured}
                cornerSize={12}
                className={`flex flex-col justify-between rounded-lg transition-all ${
                  isFeatured
                    ? 'bg-white dark:bg-stone-900 border-2 border-[#E54D2E] dark:border-[#FF5733] shadow-lg shadow-orange-500/5'
                    : 'bg-white/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="p-6 sm:p-8 flex flex-col flex-1">
                  {/* Title & Price */}
                  <div className="pb-6 border-b border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                        {tier.name}
                      </h3>
                      {tier.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#E54D2E] dark:text-[#FF5733] font-semibold border border-[#E54D2E]/20">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed min-h-[36px]">
                      {tier.description}
                    </p>
                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100">
                        {tier.price}
                      </span>
                      <span className="text-xs font-mono text-stone-500">
                        / {tier.cadence}
                      </span>
                    </div>
                  </div>

                  {/* Technical Specs Breakdown */}
                  <div className="py-4 border-b border-stone-200 dark:border-stone-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-stone-50 dark:bg-stone-950/50 p-2 rounded border border-stone-200/50 dark:border-stone-800/50">
                      <span className="text-stone-400 block text-[9px] uppercase">Page Limit</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{tier.specs.maxPages}</span>
                    </div>
                    <div className="bg-stone-50 dark:bg-stone-950/50 p-2 rounded border border-stone-200/50 dark:border-stone-800/50">
                      <span className="text-stone-400 block text-[9px] uppercase">Device Views</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{tier.specs.devices}</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="py-6 flex-1 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      Included Capabilities:
                    </div>
                    <ul className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                      {tier.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <svg
                            className="w-4 h-4 text-[#E54D2E] dark:text-[#FF5733] shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    <a
                      href={tier.ctaHref}
                      className={`w-full py-3 px-4 rounded text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all ${
                        isFeatured
                          ? 'bg-[#E54D2E] hover:bg-[#d03f22] text-white shadow-sm'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200'
                      }`}
                    >
                      {tier.ctaText}
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </ViewfinderFrame>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-16 p-6 rounded-lg bg-stone-100/70 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span className="text-[#E54D2E] font-bold text-sm">⌜ ⌟</span>
            <span>No credit card required for free evaluation. Export clean ZIP files immediately.</span>
          </div>
          <span className="text-stone-500">Need team invoicing or custom concurrency? Contact support.</span>
        </div>
      </div>
    </section>
  );
}
