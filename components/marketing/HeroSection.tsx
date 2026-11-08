'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroWorkflowDemo } from './HeroWorkflowDemo';

export function HeroSection() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmed = urlInput.trim();
    if (!trimmed) {
      router.push('/app');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    router.push(`/app?url=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Subtle Hairline Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4df08_1px,transparent_1px),linear-gradient(to_bottom,#e4e4df08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
        {/* Contact Sheet Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white/80 px-3.5 py-1 text-xs font-mono text-stone-700 shadow-xs mb-8 dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300">
          <span className="h-2 w-2 rounded-full bg-[#E54D2E]" />
          <span>THE DIGITAL CONTACT SHEET FOR WEBSITES</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#121315] dark:text-white leading-[1.08] mb-6 font-serif">
          One URL. Every page. <br className="hidden sm:inline" />
          Every device. <span className="italic font-normal text-[#E54D2E] dark:text-[#FF5733]">One ZIP.</span>
        </h1>

        {/* Concise Subhead */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-stone-600 dark:text-stone-300 mb-10 leading-relaxed">
          Stop capturing responsive websites page-by-page. Shotdomain discovers your entire sitemap, captures full-bleed retina screenshots across desktop, tablet, and mobile, and delivers a structured ZIP in seconds.
        </p>

        {/* Working URL Input Bar with Viewfinder Framing */}
        <div className="mx-auto max-w-xl mb-6">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col sm:flex-row items-stretch gap-2.5 p-1.5 rounded-2xl border border-stone-300 bg-white shadow-md dark:border-stone-700 dark:bg-stone-900"
          >
            {/* Viewfinder corner brackets on input */}
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#E54D2E] pointer-events-none" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#E54D2E] pointer-events-none" />
            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#E54D2E] pointer-events-none" />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#E54D2E] pointer-events-none" />

            <div className="relative flex-1 flex items-center pl-3">
              <span className="font-mono text-xs text-stone-400 select-none mr-2">https://</span>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full bg-transparent py-2.5 pr-3 text-sm font-mono text-[#121315] placeholder:text-stone-400 focus:outline-none dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#121315] text-white hover:bg-[#E54D2E] text-xs font-mono font-semibold transition-all shadow-xs dark:bg-white dark:text-[#121315] dark:hover:bg-[#FF5733] dark:hover:text-white cursor-pointer active:scale-98 shrink-0"
            >
              <span>Capture Site</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          {/* Quick micro text under input */}
          <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-stone-500 mt-3">
            <span>✓ No credit card required</span>
            <span>·</span>
            <span>✓ 5 free captures</span>
            <span>·</span>
            <a
              href="#how-it-works"
              className="hover:text-[#E54D2E] underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700 transition-colors"
            >
              See how it works ↓
            </a>
          </div>
        </div>

        {/* Hero Interactive Workflow Machine */}
        <div className="mt-12 md:mt-16">
          <HeroWorkflowDemo />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
