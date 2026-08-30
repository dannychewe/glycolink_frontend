import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/public/CTASection";
import { HeroSection } from "@/components/public/HeroSection";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { ProviderPreviewSection } from "@/components/public/ProviderPreviewSection";
import { TrustSection } from "@/components/public/TrustSection";

export const metadata: Metadata = {
  title: "Naje Health | Diabetes Continuity Care for Clinics",
  description:
    "Clinic-led diabetes continuity care with patient enrolment, care plans, monitoring schedules, glucose alerts, adherence reporting, and programme billing.",
};

export default function HomePage() {
  return (
    <div className="relative isolate">
      <Container className="space-y-2">
        <HeroSection />
        <HowItWorksSection />
        <TrustSection />
        <ProviderPreviewSection />
        <CTASection />
      </Container>
    </div>
  );
}
