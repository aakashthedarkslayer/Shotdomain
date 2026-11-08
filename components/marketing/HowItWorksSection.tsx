import React from 'react';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface StepCard {
  number: string;
  tag: string;
  title: string;
  description: string;
  uiSnippet: React.ReactNode;
}

export function HowItWorksSection() {
  const steps: StepCard[] = [
    {
      number: '01',
      tag: 'DISCOVERY ENGINE',
      title: 'Enter one URL. Every page found.',
      description:
        'Shotdomain probes your sitemap.xml and sitemap indexes automatically. If missing, our polite BFS crawler navigates internal links up to depth 4, respecting robots.txt.',
      uiSnippet: (
        <div className="rounded-xl border border-stone-800 bg-[#0E0F11] p-3.5 font-mono text-xs text-stone-300 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-500 pb-1.5 border-b border-stone-800">
            <span>GET /sitemap.xml</span>
            <span className="text-emerald-400">200 OK</span>
          </div>
          <div className="text-[11px] text-stone-400 space-y-1">
            <div className="flex justify-between">
              <span>https://client.com/</span>
              <span className="text-stone-500">priority: 1.0</span>
            </div>
            <div className="flex justify-between">
              <span>https://client.com/features</span>
              <span className="text-stone-500">priority: 0.8</span>
            </div>
            <div className="flex justify-between">
              <span>https://client.com/pricing</span>
              <span className="text-stone-500">priority: 0.8</span>
            </div>
          </div>
          <div className="text-[10px] text-[#E54D2E] pt-1">
            ✓ 42 pages discovered across domain
          </div>
        </div>
      ),
    },
    {
      number: '02',
      tag: 'PAGE CURATION',
      title: 'Select what you want. Filter the rest.',
      description:
        'Review the complete list. Filter by path (/blog, /docs, /products), select all with one click, or deselect pages you do not need. Supports up to 500 pages per job.',
      uiSnippet: (
        <div className="rounded-xl border border-stone-800 bg-[#0E0F11] p-3.5 font-mono text-xs text-stone-300 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-400">FILTER: /product</span>
            <span className="text-[#E54D2E] font-semibold">18 selected</span>
          </div>
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex items-center gap-2 bg-stone-900/60 p-1.5 rounded">
              <span className="text-emerald-400 font-bold">☑</span>
              <span className="truncate">/product/overview</span>
            </div>
            <div className="flex items-center gap-2 bg-stone-900/60 p-1.5 rounded">
              <span className="text-emerald-400 font-bold">☑</span>
              <span className="truncate">/product/analytics</span>
            </div>
            <div className="flex items-center gap-2 bg-stone-900/60 p-1.5 rounded">
              <span className="text-emerald-400 font-bold">☑</span>
              <span className="truncate">/product/integrations</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '03',
      tag: 'DEVICE PROFILES',
      title: 'Pick devices once. Applied to all pages.',
      description:
        'Choose Desktop (1920×1080), Tablet (iPad Pro 834×1194), and Mobile (iPhone 14 Pro 393×852). Every single page is captured at every device size through real browser emulation.',
      uiSnippet: (
        <div className="rounded-xl border border-stone-800 bg-[#0E0F11] p-3.5 font-mono text-xs space-y-2">
          <div className="text-[11px] text-stone-500 pb-1 border-b border-stone-800">
            VIEWPORT SELECTION (3 ACTIVE)
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
            <div className="rounded bg-stone-900 p-2 border border-[#E54D2E]">
              <div className="text-[10px] text-stone-400">Desktop</div>
              <div className="text-[11px] font-bold text-white">1920×1080</div>
              <div className="text-[9px] text-[#E54D2E] mt-0.5">1× Scale</div>
            </div>
            <div className="rounded bg-stone-900 p-2 border border-indigo-500">
              <div className="text-[10px] text-stone-400">Tablet</div>
              <div className="text-[11px] font-bold text-white">834×1194</div>
              <div className="text-[9px] text-indigo-400 mt-0.5">2× Retina</div>
            </div>
            <div className="rounded bg-stone-900 p-2 border border-amber-500">
              <div className="text-[10px] text-stone-400">Mobile</div>
              <div className="text-[11px] font-bold text-white">393×852</div>
              <div className="text-[9px] text-amber-400 mt-0.5">3× Touch</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      tag: 'ORGANIZED DELIVERY',
      title: 'One organized ZIP. Sorted by device.',
      description:
        'Download your entire website archive organized into /desktop/, /tablet/, and /mobile-ios/ folders. Filenames reflect URL paths (e.g. about-team.png) rather than random hash strings.',
      uiSnippet: (
        <div className="rounded-xl border border-stone-800 bg-[#0E0F11] p-3.5 font-mono text-xs text-stone-300 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
            <span>ZIP ARCHIVE READY</span>
            <span>126 CAPTURES</span>
          </div>
          <div className="space-y-1 text-[11px] text-stone-400">
            <div>📁 /desktop/ <span className="text-stone-600">(42 files)</span></div>
            <div>📁 /tablet/ <span className="text-stone-600">(42 files)</span></div>
            <div>📁 /mobile-ios/ <span className="text-stone-600">(42 files)</span></div>
          </div>
          <div className="pt-1.5 flex justify-end">
            <span className="inline-flex items-center gap-1.5 bg-[#E54D2E] text-white px-2.5 py-1 rounded text-[10px] font-bold">
              Download All (ZIP) ↓
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#FBFBFA] dark:bg-[#0E0F11]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] dark:text-[#FF5733] font-semibold">
            THE 4-STEP WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121315] dark:text-white mt-3 font-serif">
            From sitemap to contact sheet in four steps.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-sans">
            Every step is designed to eliminate tedious repetition without taking control away from you.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {steps.map((step) => (
            <ViewfinderFrame
              key={step.number}
              frameLabel={`FRAME ${step.number} // ${step.tag}`}
              className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-stone-800 dark:bg-stone-900/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-stone-300 dark:text-stone-700">
                    {step.number}
                  </span>
                  <span className="text-[10px] font-mono text-[#E54D2E] dark:text-[#FF5733] tracking-widest font-semibold uppercase">
                    {step.tag}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#121315] dark:text-white font-serif mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              {/* Real UI fragment */}
              <div className="mt-auto pt-2">
                {step.uiSnippet}
              </div>
            </ViewfinderFrame>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
