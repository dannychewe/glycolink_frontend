import { Container } from "@/components/ui/container";
import { GraphqlEncounterWorkspace } from "@/components/consultant/consultations/GraphqlEncounterWorkspace";

type EncounterWorkspacePageProps = Readonly<{
  params: Promise<{ appointmentId: string }>;
}>;

export default async function EncounterWorkspacePage({ params }: EncounterWorkspacePageProps) {
  const { appointmentId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <GraphqlEncounterWorkspace encounterId={appointmentId} />
    </Container>
  );
}
