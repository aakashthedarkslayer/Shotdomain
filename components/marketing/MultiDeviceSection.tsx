import React from 'react';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

export function MultiDeviceSection() {
  return (
    <section id="multi-device" className="py-20 md:py-28 bg-[#FBFBFA] dark:bg-[#0E0F11]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] dark:text-[#FF5733] font-semibold">
            THE MULTI-DEVICE MATRIX
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121315] dark:text-white mt-3 font-serif">
            Pick devices once per job. <br />
            Not once per page.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-sans">
            Select one, two, or all four device viewports in Settings. Every discovered URL is captured across each selected size and sorted into dedicated directories.
          </p>
        </div>

        {/* 3-Tier Multi-Device Frame Showcase */}
        <div className="flex flex-col lg:flex-row items-end justify-center gap-6">
          {/* Desktop Frame */}
          <div className="w-full lg:w-[50%] shrink-0">
            <ViewfinderFrame
              frameLabel="FRAME 01 // DESKTOP VIEWPORT"
              badge="1920 × 1080"
              active
              className="rounded-2xl border border-stone-300/80 bg-white p-4 sm:p-5 shadow-lg dark:border-stone-800 dark:bg-stone-900/80"
            >
              <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden dark:border-stone-800 dark:bg-stone-950">
                {/* Desktop top bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-white text-[10px] font-mono text-stone-500 dark:border-stone-800 dark:bg-stone-900">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span>1920 × 1080 · 1× Scale</span>
                </div>
                {/* Mock content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-2 dark:border-stone-800">
                    <div className="h-3 w-16 bg-stone-800 rounded dark:bg-stone-200" />
                    <div className="flex gap-2">
                      <div className="h-2 w-8 bg-stone-300 rounded dark:bg-stone-700" />
                      <div className="h-2 w-8 bg-stone-300 rounded dark:bg-stone-700" />
                      <div className="h-2 w-8 bg-stone-300 rounded dark:bg-stone-700" />
                    </div>
                  </div>
                  <div className="h-5 w-2/3 bg-stone-800 rounded dark:bg-stone-200 font-serif" />
                  <div className="h-2.5 w-5/6 bg-stone-300 rounded dark:bg-stone-700" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-14 rounded-lg bg-stone-200/80 dark:bg-stone-800/80" />
                    <div className="h-14 rounded-lg bg-stone-200/80 dark:bg-stone-800/80" />
                    <div className="h-14 rounded-lg bg-stone-200/80 dark:bg-stone-800/80" />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>FOLDER: /desktop/</span>
                <span className="text-[#E54D2E] font-semibold">100% Full-bleed</span>
              </div>
            </ViewfinderFrame>
          </div>

          {/* Tablet Frame */}
          <div className="w-full sm:w-[50%] lg:w-[28%] shrink-0">
            <ViewfinderFrame
              frameLabel="FRAME 02 // TABLET"
              badge="834 × 1194"
              className="rounded-2xl border border-stone-300/80 bg-white p-4 shadow-md dark:border-stone-800 dark:bg-stone-900/80"
            >
              <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden dark:border-stone-800 dark:bg-stone-950">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-stone-200 bg-white text-[10px] font-mono text-stone-500 dark:border-stone-800 dark:bg-stone-900">
                  <span>iPad Pro 11</span>
                  <span>2× Retina</span>
                </div>
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200/60 dark:border-stone-800">
                    <div className="h-2.5 w-12 bg-stone-800 rounded dark:bg-stone-200" />
                    <div className="h-2 w-6 bg-stone-400 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-stone-800 rounded dark:bg-stone-200" />
                  <div className="h-2 w-full bg-stone-300 rounded dark:bg-stone-700" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="h-16 rounded bg-stone-200/80 dark:bg-stone-800" />
                    <div className="h-16 rounded bg-stone-200/80 dark:bg-stone-800" />
                  </div>
                  <div className="h-2 w-4/5 bg-stone-300 rounded dark:bg-stone-700" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>FOLDER: /tablet/</span>
                <span className="text-indigo-500 font-semibold">Touch UI</span>
              </div>
            </ViewfinderFrame>
          </div>

          {/* Mobile Frame */}
          <div className="w-full sm:w-[45%] lg:w-[22%] shrink-0">
            <ViewfinderFrame
              frameLabel="FRAME 03 // MOBILE"
              badge="393 × 852"
              className="rounded-2xl border border-stone-300/80 bg-white p-3.5 shadow-md dark:border-stone-800 dark:bg-stone-900/80"
            >
              <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden dark:border-stone-800 dark:bg-stone-950">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-stone-200 bg-white text-[9px] font-mono text-stone-500 dark:border-stone-800 dark:bg-stone-900">
                  <span>iPhone 14 Pro</span>
                  <span>3× Scale</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-2 w-10 bg-stone-800 rounded dark:bg-stone-200" />
                    <div className="h-2 w-3 bg-stone-800 rounded dark:bg-stone-200" />
                  </div>
                  <div className="h-3.5 w-full bg-stone-800 rounded dark:bg-stone-200" />
                  <div className="h-2 w-4/5 bg-stone-300 rounded dark:bg-stone-700" />
                  <div className="h-16 w-full rounded bg-stone-200/80 dark:bg-stone-800" />
                  <div className="h-7 w-full rounded bg-stone-900 text-white flex items-center justify-center text-[9px] font-mono font-bold dark:bg-stone-100 dark:text-black">
                    Touch CTA
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>/mobile-ios/</span>
                <span className="text-amber-500 font-semibold">Native UA</span>
              </div>
            </ViewfinderFrame>
          </div>
        </div>

        {/* Directory Structure Summary Badge */}
        <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 font-mono text-xs text-stone-600 dark:border-stone-800 dark:bg-[#161719] dark:text-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#E54D2E]" />
            <span>Folder architecture in your downloaded ZIP:</span>
            <span className="text-stone-900 dark:text-white font-bold">
              /desktop/ · /tablet/ · /mobile-ios/
            </span>
          </div>
          <span className="text-[11px] text-stone-500">
            Filenames match URL paths (<code className="text-stone-700 dark:text-stone-300">about-team.png</code>)
          </span>
        </div>
      </div>
    </section>
  );
}

export default MultiDeviceSection;
