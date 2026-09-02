import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

type ConsultantProgrammeDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function ConsultantProgrammeDetailPage({
  params,
}: ConsultantProgrammeDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Care plan details"
        title="Care plan"
        description="Review plan status, enrolled patients, readiness, care-team assignments, and enrol new patients."
        breadcrumbs={[
          { label: "Care programmes", href: "/consultant/programmes" },
          { label: "Details" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="admin" />
      <ProgrammePermissionGate permissions={["programme.manage", "programme.enrol"]}>
        <ProgrammeAdminDashboard workflow="details" programmeId={id} />
      </ProgrammePermissionGate>
    </Container>
  );
}
