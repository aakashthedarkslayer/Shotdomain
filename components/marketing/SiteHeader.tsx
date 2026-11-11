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
        <div className="ml-auto flex items-center gap-3">
          {!authEnabled ? (
            // No Google keys configured: there are no accounts, so the app is open to anyone (dev / self-hosted).
            <>
              <span
                title="Sign-in isn’t configured (no Google keys in .env.local), so anyone can use the app."
                className="hidden rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning sm:inline"
              >
                Local mode · no sign-in
              </span>
              <Link href="/app" className={buttonClass('primary', 'sm')}>
                Open app
              </Link>
            </>
          ) : user ? (
            // Signed in: the avatar shows whose session this is (and offers sign-out).
            <>
              <Link href="/app" className={buttonClass('primary', 'sm')}>
                Open app
              </Link>
              <UserProvider user={user}>
                <UserMenu />
              </UserProvider>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass('ghost', 'sm')}>
                Log in
              </Link>
              <Link href="/signup" className={buttonClass('primary', 'sm')}>
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
