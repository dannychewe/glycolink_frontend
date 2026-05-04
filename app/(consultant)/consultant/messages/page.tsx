import { Container } from "@/components/ui/container";
import { GraphqlInbox } from "@/components/consultant/messages/GraphqlInbox";

export default function ConsultantMessagesPage() {
  return (
    <Container className="py-2">
      <header className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Messages</h1>
        <p className="text-sm text-muted">
          Communicate securely with your patients.
        </p>
      </header>

      <GraphqlInbox />
    </Container>
  );
}
