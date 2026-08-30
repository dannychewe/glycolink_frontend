import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantProgrammeActivationPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Activation readiness"
        title="Review enrolments before activation"
        description="Confirm baseline, care plan, lead clinician, and care team readiness before starting active continuity care."
        breadcrumbs={[
          { label: "Care programmes", href: "/consultant/programmes" },
          { label: "Activation" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="admin" />
      <ProgrammePermissionGate permissions={["programme.enrol"]}>
        <ProgrammeAdminDashboard workflow="activation" />
      </ProgrammePermissionGate>
    </Container>
  );
}
