import { PatientProgrammesListView } from "@/components/patient/programmes/PatientProgrammesListView";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function PatientCarePlanPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader eyebrow="Diabetes Programme" title="Care Plan" description="Every programme you're enrolled in." />
      <PatientProgrammesListView />
    </Container>
  );
}
