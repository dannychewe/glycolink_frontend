import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantProgrammesPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Clinic administration"
        title="Care programmes"
        description="Set up diabetes programmes, manage enrolments, assign care teams, and control programme lifecycle."
      />

      <ProgrammePermissionNotice scope="admin" />
      <ProgrammeAdminDashboard />
    </Container>
  );
}
