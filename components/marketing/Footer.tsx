'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 border-t border-stone-800 text-xs font-mono select-none">
      {/* Film roll sprocket perforation simulation */}
      <div className="border-b border-stone-900 bg-stone-950 py-2 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 opacity-40 text-[10px] tracking-widest text-stone-500 whitespace-nowrap">
          <span>■ ■ ■ 01A</span>
          <span>SHOTDOMAIN EMULSION #400</span>
          <span>■ ■ ■ 02A</span>
          <span>KODAK SAFETY FILM</span>
          <span>■ ■ ■ 03A</span>
          <span>RETINA 2X SHUTTER</span>
          <span>■ ■ ■ 04A</span>
          <span>CONTACT SHEET BATCH</span>
          <span>■ ■ ■ 05A</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded border border-stone-700 bg-stone-900 flex items-center justify-center text-[#E54D2E] font-bold text-xs">
                ⌜⌟
              </span>
              <span className="text-base font-serif font-bold text-stone-100 tracking-tight">
                SHOTDOMAIN
              </span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-stone-800 text-stone-300 font-mono">
                v2.4
              </span>
            </div>

            <p className="text-stone-400 font-sans text-xs leading-relaxed max-w-sm">
              The automated contact sheet engine for modern websites. Crawl complete sitemaps, capture multiple
              device viewports at 2× Retina resolution, and download a structured ZIP archive in seconds.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Capture Engine Online (Chromium Headless)</span>
            </div>
          </div>

          {/* Column 1: Application */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-stone-200 font-bold">
              Darkroom App
            </div>
            <ul className="space-y-2 text-stone-400">
              <li>
                <Link href="/app" className="hover:text-stone-100 transition-colors">
                  Open Capture Tool
                </Link>
              </li>
              <li>
                <Link href="/schedules" className="hover:text-stone-100 transition-colors">
                  Schedules Dashboard
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-stone-100 transition-colors">
                  4-Step Workflow
                </a>
              </li>
              <li>
                <a href="#multi-device" className="hover:text-stone-100 transition-colors">
                  Multi-Device Viewports
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-stone-100 transition-colors">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Engine Specs */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-stone-200 font-bold">
              Engine Specs
            </div>
            <ul className="space-y-2 text-stone-400">
              <li>
                <a href="#quality-engine" className="hover:text-stone-100 transition-colors">
                  Lazy-Load Scroll Pass
                </a>
              </li>
              <li>
                <a href="#quality-engine" className="hover:text-stone-100 transition-colors">
                  Cookie Banner Removal
                </a>
              </li>
              <li>
                <a href="#quality-engine" className="hover:text-stone-100 transition-colors">
                  2× Retina DPI Sharpness
                </a>
              </li>
              <li>
                <a href="#quality-engine" className="hover:text-stone-100 transition-colors">
                  True Mobile Emulation
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-stone-100 transition-colors">
                  Concurrency Pool (3–5x)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Use Cases & Docs */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-stone-200 font-bold">
              Use Cases
            </div>
            <ul className="space-y-2 text-stone-400">
              <li>
                <a href="#use-cases" className="hover:text-stone-100 transition-colors">
                  Agency Client Handoffs
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-stone-100 transition-colors">
                  Responsive Design QA
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-stone-100 transition-colors">
                  Pre-Redesign Archival
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-stone-100 transition-colors">
                  SEO & Regulatory Audits
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-stone-100 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <div className="flex items-center gap-4">
            <span>© 2026 Shotdomain. All rights reserved.</span>
            <span>•</span>
            <span>Archival Darkroom Architecture</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-stone-300 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-stone-300 transition-colors">
              Create Account
            </Link>
            <a href="#top" className="text-[#E54D2E] hover:underline">
              Back to Top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
