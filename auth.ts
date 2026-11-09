import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

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
  name: string | null;
  email: string | null;
  image: string | null;
}

/** The signed-in user, or null when signed out or auth is disabled. */
export async function currentUser(): Promise<CurrentUser | null> {
  if (!authEnabled) return null;
  const session = await auth();
  if (!session?.user) return null;
  return { name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null };
}
