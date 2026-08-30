import { ProgrammeAlertWorkQueue } from "@/components/consultant/programmes/ProgrammeAlertWorkQueue";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default async function ConsultantAlertDetailPage({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Clinical alert"
        title="Alert detail"
        description="Review ownership, interventions, escalation, dismissal, reopening, and resolution for a programme alert."
      />

      <ProgrammePermissionNotice scope="clinical" />
      <ProgrammeAlertWorkQueue alertId={alertId} />
    </Container>
  );
}
