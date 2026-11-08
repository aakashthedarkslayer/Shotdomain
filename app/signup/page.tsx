'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In this MVP phase, redirect directly to the darkroom app
    setTimeout(() => {
      router.push('/app');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#121315] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#E54D2E] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 group">
          <span className="w-8 h-8 rounded border border-stone-800 bg-stone-900 text-[#E54D2E] font-bold text-sm flex items-center justify-center group-hover:border-[#E54D2E] transition-colors">
            ⌜⌟
          </span>
          <span className="text-xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
            SHOTDOMAIN
          </span>
        </Link>
        <h2 className="text-center text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
          Create your darkroom account
        </h2>
        <p className="mt-1 text-center text-xs font-mono text-stone-500">
          Unlock multi-device captures, automated schedules, and clean ZIP exports
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <ViewfinderFrame
          frameLabel="ACCESS // DARKROOM REGISTRATION"
          badge="FREE EVALUATION"
          active={true}
          cornerSize={12}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 shadow-sm"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Your Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full px-3 py-2 text-sm rounded bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-[#E54D2E]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Work Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@agency.design"
                  className="w-full px-3 py-2 text-sm rounded bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-[#E54D2E]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 text-sm rounded bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-[#E54D2E]"
                />
              </div>
            </div>

            <div className="text-[11px] font-mono text-stone-500 pt-1 leading-normal">
              By creating an account you agree to our Terms of Darkroom Service and Fair Crawl Policy.
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded bg-[#E54D2E] hover:bg-[#d03f22] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Creating Darkroom...' : 'Get Started Free'}
              </button>
            </div>
          </form>

          {/* Guest / Direct Testing Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="text-xs text-stone-500 mb-3 font-sans">
              No account needed to test a website right now:
            </p>
            <Link
              href="/app"
              className="inline-flex items-center justify-center w-full py-2 px-3 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Start Free Capture Run →
            </Link>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-stone-500 font-sans">Already have an account? </span>
            <Link href="/login" className="text-xs font-mono text-[#E54D2E] hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </ViewfinderFrame>
      </div>
    </div>
  );
}
