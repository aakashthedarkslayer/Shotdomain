'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/marketing/AuthCard';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // No accounts yet — signing up just opens the app.
    router.push('/app');
  }

  return (
    <AuthCard
      title="Create your account"
      description="Save schedules and keep your capture history."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-fg hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="name">
          <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full" isLoading={loading}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
