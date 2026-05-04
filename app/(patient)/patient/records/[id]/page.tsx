import { GraphqlEncounterDetailView } from "@/components/patient/records/GraphqlEncounterDetailView";
import { Container } from "@/components/ui/container";

type RecordDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function PatientRecordDetailPage({ params }: RecordDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="py-2">
      <GraphqlEncounterDetailView encounterId={id} />
    </Container>
  );
}
