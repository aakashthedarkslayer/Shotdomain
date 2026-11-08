import React from 'react';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 md:py-28 border-y border-stone-200/80 bg-[#F4F4F0] dark:bg-[#121315] dark:border-stone-800">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] dark:text-[#FF5733] font-semibold">
            THE SCREENSHOT TAX
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#121315] dark:text-white mt-3 font-serif">
            A 40-page website across 3 devices is <span className="underline decoration-[#E54D2E] decoration-2 underline-offset-8">120 manual screenshots</span>.
          </h2>
          <p className="mt-5 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            Until now, teams delivering client websites or auditing responsive designs were forced to grind through DevTools page by page, device by device.
          </p>
        </div>

        {/* Side-by-Side Architectural Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* THE OLD MANUAL WAY */}
          <div className="relative rounded-2xl border border-rose-300/80 bg-white p-6 sm:p-8 dark:border-rose-950 dark:bg-stone-900/60 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  ✕ The Manual Way
                </span>
                <span className="text-xs font-mono text-stone-400">~3.5 hours</span>
              </div>

              <div className="my-6">
                <div className="text-4xl sm:text-5xl font-mono font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  120
                </div>
                <div className="text-xs font-mono text-stone-500 mt-1 uppercase tracking-wider">
                  individual captures, clicks & downloads
                </div>
              </div>

              <ul className="space-y-3.5 text-xs font-mono text-stone-600 dark:text-stone-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0">✕</span>
                  <span>Opening DevTools and manually resizing viewports 120 times</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0">✕</span>
                  <span>Full-page captures missing lazy-loaded images (leaving blank grey boxes)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0">✕</span>
                  <span>GDPR cookie popups ruining half your screenshots</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0">✕</span>
                  <span>Files saved as <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-rose-700 dark:text-rose-300">Screen Shot (84).png</code> scattered in Downloads</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0">✕</span>
                  <span>Narrow desktop windows pretending to be mobile instead of real mobile rendering</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 text-[11px] font-mono text-stone-400">
              RESULT: Exhausted designers, messy hand-offs, and missed responsive bugs.
            </div>
          </div>

          {/* THE SHOTDOMAIN WAY */}
          <ViewfinderFrame
            frameLabel="ROLL #01 // SHOTDOMAIN BATCH"
            badge="45 SECONDS"
            active
            className="rounded-2xl border border-stone-300/80 bg-white p-6 sm:p-8 dark:border-stone-700 dark:bg-[#161719] flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <span className="text-xs font-mono font-bold text-[#E54D2E] dark:text-[#FF5733] uppercase tracking-wider">
                  ✓ The ShotDomain Way
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  1-Click Automation
                </span>
              </div>

              <div className="my-6">
                <div className="text-4xl sm:text-5xl font-mono font-black text-[#121315] dark:text-white tracking-tight flex items-baseline gap-2">
                  <span>1</span>
                  <span className="text-sm font-sans font-normal text-stone-500">ZIP archive</span>
                </div>
                <div className="text-xs font-mono text-stone-500 mt-1 uppercase tracking-wider">
                  Clean /desktop, /tablet, /mobile-ios folders
                </div>
              </div>

              <ul className="space-y-3.5 text-xs font-mono text-stone-700 dark:text-stone-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#E54D2E] dark:text-[#FF5733] font-bold shrink-0">✓</span>
                  <span>Automatic sitemap parsing extracts every public page URL in seconds</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#E54D2E] dark:text-[#FF5733] font-bold shrink-0">✓</span>
                  <span>Automated pre-scroll hydrates every lazy-loaded image before shutter release</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#E54D2E] dark:text-[#FF5733] font-bold shrink-0">✓</span>
                  <span>Network-layer ad and cookie banner blocking ensures spotless captures</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#E54D2E] dark:text-[#FF5733] font-bold shrink-0">✓</span>
                  <span>Human-readable filenames like <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-stone-900 dark:text-stone-100">about-team.png</code> sorted by device folder</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#E54D2E] dark:text-[#FF5733] font-bold shrink-0">✓</span>
                  <span>Real mobile emulation with native touch, user-agent and 3× retina scale</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 text-[11px] font-mono text-[#E54D2E] dark:text-[#FF5733] font-medium">
              RESULT: Hand over a complete responsive archive to clients in under 1 minute.
            </div>
          </ViewfinderFrame>
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
