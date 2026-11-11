'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { CurrentUser } from '@/auth';

const UserContext = createContext<CurrentUser | null>(null);

/** Hands the server-resolved user to client components (no client-side session fetch). */
export function UserProvider({ user, children }: { user: CurrentUser | null; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}
