import { ProgrammeAlertWorkQueue } from "@/components/consultant/programmes/ProgrammeAlertWorkQueue";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantMonitoringAlertsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Diabetes programme"
        title="Clinical work queue"
        description="Claim, review, document, contact, and resolve programme alerts and monitoring gap work items."
        breadcrumbs={[
          { label: "Monitoring", href: "/consultant/monitoring" },
          { label: "Work queue" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="clinical" />
      <ProgrammePermissionGate permissions={["alerts.manage"]}>
        <ProgrammeAlertWorkQueue />
      </ProgrammePermissionGate>
    </Container>
  );
}
