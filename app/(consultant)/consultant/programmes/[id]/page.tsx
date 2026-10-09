import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { Container } from "@/components/ui/container";

type ConsultantProgrammeDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function ConsultantProgrammeDetailPage({
  params,
}: ConsultantProgrammeDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <ProgrammePermissionGate permissions={["programme.manage", "programme.enrol"]}>
        <ProgrammeAdminDashboard workflow="details" programmeId={id} />
      </ProgrammePermissionGate>
    </Container>
  );
}
