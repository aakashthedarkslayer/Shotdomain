'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser, currentUserKey } from '@/auth';
import { PROFILE_LIMITS, cleanLogoUrl, deleteCapture, getProfile, saveProfile } from '@/lib/userData';
import { planInfoFor } from '@/lib/billing';
import { revokeShare, revokeSharesFor } from '@/lib/shareStore';

export interface ProfileFormState {
  status: 'idle' | 'saved' | 'error';
  message?: string;
  /** What was submitted, so the form can show it again (React resets forms after an action). */
  values?: Record<string, string>;
}

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await currentUser();
  if (!user) return { status: 'error', message: 'You need to be signed in to edit your profile.' };

  const displayName = String(formData.get('displayName') ?? '').trim();
  const company = String(formData.get('company') ?? '').trim();
  const values: Record<string, string> = {};
  for (const k of ['displayName', 'company', 'brandName', 'brandLogoUrl']) if (formData.has(k)) values[k] = String(formData.get(k) ?? '');
  const fail = (message: string): ProfileFormState => ({ status: 'error', message, values });
  if (displayName.length > PROFILE_LIMITS.displayName) {
    return fail(`Display name can be at most ${PROFILE_LIMITS.displayName} characters.`);
  }
  if (company.length > PROFILE_LIMITS.company) {
    return fail(`Company can be at most ${PROFILE_LIMITS.company} characters.`);
  }

  // Branding fields: saved only on plans that include it; otherwise the stored values are kept as they are.
  const existing = await getProfile(user.key);
  let brandName = existing.brandName;
  let brandLogoUrl = existing.brandLogoUrl;
  if ((await planInfoFor(user.key)).limits.branding && formData.has('brandName')) {
    brandName = String(formData.get('brandName') ?? '').trim();
    const logo = String(formData.get('brandLogoUrl') ?? '').trim();
    if (brandName.length > PROFILE_LIMITS.brandName) {
      return fail(`Brand name can be at most ${PROFILE_LIMITS.brandName} characters.`);
    }
    if (logo && !cleanLogoUrl(logo)) {
      return fail('The logo must be an image address that starts with https://');
    }
    brandLogoUrl = logo;
  }

  await saveProfile(user.key, { displayName, company, brandName, brandLogoUrl });
  revalidatePath('/', 'layout'); // header menus show the new name everywhere
  return { status: 'saved', message: 'Profile saved.', values };
}

export async function deleteCaptureAction(formData: FormData) {
  const key = await currentUserKey();
  const id = String(formData.get('id') ?? '');
  if (!key) redirect('/login');
  try {
    await deleteCapture(key, id);
    await revokeSharesFor({ captureId: id });
  } catch {
    // invalid id — nothing to delete
  }
  revalidatePath('/profile');
  redirect('/profile');
}

export async function revokeShareAction(formData: FormData) {
  const key = await currentUserKey();
  if (!key) redirect('/login');
  await revokeShare(key, String(formData.get('token') ?? ''));
  revalidatePath('/profile');
}
