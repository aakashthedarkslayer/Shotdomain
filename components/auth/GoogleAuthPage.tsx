import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, currentUser } from '@/auth';
import { signInWithGoogle } from '@/app/actions/auth';
import { AuthCard } from '@/components/marketing/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { buttonClass } from '@/components/ui/Button';

const ERRORS: Record<string, string> = {
  AccessDenied: 'This Google account isn’t allowed to use this ShotDomain. Try a different account.',
  Configuration: 'Google sign-in is misconfigured on the server. Check the AUTH_* environment variables.',
};

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

interface GoogleAuthPageProps {
  mode: 'login' | 'signup';
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

/** Shared /login and /signup page: Google handles both creating and using an account. */
export async function GoogleAuthPage({ mode, searchParams }: GoogleAuthPageProps) {
  const { callbackUrl, error } = await searchParams;
  if (await currentUser()) redirect(callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/app');

  const signup = mode === 'signup';
  return (
    <AuthCard
      title={signup ? 'Create your account' : 'Log in to ShotDomain'}
      description={signup ? 'Sign up with your Google account — no password needed.' : 'Use the Google account you signed up with.'}
      footer={
        signup ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-fg hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" className="font-medium text-fg hover:underline">
              Create an account
            </Link>
          </>
        )
      }
    >
      {error && (
        <Alert tone="danger" className="mb-4">
          {ERRORS[error] ?? 'Sign-in failed. Please try again.'}
        </Alert>
      )}

      {authEnabled ? (
        <form action={signInWithGoogle}>
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/app'} />
          <button type="submit" className={buttonClass('secondary', 'lg', 'w-full')}>
            <GoogleLogo />
            {signup ? 'Sign up with Google' : 'Continue with Google'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <Alert tone="info">
            Google sign-in isn’t configured, so ShotDomain is running in local mode and no account is needed.
          </Alert>
          <Link href="/app" className={buttonClass('primary', 'md', 'w-full')}>
            Open the app
          </Link>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-faint">We only use your name, email and profile picture.</p>
    </AuthCard>
  );
}
