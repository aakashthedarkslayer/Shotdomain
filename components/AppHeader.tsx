'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

const NAV = [
  { href: '/app', label: 'Capture' },
  { href: '/schedules', label: 'Schedules' },
];

/** Top bar shared by the tool pages (/app, /schedules). */
export function AppHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Logo href="/" />
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                  active ? 'bg-subtle font-medium text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

export default AppHeader;
