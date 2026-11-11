import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { LOCAL_USER_KEY, getProfile, userKeyForEmail } from '@/lib/userData';

/**
 * Google sign-in (Auth.js v5). Sessions are stateless JWT cookies — no database.
 *
 * Auth is only enforced when Google credentials are configured, so local
 * `npm run dev` keeps working with no setup. Env vars (see .env.example):
 *   AUTH_SECRET          random string used to sign session cookies
 *   AUTH_GOOGLE_ID       OAuth client ID from Google Cloud Console
 *   AUTH_GOOGLE_SECRET   OAuth client secret
 *   AUTH_ALLOWED_EMAILS  optional comma-separated allowlist (emails or @domain.com)
 */
export const authEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

function isAllowed(email: string): boolean {
  const list = (process.env.AUTH_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true; // no allowlist: any verified Google account may sign up
  const e = email.toLowerCase();
  return list.some((entry) => (entry.startsWith('@') ? e.endsWith(entry) : e === entry));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== 'google') return false;
      if (!profile?.email || profile.email_verified !== true) return false;
      return isAllowed(profile.email);
    },
  },
});

export interface CurrentUser {
  /** Storage key for this user's profile and history (hash of the email). */
  key: string;
  /** Display name: the profile override if set, otherwise the Google name. */
  name: string | null;
  googleName: string | null;
  email: string | null;
  image: string | null;
  company: string | null;
}

/** The signed-in user, or null when signed out or auth is disabled. */
export async function currentUser(): Promise<CurrentUser | null> {
  if (!authEnabled) return null;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const key = userKeyForEmail(email);
  const profile = await getProfile(key);
  const googleName = session.user?.name ?? null;
  return {
    key,
    name: profile.displayName || googleName,
    googleName,
    email,
    image: session.user?.image ?? null,
    company: profile.company ?? null,
  };
}

/**
 * Whose data this request may see: the signed-in user's key, "local" when
 * sign-in isn't configured, or null when signed out.
 */
export async function currentUserKey(): Promise<string | null> {
  if (!authEnabled) return LOCAL_USER_KEY;
  return (await currentUser())?.key ?? null;
}
