import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlInbox } from "@/components/consultant/messages/GraphqlInbox";

export default function ConsultantMessagesPage() {
  return (
    <Container className="flex h-[calc(100dvh-7.5rem)] flex-col gap-4 py-2 md:h-[calc(100dvh-9rem)]">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Messages"
        description="Communicate securely with your patients."
        className="shrink-0"
      />

      <div className="min-h-0 flex-1">
        <GraphqlInbox />
      </div>
    </Container>
  );
}
