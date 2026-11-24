import { SiteHeader } from '@/components/marketing/SiteHeader';
import { HeroSection } from '@/components/marketing/HeroSection';
import {
  FaqSection,
  FeaturesSection,
  FinalCta,
  Footer,
  HowItWorksSection,
  LoginPagesSection,
  PricingSection,
  UseCasesSection,
} from '@/components/marketing/Sections';
import { billingEnabled, lifetimeRemaining, planInfoFor } from '@/lib/billing';
import { authEnabled, currentUser, currentUserKey } from '@/auth';
import { UserProvider } from '@/components/auth/UserContext';
import { PlanProvider } from '@/components/billing/PlanContext';

// Per request: the hero depends on who is signed in and their plan, and the
// Lifetime counter must be live. Never prerender it.
export const dynamic = 'force-dynamic';

/** The homepage is also the app: the hero runs the capture tool (see HeroSection). */
export default async function LandingPage() {
  const [lifetimeLeft, user, plan] = await Promise.all([lifetimeRemaining(), currentUser(), currentUserKey().then(planInfoFor)]);
  return (
    <UserProvider user={user}>
      <PlanProvider info={plan}>
        <div className="min-h-screen">
          <SiteHeader />
          <main>
            <HeroSection needsSignIn={authEnabled && !user} />
            <HowItWorksSection />
            <FeaturesSection />
            <LoginPagesSection />
            <UseCasesSection />
            <PricingSection billingEnabled={billingEnabled()} lifetimeLeft={lifetimeLeft} />
            <FaqSection />
            <FinalCta />
          </main>
          <Footer />
        </div>
      </PlanProvider>
    </UserProvider>
  );
}
