import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/ui/Logo';

/** Centered card layout used by /login and /signup. */
export function AuthCard({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto mb-6 flex w-fit" aria-label="ShotDomain home">
          <LogoMark size={36} />
        </Link>
        <h1 className="text-center text-2xl font-semibold tracking-[-0.04em] text-fg">{title}</h1>
        <p className="mt-1 text-center text-sm text-muted">{description}</p>
        <div className="mt-8 card-float rounded-xl p-8">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
      </div>
    </main>
  );
}
