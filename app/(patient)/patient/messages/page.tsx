import { Container } from "@/components/ui/container";
import { PatientInbox } from "@/components/patient/messages/PatientInbox";

export default function PatientMessagesPage() {
  return (
    <Container className="py-2">
      <header className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          My Health
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Messages</h1>
        <p className="text-sm text-muted">Communicate securely with your care team.</p>
      </header>

      <PatientInbox />
    </Container>
  );
}
