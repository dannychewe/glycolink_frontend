import type { Metadata } from "next";
import { GraphqlProviderDirectory } from "@/components/public/GraphqlProviderDirectory";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Diabetes Care Network | Naje Health",
  description:
    "Browse verified clinicians who can support clinic-led diabetes care programmes, consultations, monitoring review, and ongoing follow-up.",
};

export default function ProvidersPage() {
  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Care network
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Find clinicians for diabetes continuity care</h1>
        <p className="text-base leading-7 text-muted">
          Naje Health connects clinic programmes with verified clinicians who can support
          assessments, care-plan review, monitoring alerts, and patient follow-up.
        </p>
      </div>

      <GraphqlProviderDirectory />

      <section className="max-w-3xl space-y-3 border-t border-border/80 pt-8">
        <h2 className="text-2xl">Specialist support for structured clinic programmes</h2>
        <p className="text-muted">
          Consultations remain available, but the strongest value is continuity: enrolled patients,
          assigned care teams, active care plans, monitoring expectations, and clinic reporting in
          one operating workflow.
        </p>
      </section>
    </Container>
  );
}
