import type { ReactNode } from 'react';
import { currentUser } from '@/auth';
import { UserProvider } from '@/components/auth/UserContext';

export default async function Layout({ children }: { children: ReactNode }) {
  return <UserProvider user={await currentUser()}>{children}</UserProvider>;
}
