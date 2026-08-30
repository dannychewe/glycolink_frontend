import { ProgrammeReportingDashboard } from "@/components/consultant/programmes/ProgrammeReportingDashboard";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantReportsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Clinic operations"
        title="Programme reports"
        description="Review adherence, work queue performance, operational trends, and programme comparison for diabetes continuity care."
      />

      <ProgrammePermissionNotice scope="reporting" />
      <ProgrammeReportingDashboard />
    </Container>
  );
}
