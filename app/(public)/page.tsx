import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CTASection } from "@/components/public/CTASection";
import { HeroSection } from "@/components/public/HeroSection";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { ProviderPreviewSection } from "@/components/public/ProviderPreviewSection";
import { TrustSection } from "@/components/public/TrustSection";

export const metadata: Metadata = {
  title: "GlycoLink | Modern Diabetes Care & Online Doctor Consultation in Zambia",
  description:
    "Consult verified diabetes specialists online. Book appointments, manage your health, and access structured care — all in one platform.",
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
