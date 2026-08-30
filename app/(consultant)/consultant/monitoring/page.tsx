import { ProgrammeMonitoringOperationsView } from "@/components/consultant/programmes/ProgrammeMonitoringOperationsView";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantMonitoringPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Diabetes programme"
        title="Monitoring operations"
        description="Track missed monitoring, adherence, and programme work generated from expected readings."
      />

      <ProgrammeAccessSummary />
      <ProgrammePermissionGate permissions={["monitoring.manage", "alerts.manage"]}>
        <ProgrammeMonitoringOperationsView />
      </ProgrammePermissionGate>
    </Container>
  );
}
