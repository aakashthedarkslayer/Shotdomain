import { GoogleAuthPage } from '@/components/auth/GoogleAuthPage';

export const metadata = { title: 'Sign up — ShotDomain' };

export default function SignupPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  return <GoogleAuthPage mode="signup" searchParams={searchParams} />;
}
