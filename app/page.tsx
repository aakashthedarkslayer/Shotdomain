import { ContactSheetHeader } from '@/components/marketing/ContactSheetHeader';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProblemSection } from '@/components/marketing/ProblemSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { EngineComparisonSection } from '@/components/marketing/EngineComparisonSection';
import { MultiDeviceSection } from '@/components/marketing/MultiDeviceSection';
import { UseCasesSection } from '@/components/marketing/UseCasesSection';
import { PricingSection } from '@/components/marketing/PricingSection';
import { FaqSection } from '@/components/marketing/FaqSection';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Footer } from '@/components/marketing/Footer';

export const metadata = {
  title: 'Shotdomain — One URL. Every Page. Every Device. One ZIP.',
  description:
    'Discover every page from a sitemap, capture at desktop, tablet, and mobile in a single automated run, and download a structured ZIP archive. Built for agencies, designers, and QA.',
};

export default function MarketingLandingPage() {
  return (
    <div id="top" className="min-h-screen bg-[#FBFBFA] dark:bg-[#121315] text-[#121315] dark:text-stone-100 selection:bg-[#E54D2E] selection:text-white transition-colors">
      {/* Sticky Photographic Header */}
      <ContactSheetHeader />

      {/* Main Content Sections */}
      <main>
        {/* Hero with Interactive 4-Phase Contact Sheet Machine */}
        <HeroSection />

        {/* The 120-Screenshot Manual Tax vs 1 Shotdomain Run */}
        <ProblemSection />

        {/* 4-Step Physical Contact Sheet Workflow */}
        <HowItWorksSection />

        {/* Multi-Device Synchronized Viewports */}
        <MultiDeviceSection />

        {/* Quality Engine: Interactive Split Sliders */}
        <EngineComparisonSection />

        {/* Concrete Use Cases */}
        <UseCasesSection />

        {/* Transparent Pricing Plans */}
        <PricingSection />

        {/* Honest Technical FAQ */}
        <FaqSection />

        {/* Viewfinder Final CTA */}
        <FinalCta />
      </main>

      {/* Archival Film Contact Sheet Footer */}
      <Footer />
    </div>
  );
}
