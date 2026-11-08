'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface PageItem {
  slug: string;
  title: string;
  status: '200 OK';
}

const DEMO_PAGES: PageItem[] = [
  { slug: '/', title: 'Home', status: '200 OK' },
  { slug: '/features', title: 'Features & Workflow', status: '200 OK' },
  { slug: '/pricing', title: 'Pricing & Plans', status: '200 OK' },
  { slug: '/docs', title: 'Documentation', status: '200 OK' },
  { slug: '/blog', title: 'Changelog & Blog', status: '200 OK' },
];

export function HeroWorkflowDemo() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedUrl, setTypedUrl] = useState('https://linear.app');
  const [shutterFlash, setShutterFlash] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev === 4 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4);
        if (next === 3) {
          // Trigger shutter flash
          setShutterFlash(true);
          setTimeout(() => setShutterFlash(false), 200);
        }
        return next;
      });
    }, 4200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleStepSelect = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
    if (step === 3) {
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 200);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl select-none">
      {/* Proofing Board Outer Frame */}
      <div className="relative rounded-2xl border border-stone-300/80 bg-[#161719] text-stone-200 shadow-2xl overflow-hidden dark:border-stone-800">
        {/* Shutter flash overlay */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-white/80 z-40 pointer-events-none transition-opacity duration-150 animate-shutter-flash" />
        )}

        {/* Top Darkroom Control Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-800 bg-[#0E0F11] px-4 py-2.5 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="h-2 w-2 rounded-full bg-[#E54D2E] animate-pulse" />
              <span>PROOFING EASEL // ROLL #042</span>
            </span>
            <span className="text-stone-600 hidden sm:inline">|</span>
            <span className="text-stone-400 hidden sm:inline">
              15 EXPOSURES (5 PAGES × 3 DEVICES)
            </span>
          </div>

          {/* Step Pill Scrubbers */}
          <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
            <div className="inline-flex rounded-lg bg-stone-900 p-0.5 border border-stone-800">
              {[
                { num: 1, label: '1. Discover' },
                { num: 2, label: '2. Select' },
                { num: 3, label: '3. Shoot' },
                { num: 4, label: '4. ZIP' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => handleStepSelect(s.num as 1 | 2 | 3 | 4)}
                  className={`px-2.5 py-1 text-[10px] rounded transition-all cursor-pointer ${
                    currentStep === s.num
                      ? 'bg-[#E54D2E] text-white font-semibold shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause demo' : 'Resume demo'}
              className="p-1 rounded text-stone-400 hover:text-white border border-stone-800 bg-stone-900 cursor-pointer"
            >
              {isPlaying ? (
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Demo Stage Canvas */}
        <div className="p-4 sm:p-7 min-h-[380px] flex flex-col justify-center">
          {/* STEP 1: DISCOVER */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span className="flex items-center gap-2">
                  <span className="text-[#E54D2E] font-bold">01 //</span>
                  <span>ENTER DOMAIN → SITEMAP PARSED</span>
                </span>
                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 text-[10px]">
                  ✓ robots.txt verified
                </span>
              </div>

              {/* Simulated input bar */}
              <div className="flex items-center gap-3 rounded-xl border border-stone-700 bg-stone-900/90 px-4 py-3 font-mono text-xs">
                <span className="text-[#E54D2E]">λ</span>
                <span className="text-stone-100 flex-1">{typedUrl}</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-stone-400 bg-stone-800 px-2 py-1 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  sitemap.xml found
                </span>
              </div>

              {/* Discovered URLs cascading */}
              <div className="rounded-xl border border-stone-800/80 bg-stone-900/50 divide-y divide-stone-800/60 overflow-hidden text-xs font-mono">
                {DEMO_PAGES.map((page, idx) => (
                  <div
                    key={page.slug}
                    className="flex items-center justify-between px-4 py-2 hover:bg-stone-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-stone-500 text-[10px]">#{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-stone-200 truncate">{page.slug}</span>
                      <span className="text-stone-500 text-[11px] hidden sm:inline">({page.title})</span>
                    </div>
                    <span className="text-emerald-400 text-[10px]">{page.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span className="flex items-center gap-2">
                  <span className="text-[#E54D2E] font-bold">02 //</span>
                  <span>CURATE TARGET PAGES</span>
                </span>
                <span className="text-stone-300 font-semibold text-xs">
                  5 of 5 pages selected
                </span>
              </div>

              {/* Filter + Select All bar */}
              <div className="flex items-center justify-between text-xs font-mono bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                <span className="text-stone-400">Filter: <span className="text-stone-200">All matching (5)</span></span>
                <span className="text-xs text-[#E54D2E] font-medium">Select All (5)</span>
              </div>

              {/* Interactive page checklist with checkmarks */}
              <div className="rounded-xl border border-stone-800/80 bg-stone-900/50 divide-y divide-stone-800/60 text-xs font-mono">
                {DEMO_PAGES.map((page) => (
                  <div
                    key={page.slug}
                    className="flex items-center justify-between px-4 py-2.5 bg-stone-900/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded bg-[#E54D2E] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                      <span className="text-stone-200 font-mono">{page.slug}</span>
                      <span className="text-stone-500 text-[11px] hidden sm:inline">— {page.title}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 bg-stone-800/60 px-2 py-0.5 rounded">
                      Queued
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: MULTI-DEVICE SHOOT & FAN-OUT */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span className="flex items-center gap-2">
                  <span className="text-[#E54D2E] font-bold">03 //</span>
                  <span>SIMULTANEOUS EXPOSURE ACROSS 3 VIEWPORTS</span>
                </span>
                <span className="text-[#E54D2E] font-mono text-[10px] uppercase font-bold tracking-wider">
                  ● CAPTURE IN PROGRESS
                </span>
              </div>

              {/* Multi-Device Contact Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Desktop Frame */}
                <ViewfinderFrame
                  frameLabel="FRAME 01 // DESKTOP"
                  badge="1920×1080"
                  active
                  className="rounded-lg bg-stone-900/90 border border-stone-800 overflow-hidden shadow-lg"
                >
                  <div className="p-3 bg-stone-950/80 flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[10px] font-mono text-stone-400">
                      <span>linear.app/</span>
                      <span className="text-emerald-400">2× RETINA</span>
                    </div>
                    {/* Mock desktop content */}
                    <div className="space-y-2 py-3">
                      <div className="h-3 w-3/4 rounded bg-stone-700/80" />
                      <div className="h-2 w-full rounded bg-stone-800" />
                      <div className="h-2 w-5/6 rounded bg-stone-800" />
                      <div className="grid grid-cols-3 gap-1 pt-2">
                        <div className="h-8 rounded bg-stone-800/60 border border-stone-700/40" />
                        <div className="h-8 rounded bg-stone-800/60 border border-stone-700/40" />
                        <div className="h-8 rounded bg-stone-800/60 border border-stone-700/40" />
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-800/60 flex justify-between">
                      <span>DESKTOP CHROMIUM</span>
                      <span className="text-stone-300">1920 × 1080</span>
                    </div>
                  </div>
                </ViewfinderFrame>

                {/* Tablet Frame */}
                <ViewfinderFrame
                  frameLabel="FRAME 02 // TABLET"
                  badge="834×1194"
                  active
                  className="rounded-lg bg-stone-900/90 border border-stone-800 overflow-hidden shadow-lg"
                >
                  <div className="p-3 bg-stone-950/80 flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[10px] font-mono text-stone-400">
                      <span>linear.app/</span>
                      <span className="text-indigo-400">iPad Pro 11</span>
                    </div>
                    <div className="space-y-2 py-3">
                      <div className="h-3 w-4/5 rounded bg-stone-700/80" />
                      <div className="h-2 w-full rounded bg-stone-800" />
                      <div className="grid grid-cols-2 gap-1.5 pt-2">
                        <div className="h-9 rounded bg-stone-800/60 border border-stone-700/40" />
                        <div className="h-9 rounded bg-stone-800/60 border border-stone-700/40" />
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-800/60 flex justify-between">
                      <span>TOUCH EMULATION</span>
                      <span className="text-stone-300">834 × 1194</span>
                    </div>
                  </div>
                </ViewfinderFrame>

                {/* Mobile Frame */}
                <ViewfinderFrame
                  frameLabel="FRAME 03 // MOBILE"
                  badge="393×852"
                  active
                  className="rounded-lg bg-stone-900/90 border border-stone-800 overflow-hidden shadow-lg"
                >
                  <div className="p-3 bg-stone-950/80 flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[10px] font-mono text-stone-400">
                      <span>linear.app/</span>
                      <span className="text-[#FF5733]">iPhone 14</span>
                    </div>
                    {/* Authentic mobile layout */}
                    <div className="space-y-2 py-3">
                      <div className="flex justify-between items-center pb-1">
                        <div className="h-2 w-10 rounded bg-stone-700" />
                        <div className="h-2 w-3 rounded bg-stone-700" />
                      </div>
                      <div className="h-3 w-full rounded bg-stone-700/80" />
                      <div className="h-2 w-4/5 rounded bg-stone-800" />
                      <div className="h-10 rounded bg-stone-800/70 border border-stone-700/50 mt-1" />
                    </div>
                    <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-800/60 flex justify-between">
                      <span>MOBILE USER AGENT</span>
                      <span className="text-stone-300">393 × 852</span>
                    </div>
                  </div>
                </ViewfinderFrame>
              </div>
            </div>
          )}

          {/* STEP 4: ZIP ARCHIVE */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span className="flex items-center gap-2">
                  <span className="text-[#E54D2E] font-bold">04 //</span>
                  <span>STRUCTURED ZIP DELIVERY</span>
                </span>
                <span className="text-emerald-400 text-xs font-semibold">
                  ✓ 15 of 15 Captured in 4.2s
                </span>
              </div>

              {/* Folder tree representation */}
              <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 font-mono text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2 text-stone-200">
                    <svg className="h-4 w-4 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="font-semibold text-white">linear-app-captures.zip</span>
                  </div>
                  <span className="text-[11px] text-stone-500">12.4 MB · 15 files</span>
                </div>

                {/* Folder list */}
                <div className="space-y-1.5 pl-2 text-stone-300 text-[11px]">
                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-stone-600">├──</span>
                    <span className="text-[#E54D2E] font-bold">📁 /desktop/</span>
                    <span className="text-stone-500 text-[10px]">(home.png, features.png, pricing.png, ...)</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-stone-600">├──</span>
                    <span className="text-indigo-400 font-bold">📁 /tablet/</span>
                    <span className="text-stone-500 text-[10px]">(home.png, features.png, pricing.png, ...)</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-stone-600">└──</span>
                    <span className="text-amber-400 font-bold">📁 /mobile-ios/</span>
                    <span className="text-stone-500 text-[10px]">(home.png, features.png, pricing.png, ...)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-mono font-medium shadow-xs">
                    <span>✓ Ready for Hand-off</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Film edge tick marks footer */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-stone-800/80 bg-[#0E0F11] text-[9px] font-mono text-stone-500">
          <span>KODAK SAFETY FILM 5063</span>
          <span className="tracking-widest">◀ 01A · 02A · 03A ▶</span>
          <span>SHOTDOMAIN v2.0</span>
        </div>
      </div>
    </div>
  );
}

export default HeroWorkflowDemo;
