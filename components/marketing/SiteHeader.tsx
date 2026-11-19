import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { buttonClass } from '@/components/ui/Button';
import { authEnabled, currentUser } from '@/auth';
import { UserProvider } from '@/components/auth/UserContext';
import { UserMenu } from '@/components/auth/UserMenu';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#login-pages', label: 'Login pages' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export async function SiteHeader() {
  const user = authEnabled ? await currentUser() : null;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-sm tracking-[-0.01em] text-muted transition-colors hover:bg-subtle hover:text-fg">
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
                className="hidden rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 font-mono text-xs text-warning sm:inline"
              >
                Local mode · no sign-in
              </span>
              <Link href="/app" className={buttonClass('primary', 'sm', 'h-8 px-3')}>
                Open app
              </Link>
            </>
          ) : user ? (
            // Signed in: the avatar shows whose session this is (and offers sign-out).
            <>
              <Link href="/app" className={buttonClass('primary', 'sm', 'h-8 px-3')}>
                Open app
              </Link>
              <UserProvider user={user}>
                <UserMenu />
              </UserProvider>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass('secondary', 'sm', 'h-8 px-3')}>
                Log in
              </Link>
              <Link href="/signup" className={buttonClass('primary', 'sm', 'h-8 px-3')}>
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
