import { Container } from "@/components/ui/container";
import { GraphqlInbox } from "@/components/consultant/messages/GraphqlInbox";

type Props = Readonly<{
  params: Promise<{ conversation_id: string }>;
}>;

export default async function ConsultantMessageThreadPage({ params }: Props) {
  const { conversation_id } = await params;

  return (
    <Container className="flex h-[calc(100dvh-7.5rem)] flex-col gap-4 py-2 md:h-[calc(100dvh-9rem)]">
      <header className="shrink-0 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-2xl font-semibold text-text sm:text-3xl">Messages</h1>
        <p className="text-sm text-muted">Communicate securely with your patients.</p>
      </header>

      <div className="min-h-0 flex-1">
        <GraphqlInbox initialConversationId={conversation_id} />
      </div>
    </Container>
  );
}
