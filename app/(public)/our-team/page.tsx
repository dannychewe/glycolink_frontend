import type { Metadata } from "next";
import { GraphqlProviderDirectory } from "@/components/public/GraphqlProviderDirectory";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Our Care Team | Naje Health",
  description:
    "Meet the Naje Health clinicians who deliver structured diabetes continuity care — consultations, care plans, monitoring review, and ongoing follow-up.",
};

export default function OurTeamPage() {
  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Our care team
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Meet the clinicians behind your care</h1>
        <p className="text-base leading-7 text-muted">
          Naje Health&rsquo;s team of verified doctors, nurses, and specialists work together
          to deliver personalised diabetes care through your programme.
        </p>
      </div>

      <GraphqlProviderDirectory />

      <section className="max-w-3xl space-y-3 border-t border-border/80 pt-8">
        <h2 className="text-2xl">Coordinated care, not one-off visits</h2>
        <p className="text-muted">
          Every clinician at Naje Health works within your programme — with access to your care plan,
          monitoring data, and clinical history — so follow-up is informed, consistent, and continuous.
        </p>
      </section>
    </Container>
  );
}
