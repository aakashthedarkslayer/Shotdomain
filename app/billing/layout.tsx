import type { ReactNode } from 'react';
import { currentUser, currentUserKey } from '@/auth';
import { UserProvider } from '@/components/auth/UserContext';
import { PlanProvider } from '@/components/billing/PlanContext';
import { planInfoFor } from '@/lib/billing';

export default async function Layout({ children }: { children: ReactNode }) {
  const [user, plan] = await Promise.all([currentUser(), currentUserKey().then(planInfoFor)]);
  return (
    <UserProvider user={user}>
      <PlanProvider info={plan}>{children}</PlanProvider>
    </UserProvider>
  );
}
