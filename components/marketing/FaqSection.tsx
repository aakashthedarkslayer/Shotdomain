'use client';

import React, { useState } from 'react';
import { ViewfinderFrame } from '../ui/ViewfinderFrame';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'sitemap',
    category: 'DISCOVERY',
    question: 'How does sitemap discovery work? What if my site has no sitemap.xml?',
    answer:
      'Shotdomain first queries standard endpoints (/sitemap.xml, /sitemap_index.xml, and sitemap references in /robots.txt). If an XML sitemap is found, it parses and deduplicates every canonical URL. If no XML sitemap exists, our fallback crawler performs an internal link harvest directly from your homepage, identifying all internal subpages on the same origin so you still receive a complete page inventory.',
  },
  {
    id: 'lazy-loading',
    category: 'QUALITY',
    question: 'How do you prevent blank images and clipped heights on lazy-loaded pages?',
    answer:
      'Standard screenshot APIs snap the screen immediately, leaving gray placeholder boxes where images have not yet scrolled into view. Shotdomain performs an automated pre-capture scroll pass: a headless script scrolls smoothly from header to footer to trigger IntersectionObserver events, waits for network idle, confirms document.fonts.ready has resolved, and only then triggers the shutter at full scroll height.',
  },
  {
    id: 'mobile-emulation',
    category: 'RESPONSIVE',
    question: 'Are mobile screenshots just a desktop window squeezed to 375px?',
    answer:
      'Never. Simply resizing a desktop viewport fails to trigger @media (hover: none) styles, does not emulate mobile touch capabilities, and sends a desktop User-Agent string. Shotdomain provisions real mobile emulation profiles with authentic Mobile Safari and Chrome user agents, active touch event emulation, and authentic 2× or 3× device pixel density.',
  },
  {
    id: 'cookie-banners',
    category: 'ENGINE',
    question: 'How are cookie consent banners and sticky overlays removed?',
    answer:
      'Our engine includes an intelligent suppression layer targeting OneTrust, Cookiebot, Osano, Termly, Didomi, and hundreds of standard consent selectors. In addition to hiding the banner element, our script unlocks CSS rules like body { overflow: hidden } to prevent artificial page clipping and restore true document height.',
  },
  {
    id: 'performance',
    category: 'SPEED',
    question: 'How fast is a batch capture across 20+ pages?',
    answer:
      'Traditional screenshot tools spawn a fresh browser process for every URL, wasting 3–5 seconds per page on browser startup alone. Shotdomain reuses a warm single-browser instance and schedules tabs through a 3–5 page concurrency pool. A 20-page site with multi-device capture finishes in approximately 60 to 90 seconds.',
  },
  {
    id: 'scheduling',
    category: 'AUTOMATION',
    question: 'Can I schedule automated weekly captures and get notified by email?',
    answer:
      'Yes. In the Schedules dashboard, you can configure recurring daily or weekly monitoring runs for any site. Choose your time (AM/PM), pick your device viewports, and enter your email address. Shotdomain runs the job in the background and delivers an email notification containing a direct link to download the structured ZIP.',
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('sitemap');

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-24 border-b border-stone-200 dark:border-stone-800 bg-[#FBFBFA] dark:bg-[#121315]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="w-2 h-2 rounded-full bg-[#E54D2E]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#E54D2E] font-semibold">
              [SECTION 06 / FAQ]
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 dark:text-stone-100 tracking-tight">
            Clear answers. Technical honesty.
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            Everything you need to know about the crawling logic, headless rendering engine, and output packaging.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openId === faq.id;

            return (
              <ViewfinderFrame
                key={faq.id}
                frameLabel={`FAQ [0${index + 1}] // ${faq.category}`}
                active={isOpen}
                cornerSize={10}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-colors"
              >
                <div className="p-4 sm:p-6">
                  <button
                    onClick={() => toggle(faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg font-serif font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#E54D2E] dark:group-hover:text-[#FF5733] transition-colors">
                      {faq.question}
                    </span>
                    <span
                      className={`font-mono text-sm px-2 py-1 rounded transition-transform duration-200 shrink-0 ${
                        isOpen
                          ? 'rotate-45 text-[#E54D2E] bg-orange-100 dark:bg-orange-950/60'
                          : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300'
                      }`}
                    >
                      +
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </ViewfinderFrame>
            );
          })}
        </div>

        {/* Technical Support Line */}
        <div className="mt-12 text-center text-xs font-mono text-stone-500">
          Have an unusual rendering edge case or custom auth cookie requirement?{' '}
          <a href="/app" className="text-[#E54D2E] underline underline-offset-4 hover:text-[#d03f22]">
            Test your domain in the app
          </a>{' '}
          or reach out directly.
        </div>
      </div>
    </section>
  );
}
