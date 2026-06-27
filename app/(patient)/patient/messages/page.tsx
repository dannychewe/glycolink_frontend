import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PatientInbox } from "@/components/patient/messages/PatientInbox";

export default function PatientMessagesPage() {
  return (
    <Container className="flex h-[calc(100dvh-7.5rem)] flex-col gap-4 py-2 md:h-[calc(100dvh-9rem)]">
      <PageHeader
        eyebrow="My Health"
        title="Messages"
        description="Communicate securely with your care team."
        className="shrink-0"
      />

      <div className="min-h-0 flex-1">
        <PatientInbox />
      </div>
    </Container>
  );
}
