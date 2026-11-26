'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { UNLIMITED } from '@/lib/plans';
import type { PlanInfo } from '@/lib/plans';

// Outside a provider (or without billing), nothing is locked in the UI; the server still enforces limits.
const PlanContext = createContext<PlanInfo>({ billingEnabled: false, plan: 'free', limits: UNLIMITED });

export function PlanProvider({ info, children }: { info: PlanInfo; children: ReactNode }) {
  return <PlanContext.Provider value={info}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanInfo {
  return useContext(PlanContext);
}
