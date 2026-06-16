import { Container } from "@/components/ui/container";
import { PCQListView } from "@/components/patient/pcq/PCQListView";

export default function PatientPCQListPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Questionnaires</h1>
        <p className="text-muted">
          Your baseline questionnaire, appointment forms, and anything your care team has assigned.
        </p>
      </header>

      <PCQListView />
    </Container>
  );
}
