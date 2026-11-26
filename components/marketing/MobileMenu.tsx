'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export interface MenuLink {
  href: string;
  label: string;
}

/**
 * Below the md breakpoint the header's link row is hidden; this button opens
 * the same links as a full overlay under the header (DESIGN.md: "Collapses to
 * logo + hamburger at mobile with the menu opening as a full-overlay").
 * The overlay is portalled to <body>: the header's backdrop blur would
 * otherwise become its containing block and clip it to the header.
 */
export function MobileMenu({ links, account }: { links: MenuLink[]; account: MenuLink[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const close = () => window.innerWidth >= 768 && setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      document.body.style.overflow = '';
    };
  }, [open]);

  const row = 'flex h-12 items-center border-b border-line text-base tracking-[-0.01em] text-fg';
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-fg hover:bg-subtle"
      >
        <Icon name={open ? 'x' : 'menu'} size={20} />
      </button>
      {open &&
        createPortal(
          <nav id={id} aria-label="Menu" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-bg px-4 pt-2 pb-10">
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className={row}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            {account.length > 0 && (
              <ul className="mt-6">
                {account.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={() => setOpen(false)} className={`${row} text-muted`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>,
          document.body,
        )}
    </div>
  );
}
