import { PatientProgrammeDetailView } from "@/components/patient/programmes/PatientProgrammeDetailView";
import { Container } from "@/components/ui/container";

type ProgrammeDetailPageProps = Readonly<{
  params: Promise<{ enrolmentId: string }>;
}>;

export default async function PatientProgrammeDetailPage({ params }: ProgrammeDetailPageProps) {
  const { enrolmentId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <PatientProgrammeDetailView enrolmentId={enrolmentId} />
    </Container>
  );
}
