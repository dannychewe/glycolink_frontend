import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlInbox } from "@/components/consultant/messages/GraphqlInbox";

export default function ConsultantMessagesPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Messages"
        description="Communicate securely with your patients."
      />

      <GraphqlInbox />
    </Container>
  );
}
