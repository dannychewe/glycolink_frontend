import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";

export default function AppPage() {
  return (
    <Container className="py-8">
      <Suspense fallback={<div className="px-6 py-10 text-sm text-muted">Resolving your destination...</div>}>
        <AuthRedirect />
      </Suspense>
    </Container>
  );
}
