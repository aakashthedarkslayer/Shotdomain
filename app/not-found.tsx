import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';

export const metadata = {
  title: 'Page not found | ShotDomain',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="display text-[40px] text-fg">Page not found (404).</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-8 flex gap-2">
        <Link href="/" className={buttonClass('primary', 'md')}>
          Go to ShotDomain
        </Link>
      </div>
    </div>
  );
}
