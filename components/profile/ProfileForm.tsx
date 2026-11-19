'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import type { ProfileFormState } from '@/app/actions/profile';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { PlanLock } from '@/components/billing/Upgrade';

interface ProfileFormProps {
  displayName: string;
  googleName: string;
  company: string;
  email: string;
  brandName?: string;
  brandLogoUrl?: string;
  /** The plan includes branded share links. */
  brandingAllowed?: boolean;
}

export function ProfileForm({ displayName, googleName, company, email, brandName = '', brandLogoUrl = '', brandingAllowed = false }: ProfileFormProps) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfileAction, { status: 'idle' });
  // React resets the form after each submit; show what was just submitted, not the values from page load.
  const v = (name: string, initial: string) => state.values?.[name] ?? initial;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor="displayName" hint={googleName ? `Leave empty to use “${googleName}” from Google.` : undefined}>
          <Input id="displayName" name="displayName" defaultValue={v('displayName', displayName)} maxLength={60} placeholder={googleName} />
        </Field>
        <Field label="Company" htmlFor="company" hint="Optional.">
          <Input id="company" name="company" defaultValue={v('company', company)} maxLength={80} placeholder="Acme Inc." />
        </Field>
      </div>
      <Field label="Email" htmlFor="email" hint="Managed by your Google account.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <fieldset className="space-y-3 rounded-xl border border-line p-4" disabled={!brandingAllowed}>
        <legend className="flex items-center gap-2 px-1 text-sm font-medium text-fg">
          Branding on share links {!brandingAllowed && <PlanLock plan="agency" />}
        </legend>
        <p className="text-[13px] text-muted">
          Clients who open your share links see your name and logo at the top instead of ShotDomain’s.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand name" htmlFor="brandName" hint="e.g. your agency’s name.">
            <Input id="brandName" name="brandName" defaultValue={v('brandName', brandName)} maxLength={60} placeholder="Northwind Studio" />
          </Field>
          <Field label="Logo image URL" htmlFor="brandLogoUrl" hint="An https:// link to a PNG, SVG or JPG, ideally square.">
            <Input id="brandLogoUrl" name="brandLogoUrl" defaultValue={v('brandLogoUrl', brandLogoUrl)} maxLength={500} placeholder="https://yourstudio.com/logo.png" />
          </Field>
        </div>
      </fieldset>
      {state.status !== 'idle' && <Alert tone={state.status === 'saved' ? 'success' : 'danger'}>{state.message}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" isLoading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
