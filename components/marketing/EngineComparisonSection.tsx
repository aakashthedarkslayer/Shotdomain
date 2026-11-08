'use client';

import React, { useState } from 'react';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface QualityFeature {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  description: string;
  technicalNote: string;
  beforeLabel: string;
  afterLabel: string;
  beforeVisual: React.ReactNode;
  afterVisual: React.ReactNode;
}

export function EngineComparisonSection() {
  const [activeTab, setActiveTab] = useState<'lazy' | 'cookie' | 'retina' | 'mobile'>('lazy');
  const [sliderPos, setSliderPos] = useState<number>(50);

  const features: Record<string, QualityFeature> = {
    lazy: {
      id: 'lazy',
      tabLabel: 'Lazy-Loaded Images',
      badge: 'PRE-SCROLL HYDRATION',
      title: 'Full-page captures with zero blank placeholder boxes.',
      description:
        'Standard screenshot tools take a full-page screenshot immediately, capturing blank skeleton boxes because modern images only load when scrolled into view. Shotdomain performs an automated bottom-and-back pre-scroll before triggering the shutter.',
      technicalNote:
        'Engine scrolls through document.body.scrollHeight, awaits networkidle, and returns to top.',
      beforeLabel: 'Standard Tool (Blank Placeholders)',
      afterLabel: 'Shotdomain (Hydrated Content)',
      beforeVisual: (
        <div className="h-full w-full bg-stone-100 p-5 flex flex-col justify-between dark:bg-stone-900">
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-stone-300 rounded dark:bg-stone-700" />
            <div className="h-3 w-3/4 bg-stone-200 rounded dark:bg-stone-800" />
            {/* Blank image skeleton */}
            <div className="h-44 w-full rounded-xl bg-stone-200/90 border border-stone-300/80 flex flex-col items-center justify-center text-stone-400 font-mono text-xs dark:bg-stone-800 dark:border-stone-700">
              <svg className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>[Image not in viewport — blank placeholder]</span>
            </div>
            <div className="h-3 w-5/6 bg-stone-200 rounded dark:bg-stone-800" />
          </div>
          <div className="text-[10px] font-mono text-rose-500 font-semibold">
            ✕ UNHYDRATED LAZY-LOAD
          </div>
        </div>
      ),
      afterVisual: (
        <div className="h-full w-full bg-white p-5 flex flex-col justify-between dark:bg-[#161719]">
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-stone-800 rounded dark:bg-stone-300" />
            <div className="h-3 w-3/4 bg-stone-400 rounded dark:bg-stone-600" />
            {/* Rich photo visual */}
            <div className="relative h-44 w-full rounded-xl bg-gradient-to-tr from-amber-700 via-orange-600 to-rose-700 overflow-hidden shadow-inner flex items-end p-4">
              <div className="text-white text-xs font-mono bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded border border-white/20">
                ✓ Full-Resolution Asset Loaded
              </div>
            </div>
            <div className="h-3 w-5/6 bg-stone-300 rounded dark:bg-stone-700" />
          </div>
          <div className="text-[10px] font-mono text-emerald-500 font-semibold">
            ✓ 100% PRE-SCROLLED & CAPTURED
          </div>
        </div>
      ),
    },
    cookie: {
      id: 'cookie',
      tabLabel: 'Cookie Banner Removal',
      badge: 'NETWORK-LAYER INTERCEPTION',
      title: 'Spotless screenshots without consent popups in the way.',
      description:
        'Nothing ruins a client proposal or redesign archive faster than a giant cookie banner blocking the hero headline. Shotdomain intercepts tracker networks and removes common cookie overlays before capture.',
      technicalNote:
        'Intercepts known consent domains and blocks ad telemetry routes at the Playwright network level.',
      beforeLabel: 'Standard Tool (Blocked by Banner)',
      afterLabel: 'Shotdomain (Clean Canvas)',
      beforeVisual: (
        <div className="relative h-full w-full bg-stone-50 p-5 flex flex-col justify-between dark:bg-stone-900 overflow-hidden">
          <div className="space-y-3 opacity-40">
            <div className="h-4 w-1/2 bg-stone-400 rounded" />
            <div className="h-3 w-3/4 bg-stone-300 rounded" />
            <div className="h-28 w-full rounded-lg bg-stone-300" />
          </div>
          {/* Obstructing Cookie Banner */}
          <div className="absolute inset-x-4 bottom-4 rounded-xl border border-stone-300 bg-white p-4 shadow-xl dark:bg-stone-800 dark:border-stone-700 font-mono text-xs z-10">
            <div className="font-bold text-stone-800 dark:text-stone-100 mb-1">
              Cookie & Tracking Preferences
            </div>
            <div className="text-[10px] text-stone-500 mb-3">
              We and our 42 partners use cookies to collect telemetry and personalize ads...
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded bg-stone-900 text-white text-[10px]">Accept All</span>
              <span className="px-2 py-1 rounded border border-stone-300 text-[10px]">Manage</span>
            </div>
          </div>
        </div>
      ),
      afterVisual: (
        <div className="h-full w-full bg-white p-5 flex flex-col justify-between dark:bg-[#161719]">
          <div className="space-y-4">
            <div className="h-5 w-1/2 bg-stone-900 rounded dark:bg-stone-100" />
            <div className="h-3 w-3/4 bg-stone-500 rounded dark:bg-stone-400" />
            <div className="h-28 w-full rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-200 dark:from-stone-800 dark:to-stone-900 dark:border-stone-700 p-4 flex items-center justify-center font-mono text-xs text-stone-600 dark:text-stone-300">
              Clean, Unobstructed Hero Visual
            </div>
            <div className="h-3 w-2/3 bg-stone-400 rounded dark:bg-stone-600" />
          </div>
          <div className="text-[10px] font-mono text-emerald-500 font-semibold">
            ✓ ZERO OVERLAYS OR PRIVACY MODALS
          </div>
        </div>
      ),
    },
    retina: {
      id: 'retina',
      tabLabel: '2× Retina Sharpness',
      badge: 'DEVICE SCALE FACTOR',
      title: 'Razor-sharp typography and high-DPI graphics.',
      description:
        'Most screenshot engines default to 1× deviceScaleFactor, producing blurry text and pixelated logos on modern high-DPI displays. Shotdomain shoots with native high-DPI device scale factors (2× for iPad/Retina, 3× for iPhone).',
      technicalNote:
        'Uses Playwright deviceScaleFactor: 2 (and 3 for mobile) for crisp 4K presentation.',
      beforeLabel: 'Standard 1× Capture (Pixelated)',
      afterLabel: 'Shotdomain 2× Retina (Crisp)',
      beforeVisual: (
        <div className="h-full w-full bg-stone-100 p-6 flex flex-col items-center justify-center text-center dark:bg-stone-900">
          <div className="font-serif text-3xl text-stone-500 font-bold blur-[0.7px] tracking-tight">
            Design Quality
          </div>
          <div className="font-mono text-xs text-stone-400 blur-[0.5px] mt-2">
            1× Standard DPI (Fuzzy pixels on zoom)
          </div>
          <div className="mt-4 px-3 py-1 bg-stone-200 text-stone-600 rounded text-[10px] font-mono dark:bg-stone-800 dark:text-stone-400">
            72 DPI Raster
          </div>
        </div>
      ),
      afterVisual: (
        <div className="h-full w-full bg-white p-6 flex flex-col items-center justify-center text-center dark:bg-[#161719]">
          <div className="font-serif text-3xl text-[#121315] font-bold tracking-tight dark:text-white">
            Design Quality
          </div>
          <div className="font-mono text-xs text-[#E54D2E] dark:text-[#FF5733] font-semibold mt-2">
            2× Native Retina (Razor-sharp vector edges)
          </div>
          <div className="mt-4 px-3 py-1 bg-stone-100 border border-stone-200 text-stone-800 rounded text-[10px] font-mono dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200">
            144+ DPI High-Density
          </div>
        </div>
      ),
    },
    mobile: {
      id: 'mobile',
      tabLabel: 'Authentic Mobile',
      badge: 'REAL USER AGENT + TOUCH',
      title: 'Real responsive mobile layouts, not squished desktop windows.',
      description:
        'A narrow desktop viewport does not equal mobile. Without a mobile user-agent, touch emulation, and mobile device descriptors, sites serve desktop navigation and oversized components. Shotdomain emulates genuine mobile devices.',
      technicalNote:
        'Emulates iPhone 14 Pro & Pixel 7 with native touch events, isMobile: true, and mobile UA.',
      beforeLabel: 'Narrow Desktop (Squished Desktop UI)',
      afterLabel: 'Shotdomain (True Mobile Layout)',
      beforeVisual: (
        <div className="h-full w-full bg-stone-100 p-4 font-mono text-[10px] text-stone-600 dark:bg-stone-900 dark:text-stone-400">
          <div className="border-b border-stone-300 pb-2 mb-3 flex justify-between overflow-x-hidden whitespace-nowrap opacity-60">
            <span>Logo</span>
            <span>Home Products Pricing Blog Docs Contact</span>
          </div>
          <div className="text-center text-rose-500 font-semibold py-8">
            [Desktop header overflowing horizontally]
            <div className="text-[9px] text-stone-500 mt-1">
              Desktop navigation squeezed into 393px width
            </div>
          </div>
        </div>
      ),
      afterVisual: (
        <div className="h-full w-full bg-white p-4 font-mono text-xs text-stone-800 dark:bg-[#161719] dark:text-stone-200">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3 dark:border-stone-800">
            <span className="font-bold">Logo</span>
            {/* Real Mobile Hamburger Menu */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[10px] text-[#E54D2E]">
              <span>☰ Menu</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-3/4 bg-stone-800 rounded dark:bg-stone-200" />
            <div className="h-2 w-full bg-stone-300 rounded dark:bg-stone-700" />
            <div className="h-10 w-full rounded bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold mt-3 dark:bg-stone-100 dark:text-black">
              Touch-Optimized CTA Button
            </div>
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-4">
            ✓ AUTHENTIC MOBILE VIEWPORT & TOUCH
          </div>
        </div>
      ),
    },
  };

  const currentFeature = features[activeTab];

  return (
    <section id="quality-engine" className="py-20 md:py-28 border-t border-stone-200/80 bg-[#F4F4F0] dark:bg-[#121315] dark:border-stone-800">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] dark:text-[#FF5733] font-semibold">
            THE CAPTURE ENGINE
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121315] dark:text-white mt-3 font-serif">
            Built for designers and QA who actually zoom in.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-sans">
            Drag the split-slider to see how Shotdomain solves the four biggest quality bugs in automated web screenshots.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {Object.values(features).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveTab(f.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === f.id
                  ? 'bg-[#121315] text-white font-semibold shadow-xs dark:bg-white dark:text-[#121315]'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800'
              }`}
            >
              {f.tabLabel}
            </button>
          ))}
        </div>

        {/* Feature Interactive Comparison Viewer */}
        <ViewfinderFrame
          frameLabel={`ENGINE INSPECTOR // ${currentFeature.badge}`}
          active
          className="rounded-2xl border border-stone-300/80 bg-white p-6 sm:p-8 shadow-md dark:border-stone-700 dark:bg-[#161719]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left text column */}
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E54D2E]/10 text-[#E54D2E] dark:bg-[#FF5733]/10 dark:text-[#FF5733]">
                {currentFeature.badge}
              </span>
              <h3 className="text-2xl font-bold font-serif text-[#121315] dark:text-white leading-snug">
                {currentFeature.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                {currentFeature.description}
              </p>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 font-mono text-[11px] text-stone-500 dark:bg-stone-900/80 dark:border-stone-800">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Under the hood: </span>
                {currentFeature.technicalNote}
              </div>
            </div>

            {/* Right split slider visual */}
            <div className="lg:col-span-7">
              <div className="relative h-[290px] w-full rounded-xl border border-stone-300/80 overflow-hidden shadow-inner dark:border-stone-700 select-none">
                {/* Background: After (Shotdomain) */}
                <div className="absolute inset-0">
                  {currentFeature.afterVisual}
                </div>

                {/* Foreground: Before (clipped by sliderPos) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#E54D2E] dark:border-[#FF5733] z-10"
                  style={{ width: `${sliderPos}%` }}
                >
                  <div className="absolute inset-0 w-[550px] sm:w-[650px]">
                    {currentFeature.beforeVisual}
                  </div>
                </div>

                {/* Split Slider Handle */}
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center -ml-3.5"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="h-8 w-7 rounded-md bg-[#121315] text-white flex items-center justify-center text-[10px] shadow-lg border border-stone-400/40">
                    ↔
                  </div>
                </div>

                {/* Range Input Overlay for Dragging */}
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  aria-label="Before and after split slider"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                />

                {/* Top Labels */}
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/70 text-white backdrop-blur-xs">
                    ← Without ShotDomain
                  </span>
                </div>
                <div className="absolute top-2 right-2 z-20 pointer-events-none">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E54D2E] text-white backdrop-blur-xs">
                    With ShotDomain Engine →
                  </span>
                </div>
              </div>

              {/* Slider instruction helper */}
              <div className="mt-2.5 text-center text-[11px] font-mono text-stone-500">
                Drag slider to compare quality difference
              </div>
            </div>
          </div>
        </ViewfinderFrame>
      </div>
    </section>
  );
}

export default EngineComparisonSection;
