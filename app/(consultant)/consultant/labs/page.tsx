import { Container } from "@/components/ui/container";
import { GraphqlLabsList } from "@/components/consultant/labs/GraphqlLabsList";

export default function ConsultantLabsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Lab Reviews</h1>
        <p className="text-sm text-muted">
          Review uploaded results, add clinical notes, and close completed lab orders.
        </p>
      </header>

      <GraphqlLabsList />
    </Container>
  );
}
