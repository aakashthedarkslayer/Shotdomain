'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { UserMenu } from '@/components/auth/UserMenu';

const NAV = [
  { href: '/app', label: 'Capture' },
  { href: '/profile', label: 'Share links' },
];

/** Top bar shared by the tool pages (/app, /profile, /billing). */
export function AppHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Logo href="/" compact />
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm tracking-[-0.01em] transition-colors ${
                  active ? 'bg-subtle font-medium text-fg' : 'text-muted hover:bg-subtle hover:text-fg'
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
