import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantProgrammeSetupPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Programme administration"
        title="Programme setup"
        description="Create or update the diabetes continuity programme before opening it for clinic enrolment."
        breadcrumbs={[
          { label: "Care programmes", href: "/consultant/programmes" },
          { label: "Setup" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="admin" />
      <ProgrammePermissionGate permissions={["programme.manage"]}>
        <ProgrammeAdminDashboard workflow="setup" />
      </ProgrammePermissionGate>
    </Container>
  );
}
