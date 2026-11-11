import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { buttonClass } from '@/components/ui/Button';
import { currentUserKey } from '@/auth';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#login-pages', label: 'Login pages' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export async function SiteHeader() {
  // Signed in (or local mode, which has no sign-in): go to the app. Signed out: log in.
  const signedIn = (await currentUserKey()) !== null;
  return (
    <header className="sticky top-0 z-30 glass-strong border-x-0 border-t-0 !shadow-none">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted transition hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Link href="/app" className={buttonClass('primary', 'sm')}>
              Open app
            </Link>
          ) : (
            <Link href="/login" className={buttonClass('ghost', 'sm')}>
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
