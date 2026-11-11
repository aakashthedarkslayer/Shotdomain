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
import { billingEnabled } from '@/lib/billing';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <LoginPagesSection />
        <UseCasesSection />
        <PricingSection billingEnabled={billingEnabled()} />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
