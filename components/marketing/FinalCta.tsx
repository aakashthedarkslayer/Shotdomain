'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViewfinderFrame } from '../ui/ViewfinderFrame';

export function FinalCta() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    router.push(`/app?url=${encodeURIComponent(target)}`);
  };

  return (
    <section className="py-24 bg-stone-900 text-stone-100 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ViewfinderFrame
          frameLabel="FRAME 99 // DARKROOM READY FOR EXPOSURE"
          badge="1-CLICK DISCOVERY"
          active={true}
          cornerSize={16}
          className="bg-stone-950 border border-stone-800 p-8 sm:p-14 rounded-xl shadow-2xl text-center"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
              <span className="w-2 h-2 rounded-full bg-[#E54D2E] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#E54D2E] font-semibold">
                Instant Darkroom Run
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-white leading-tight">
              One URL. Every page.
              <br />
              <span className="text-[#FF5733] italic font-normal">Every device viewport.</span>
            </h2>

            <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
              Stop pasting links one by one. Crawl the sitemap, select your pages, pick your screen sizes,
              and receive an organized contact sheet archive in seconds.
            </p>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="pt-4 max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-2 bg-stone-900/90 p-1.5 rounded-lg border border-stone-700/80 focus-within:border-[#E54D2E] transition-colors">
                <div className="flex-1 flex items-center pl-3">
                  <span className="text-stone-500 font-mono text-xs select-none">https://</span>
                  <input
                    type="text"
                    value={url.replace(/^https?:\/\//, '')}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourcompany.com"
                    aria-label="Target website domain for screenshots"
                    className="w-full bg-transparent px-2 py-2.5 text-sm font-mono text-white placeholder-stone-500 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded bg-[#E54D2E] hover:bg-[#d03f22] text-white font-mono text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {loading ? (
                    <span>Opening Darkroom...</span>
                  ) : (
                    <>
                      <span>Expose Site</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Trust & Guarantee items */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-stone-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Free 15-page crawl
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Watermark-free ZIP
              </span>
            </div>
          </div>
        </ViewfinderFrame>
      </div>
    </section>
  );
}
