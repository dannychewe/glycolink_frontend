import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PCQListView } from "@/components/patient/pcq/PCQListView";

export default function PatientPCQListPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="My Health"
        title="Questionnaires"
        description="Your baseline questionnaire, appointment forms, and anything your care team has assigned."
      />

      <PCQListView />
    </Container>
  );
}
