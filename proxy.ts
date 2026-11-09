import type { NextFetchEvent, NextRequest } from 'next/server';
import type { NextAuthRequest } from 'next-auth';
import { auth, authEnabled } from '@/auth';

/** Signed-out requests: pages redirect to /login, API calls get a 401. */
// The (req, event) signature selects auth()'s middleware overload.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const gate = (req: NextAuthRequest, _event: NextFetchEvent) => {
  if (req.auth) return;
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }
  const login = new URL('/login', req.nextUrl.origin);
  login.searchParams.set('callbackUrl', `${pathname}${search}`);
  return Response.redirect(login);
};
const requireAuth = auth(gate);

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // No Google credentials configured → local single-user mode, nothing is gated.
  if (!authEnabled) return;
  return requireAuth(req, event);
}

export const config = {
  // The tool, schedules, profile/history, and every API route except Auth.js's own endpoints.
  matcher: ['/app/:path*', '/schedules/:path*', '/profile/:path*', '/api/((?!auth/).*)'],
};
