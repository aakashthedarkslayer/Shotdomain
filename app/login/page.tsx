'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

export default function LoginPage() {
  const router = useRouter();
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
          Sign in to your darkroom
        </h2>
        <p className="mt-1 text-center text-xs font-mono text-stone-500">
          Access saved schedules, capture history, and team exports
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <ViewfinderFrame
          frameLabel="ACCESS // DARKROOM LOGIN"
          badge="SECURE SESSION"
          active={true}
          cornerSize={12}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 shadow-sm"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="photographer@studio.com"
                  className="w-full px-3 py-2 text-sm rounded bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-[#E54D2E]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Password
                </label>
                <a href="#" className="text-[11px] font-mono text-[#E54D2E] hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="mt-1.5">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm rounded bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-[#E54D2E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-xs font-mono text-stone-600 dark:text-stone-400">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 rounded border-stone-300 text-[#E54D2E] focus:ring-[#E54D2E]"
                />
                <span className="ml-2">Remember on this device</span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded bg-[#E54D2E] hover:bg-[#d03f22] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Darkroom'}
              </button>
            </div>
          </form>

          {/* Guest / Direct Testing Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="text-xs text-stone-500 mb-3 font-sans">
              Want to capture a site immediately without signing in?
            </p>
            <Link
              href="/app"
              className="inline-flex items-center justify-center w-full py-2 px-3 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Continue as Guest (No Login Required) →
            </Link>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-stone-500 font-sans">Don't have an account? </span>
            <Link href="/signup" className="text-xs font-mono text-[#E54D2E] hover:underline font-semibold">
              Sign up
            </Link>
          </div>
        </ViewfinderFrame>
      </div>
    </div>
  );
}
