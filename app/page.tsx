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
import { billingEnabled, lifetimeRemaining } from '@/lib/billing';

export default async function LandingPage() {
  const lifetimeLeft = await lifetimeRemaining();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <HeroSection />
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
  );
}
