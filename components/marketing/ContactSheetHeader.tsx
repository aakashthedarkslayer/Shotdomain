'use client';

import Link from 'next/link';
import { useState } from 'react';

export function ContactSheetHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FBFBFA]/90 backdrop-blur-md dark:border-stone-800 dark:bg-[#0E0F11]/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Mark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#121315] text-white shadow-xs border border-stone-800 dark:bg-stone-900 dark:border-stone-700 group-hover:border-[#E54D2E] transition-colors">
            {/* Viewfinder brackets */}
            <span className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[#E54D2E]" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-[#E54D2E]" />
            <span className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-[#E54D2E]" />
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#E54D2E]" />
            {/* Aperture dot */}
            <div className="h-2 w-2 rounded-full bg-[#E54D2E] group-hover:scale-125 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#121315] dark:text-white">
                ShotDomain
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/80 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400">
                shotdomain.com
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-mono text-stone-600 dark:text-stone-400">
          <a
            href="#how-it-works"
            className="hover:text-[#E54D2E] dark:hover:text-[#FF5733] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#quality-engine"
            className="hover:text-[#E54D2E] dark:hover:text-[#FF5733] transition-colors"
          >
            The Engine
          </a>
          <a
            href="#multi-device"
            className="hover:text-[#E54D2E] dark:hover:text-[#FF5733] transition-colors"
          >
            Multi-Device
          </a>
          <a
            href="#pricing"
            className="hover:text-[#E54D2E] dark:hover:text-[#FF5733] transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="hover:text-[#E54D2E] dark:hover:text-[#FF5733] transition-colors"
          >
            FAQ
          </a>
          <Link
            href="/schedules"
            className="hover:text-[#E54D2E] dark:hover:text-[#FF5733] transition-colors flex items-center gap-1.5 text-stone-500"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Schedules
          </Link>
        </nav>

        {/* CTA Bar */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs font-mono text-stone-600 hover:text-[#121315] dark:text-stone-400 dark:hover:text-white px-2.5 py-1.5 transition-colors"
          >
            Log in
          </Link>

          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121315] text-white hover:bg-[#E54D2E] text-xs font-mono font-medium transition-all shadow-xs border border-transparent dark:bg-stone-100 dark:text-[#121315] dark:hover:bg-[#FF5733] dark:hover:text-white active:scale-95 cursor-pointer"
          >
            <span>Open App</span>
            <span aria-hidden="true">→</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg border border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-400"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-stone-200 bg-[#FBFBFA] px-4 py-4 dark:border-stone-800 dark:bg-[#0E0F11]">
          <div className="flex flex-col gap-3 text-xs font-mono">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-stone-700 dark:text-stone-300"
            >
              How It Works
            </a>
            <a
              href="#quality-engine"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-stone-700 dark:text-stone-300"
            >
              The Engine
            </a>
            <a
              href="#multi-device"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-stone-700 dark:text-stone-300"
            >
              Multi-Device
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-stone-700 dark:text-stone-300"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-stone-700 dark:text-stone-300"
            >
              FAQ
            </a>
            <Link
              href="/schedules"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Scheduled Captures
            </Link>
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <Link href="/login" className="text-stone-600 dark:text-stone-400 py-1">
                Log in
              </Link>
              <Link
                href="/app"
                className="px-3 py-1.5 rounded bg-[#121315] text-white text-xs font-mono dark:bg-white dark:text-black"
              >
                Open App →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default ContactSheetHeader;
