import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantProgrammeEnrolPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Patient enrolment"
        title="Add patient to programme"
        description="Select the programme, then choose an existing patient or invite a new patient into continuity care."
        breadcrumbs={[
          { label: "Care programmes", href: "/consultant/programmes" },
          { label: "Enrol patient" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="admin" />
      <ProgrammePermissionGate permissions={["programme.enrol"]}>
        <ProgrammeAdminDashboard workflow="enrolment" />
      </ProgrammePermissionGate>
    </Container>
  );
}
