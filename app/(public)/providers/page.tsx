import type { Metadata } from "next";
import { GraphqlProviderDirectory } from "@/components/public/GraphqlProviderDirectory";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Find a Diabetes Specialist | GlycoLink",
  description:
    "Browse verified diabetes doctors and specialists in Zambia. Review their backgrounds, specialties, and consultation fees before booking.",
};

export default function ProvidersPage() {
  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Provider directory
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Find a specialist</h1>
        <p className="text-base leading-7 text-muted">
          Every provider on GlycoLink is reviewed and verified. Browse by specialty, filter by
          consultation fee, and choose a doctor who fits your care needs.
        </p>
      </div>

      <GraphqlProviderDirectory />

      <section className="max-w-3xl space-y-3 border-t border-border/80 pt-8">
        <h2 className="text-2xl">Diabetes care, close to you</h2>
        <p className="text-muted">
          GlycoLink connects patients living with Type 1, Type 2, gestational diabetes, and
          related conditions to verified specialists across Zambia. Book a consultation online,
          receive structured care, and manage your health journey in one place.
        </p>
      </section>
    </Container>
  );
}
