'use server';

import { signIn, signOut } from '@/auth';

/** Only same-site relative paths are allowed as post-login destinations. */
function safeRedirect(path: string | undefined): string {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/app';
}

export async function signInWithGoogle(formData: FormData) {
  await signIn('google', { redirectTo: safeRedirect(formData.get('callbackUrl')?.toString()) });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
