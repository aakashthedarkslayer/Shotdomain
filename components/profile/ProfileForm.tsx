'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import type { ProfileFormState } from '@/app/actions/profile';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface ProfileFormProps {
  displayName: string;
  googleName: string;
  company: string;
  email: string;
}

export function ProfileForm({ displayName, googleName, company, email }: ProfileFormProps) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfileAction, { status: 'idle' });

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor="displayName" hint={googleName ? `Leave empty to use “${googleName}” from Google.` : undefined}>
          <Input id="displayName" name="displayName" defaultValue={displayName} maxLength={60} placeholder={googleName} />
        </Field>
        <Field label="Company" htmlFor="company" hint="Optional.">
          <Input id="company" name="company" defaultValue={company} maxLength={80} placeholder="Acme Inc." />
        </Field>
      </div>
      <Field label="Email" htmlFor="email" hint="Managed by your Google account.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      {state.status !== 'idle' && <Alert tone={state.status === 'saved' ? 'success' : 'danger'}>{state.message}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" isLoading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
