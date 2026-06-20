import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PatientInbox } from "@/components/patient/messages/PatientInbox";

export default function PatientMessagesPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="My Health"
        title="Messages"
        description="Communicate securely with your care team."
      />

      <PatientInbox />
    </Container>
  );
}
