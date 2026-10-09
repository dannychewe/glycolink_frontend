import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { Container } from "@/components/ui/container";

export default function ConsultantProgrammesPage() {
  return (
    <Container className="space-y-6 py-2">
      <ProgrammePermissionGate permissions={["programme.manage", "programme.enrol"]}>
        <ProgrammeAdminDashboard workflow="overview" />
      </ProgrammePermissionGate>
    </Container>
  );
}
