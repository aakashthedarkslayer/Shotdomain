'use client';

import React, { useState } from 'react';
import { ViewfinderFrame } from '../ui/ViewfinderFrame';

interface UseCase {
  id: string;
  frameNum: string;
  badge: string;
  title: string;
  audience: string;
  metric: string;
  painPoint: string;
  solution: string;
  outputPreview: {
    folder: string;
    fileCount: string;
    sampleFiles: string[];
  };
}

const USE_CASES: UseCase[] = [
  {
    id: 'agencies',
    frameNum: 'FRAME 01',
    badge: 'CLIENT HANDOFF',
    title: 'Deliver immaculate proof-of-work without spending Friday evening on screenshots',
    audience: 'Web Agencies & Freelancers',
    metric: '90s vs ~2.5 hours',
    painPoint:
      'The client signs off on launch, then asks for "full-page screenshots of all 28 pages on desktop and iPhone for the board presentation." You open DevTools, take 56 manual clips, rename files, and lose two hours.',
    solution:
      'Enter the staging URL. Shotdomain crawls all 28 routes, captures both Desktop and Mobile iOS at 2× Retina, auto-dismisses staging cookie banners, and packages everything into /desktop/ and /mobile-ios/ ZIP folders.',
    outputPreview: {
      folder: 'acme-staging-launch-2026-10.zip',
      fileCount: '56 high-res captures',
      sampleFiles: [
        'desktop/01_homepage.png (2880×4600)',
        'desktop/02_pricing.png (2880×3120)',
        'mobile-ios/01_homepage.png (750×6840)',
        'mobile-ios/02_pricing.png (750×4910)',
      ],
    },
  },
  {
    id: 'designers',
    frameNum: 'FRAME 02',
    badge: 'RESPONSIVE QA',
    title: 'Spot responsive layout shifts across every template in one visual glance',
    audience: 'Product Designers & Design Systems Leads',
    metric: '100% synchronized scroll',
    painPoint:
      'Checking how navigation collapses, type scales, and grids reflow across 14 template types usually means resizing browser windows over and over or hunting through broken DevTools responsive modes.',
    solution:
      'Run a single batch across Desktop, Tablet, and Mobile. Compare headers, font sizing, and footer padding side-by-side on real emulated viewports with frozen CSS animations and webfonts loaded.',
    outputPreview: {
      folder: 'design-system-audit-q4.zip',
      fileCount: '42 viewports',
      sampleFiles: [
        'desktop/blog-post.png (1440w @2x)',
        'tablet/blog-post.png (768w @2x)',
        'mobile-ios/blog-post.png (375w @2x)',
        'mobile-android/blog-post.png (360w @2x)',
      ],
    },
  },
  {
    id: 'redesigns',
    frameNum: 'FRAME 03',
    badge: 'PRE-REDESIGN ARCHIVE',
    title: 'Preserve the legacy site permanently before DNS cuts over to the new build',
    audience: 'Engineering & Marketing Teams',
    metric: 'Zero lost assets',
    painPoint:
      'Once DNS propagates to the new site, the old layout is gone forever. WayBack Machine renders broken CSS, missing hero images, and clipped heights. Stakeholders will inevitably ask: "What did that copy say again?"',
    solution:
      'Shoot the entire sitemap before cutover. Shotdomain scrolls every page to trigger lazy loading, waits for network idle, renders at full document height, and stamps the capture date into the archive manifest.',
    outputPreview: {
      folder: 'v1-legacy-archive-permanent.zip',
      fileCount: '84 full-page renders',
      sampleFiles: [
        'manifest.json (ISO timestamp + sitemap)',
        'desktop/careers_benefits.png',
        'desktop/products_archive.png',
        'desktop/legal_terms_2026.png',
      ],
    },
  },
  {
    id: 'audits',
    frameNum: 'FRAME 04',
    badge: 'COMPLIANCE & SEO',
    title: 'Audit cookie banners, layout shifts, and interstitial overlays at scale',
    audience: 'SEO Consultants & Legal Counsel',
    metric: 'True rendering reality',
    painPoint:
      'Auditing whether third-party scripts, consent banners, or promo popups are obscuring critical content across 50 international sub-pages is impossible with single-page tools.',
    solution:
      'Toggle cookie banner suppression on or off to inspect before/after states. See exactly what users and search crawlers see on first paint versus settled state.',
    outputPreview: {
      folder: 'privacy-banner-compliance-audit.zip',
      fileCount: '32 regulatory pages',
      sampleFiles: [
        'desktop/eu_gdpr_first_visit.png',
        'desktop/us_ccpa_first_visit.png',
        'mobile-ios/eu_gdpr_first_visit.png',
        'audit_log.txt (HTTP 200 checks)',
      ],
    },
  },
];

export function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const current = USE_CASES[activeTab];

  return (
    <section id="use-cases" className="py-24 border-b border-stone-200 dark:border-stone-800 bg-[#FBFBFA] dark:bg-[#121315]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#E54D2E]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] font-semibold">
                [SECTION 04 / USE CASES]
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 dark:text-stone-100 tracking-tight">
              Built for the moments manual screenshots break.
            </h2>
          </div>
          <p className="text-stone-600 dark:text-stone-400 max-w-md text-sm sm:text-base leading-relaxed">
            Whether preparing client deliverables, archiving legacy layouts, or checking responsive breakpoints,
            Shotdomain replaces repetitive grunt work with one automated darkroom run.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200 dark:border-stone-800 pb-3">
          {USE_CASES.map((uc, idx) => (
            <button
              key={uc.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 text-xs sm:text-sm font-mono transition-all rounded ${
                activeTab === idx
                  ? 'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
              }`}
            >
              <span className="text-[#E54D2E] mr-2">{uc.frameNum}</span>
              {uc.badge}
            </button>
          ))}
        </div>

        {/* Active Use Case Viewfinder Frame */}
        <ViewfinderFrame
          frameLabel={`${current.frameNum} // ${current.audience.toUpperCase()}`}
          badge={current.metric}
          cornerSize={14}
          active={true}
          className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 shadow-sm"
        >
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Problem & Solution Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  Target Workflow: {current.audience}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                  {current.title}
                </h3>
              </div>

              {/* The Manual Pain */}
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">
                    The Manual Tax
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {current.painPoint}
                </p>
              </div>

              {/* The Shotdomain Way */}
              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                    With Shotdomain
                  </span>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {current.solution}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="/app"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono tracking-wider uppercase bg-[#E54D2E] hover:bg-[#d03f22] text-white rounded font-medium transition-colors"
                >
                  Run This Workflow
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
                <span className="text-xs font-mono text-stone-500">
                  Ready in under 2 minutes
                </span>
              </div>
            </div>

            {/* Right: ZIP Artifact Inspector */}
            <div className="lg:col-span-5 bg-stone-950 text-stone-200 rounded-lg p-5 font-mono text-xs border border-stone-800 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-[11px] text-stone-400">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <svg className="w-3.5 h-3.5 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {current.outputPreview.folder}
                </span>
                <span className="text-stone-500">{current.outputPreview.fileCount}</span>
              </div>

              <div className="py-4 space-y-2">
                <div className="text-stone-500 text-[10px] tracking-widest uppercase">Structured Output Tree:</div>
                {current.outputPreview.sampleFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-stone-300 font-mono pl-2 border-l border-stone-800">
                    <span className="text-[#E54D2E] select-none">↳</span>
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ZIP Assembly Clean
                </span>
                <span className="text-stone-500">Ready to unzip</span>
              </div>
            </div>
          </div>
        </ViewfinderFrame>
      </div>
    </section>
  );
}
