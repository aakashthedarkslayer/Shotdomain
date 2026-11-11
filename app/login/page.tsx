import { GoogleAuthPage } from '@/components/auth/GoogleAuthPage';

export const metadata = { title: 'Log in — ShotDomain' };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  return <GoogleAuthPage mode="login" searchParams={searchParams} />;
}
