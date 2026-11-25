'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { UserMenu } from '@/components/auth/UserMenu';

const NAV = [
  { href: '/', label: 'Capture' },
  { href: '/profile', label: 'Share links' },
];

/** Top bar shared by the tool pages (/app, /profile, /billing). */
export function AppHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Logo href="/" compact />
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-2 text-sm font-semibold underline-offset-[6px] transition-colors ${
                  active ? 'text-fg underline decoration-accent decoration-2' : 'text-muted hover:text-fg hover:underline'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          {children}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
