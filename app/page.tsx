import { SiteHeader } from '@/components/marketing/SiteHeader';
import { HeroSection } from '@/components/marketing/HeroSection';
import {
  FaqSection,
  FeaturesSection,
  FinalCta,
  Footer,
  HowItWorksSection,
  PricingSection,
  UseCasesSection,
} from '@/components/marketing/Sections';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
