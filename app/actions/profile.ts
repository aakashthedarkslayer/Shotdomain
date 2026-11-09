'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser, currentUserKey } from '@/auth';
import { PROFILE_LIMITS, deleteCapture, saveProfile } from '@/lib/userData';
import { revokeShare, revokeSharesFor } from '@/lib/shareStore';

export interface ProfileFormState {
  status: 'idle' | 'saved' | 'error';
  message?: string;
}

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await currentUser();
  if (!user) return { status: 'error', message: 'You need to be signed in to edit your profile.' };

  const displayName = String(formData.get('displayName') ?? '').trim();
  const company = String(formData.get('company') ?? '').trim();
  if (displayName.length > PROFILE_LIMITS.displayName) {
    return { status: 'error', message: `Display name can be at most ${PROFILE_LIMITS.displayName} characters.` };
  }
  if (company.length > PROFILE_LIMITS.company) {
    return { status: 'error', message: `Company can be at most ${PROFILE_LIMITS.company} characters.` };
  }

  await saveProfile(user.key, { displayName, company });
  revalidatePath('/', 'layout'); // header menus show the new name everywhere
  return { status: 'saved', message: 'Profile saved.' };
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
