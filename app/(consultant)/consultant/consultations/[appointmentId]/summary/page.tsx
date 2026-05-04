import { Container } from "@/components/ui/container";
import { GraphqlEncounterSummary } from "@/components/consultant/consultations/GraphqlEncounterSummary";

type EncounterSummaryPageProps = Readonly<{
  params: Promise<{ appointmentId: string }>;
}>;

export default async function EncounterSummaryPage({ params }: EncounterSummaryPageProps) {
  const { appointmentId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <GraphqlEncounterSummary encounterId={appointmentId} />
    </Container>
  );
}
