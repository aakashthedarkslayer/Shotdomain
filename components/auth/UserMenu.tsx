'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOutAction } from '@/app/actions/auth';
import { useCurrentUser } from './UserContext';

/** Avatar button with the account email and a sign-out action. Renders nothing when signed out. */
export function UserMenu() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) return null;
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line bg-subtle text-xs font-medium text-fg"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-3 py-2.5">
            {user.name && <p className="truncate text-sm font-medium text-fg">{user.name}</p>}
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-fg hover:bg-subtle">
            Profile &amp; history
          </Link>
          <form action={signOutAction} className="border-t border-line">
            <button type="submit" className="w-full cursor-pointer px-3 py-2 text-left text-sm text-fg hover:bg-subtle">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
