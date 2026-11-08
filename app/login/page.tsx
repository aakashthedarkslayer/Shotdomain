'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/marketing/AuthCard';
import { Button, buttonClass } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // No accounts yet — signing in just opens the app.
    router.push('/app');
  }

  return (
    <AuthCard
      title="Log in to ShotDomain"
      description="Access your schedules and capture history."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-fg hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full" isLoading={loading}>
          Log in
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link href="/app" className={buttonClass('secondary', 'md', 'w-full')}>
        Continue without an account
      </Link>
    </AuthCard>
  );
}
