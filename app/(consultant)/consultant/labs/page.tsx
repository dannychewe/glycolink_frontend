import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlLabsList } from "@/components/consultant/labs/GraphqlLabsList";

export default function ConsultantLabsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Lab Reviews"
        description="Review uploaded results, add clinical notes, and close completed lab orders."
      />

      <GraphqlLabsList />
    </Container>
  );
}
