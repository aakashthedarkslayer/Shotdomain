import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';

export const metadata = {
  title: 'Page not found — ShotDomain',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-8 flex gap-2">
        <Link href="/" className={buttonClass('secondary', 'md')}>
          Home
        </Link>
        <Link href="/app" className={buttonClass('primary', 'md')}>
          Open app
        </Link>
      </div>
    </div>
  );
}
