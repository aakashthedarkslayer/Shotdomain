import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { buttonClass } from '@/components/ui/Button';
import { authEnabled, currentUser } from '@/auth';
import { UserProvider } from '@/components/auth/UserContext';
import { UserMenu } from '@/components/auth/UserMenu';
import { MobileMenu } from './MobileMenu';
import type { MenuLink } from './MobileMenu';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#login-pages', label: 'Login pages' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export async function SiteHeader() {
  const user = authEnabled ? await currentUser() : null;
  // The same account links, for the phone menu.
  const account: MenuLink[] = !authEnabled
    ? [{ href: '/profile', label: 'Share links' }]
    : user
      ? [
          { href: '/profile', label: 'Share links' },
          { href: '/billing', label: 'Plan & billing' },
        ]
      : [
          { href: '/login', label: 'Log in' },
          { href: '/signup', label: 'Sign up free' },
        ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="px-3 py-2 text-sm font-semibold whitespace-nowrap text-muted underline-offset-[6px] transition-colors hover:text-fg hover:underline">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {!authEnabled ? (
            // No Google keys configured: there are no accounts, so the app is open to anyone (dev / self-hosted).
            <>
              <span
                title="Sign-in isn’t configured (no Google keys in .env.local), so anyone can use the app."
                className="hidden rounded-none border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-warning sm:inline"
              >
                Local mode, no sign-in
              </span>
              <Link href="/profile" className="hidden px-3 py-2 text-sm font-semibold whitespace-nowrap text-muted underline-offset-[6px] transition-colors hover:text-fg hover:underline lg:inline-flex">
                Share links
              </Link>
            </>
          ) : user ? (
            // Signed in: the avatar menu has share links, billing and sign-out.
            <UserProvider user={user}>
              <UserMenu />
            </UserProvider>
          ) : (
            <>
              <span className="hidden sm:inline-flex">
                <Link href="/login" className={buttonClass('secondary', 'sm', 'h-8 px-3')}>
                  Log in
                </Link>
              </span>
              <Link href="/signup" className={buttonClass('primary', 'sm', 'h-8 px-3')}>
                Sign up free
              </Link>
            </>
          )}
          <MobileMenu links={LINKS} account={account} />
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
