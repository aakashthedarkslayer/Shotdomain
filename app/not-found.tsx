import React from 'react';
import Link from 'next/link';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

export const metadata = {
  title: '404 — Frame Not Found | Shotdomain',
  description: 'Unexposed negative. The requested frame was not found on this contact sheet.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#121315] flex flex-col items-center justify-center p-6 text-[#121315] dark:text-stone-100 font-sans">
      <div className="max-w-md w-full">
        <ViewfinderFrame
          frameLabel="FRAME 00 // UNEXPOSED NEGATIVE"
          badge="ERR 404"
          active={true}
          cornerSize={14}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 text-center shadow-lg"
        >
          <div className="space-y-6">
            {/* Aperture icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-[#E54D2E]/30 flex items-center justify-center text-[#E54D2E]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#E54D2E] font-semibold">
                [BLANK FRAME EXPOSURE]
              </span>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Frame Not Found
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
                This frame on the contact sheet is completely blank. The path you navigated to does not exist on this reel.
              </p>
            </div>

            {/* Film technical readout */}
            <div className="p-3 rounded bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 text-[11px] font-mono text-stone-500 text-left space-y-1">
              <div>STATUS: <span className="text-rose-500 font-semibold">HTTP 404 NOT FOUND</span></div>
              <div>REEL: <span className="text-stone-700 dark:text-stone-300">SHOTDOMAIN ARCHIVAL</span></div>
              <div>SUGGESTION: <span className="text-stone-700 dark:text-stone-300">Check URL or return to darkroom</span></div>
            </div>

            {/* Navigation links */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/app"
                className="flex-1 py-2.5 px-4 rounded bg-[#E54D2E] hover:bg-[#d03f22] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Open Darkroom
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/"
                className="flex-1 py-2.5 px-4 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex items-center justify-center"
              >
                Homepage
              </Link>
            </div>
          </div>
        </ViewfinderFrame>
      </div>
    </div>
  );
}
