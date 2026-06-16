import { MyConsultantsView } from "@/components/patient/consultants/MyConsultantsView";
import { Container } from "@/components/ui/container";

export default function PatientConsultantsPage() {
  return (
    <Container className="space-y-8 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">My consultants</h1>
        <p>Providers connected to your care, plus any pending invitations.</p>
      </header>

      <MyConsultantsView />
    </Container>
  );
}
