import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { ProgrammeShareRegistrationForm } from "@/features/auth/components/programme-share-registration-form";
import { PublicOnly } from "@/features/auth/components/public-only";

type ProgrammeJoinPageProps = Readonly<{
  params: Promise<{ token: string }>;
}>;

export default async function ProgrammeJoinPage({ params }: ProgrammeJoinPageProps) {
  const { token } = await params;

  return (
    <PublicOnly>
      <Container className="max-w-5xl py-10 sm:py-14">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Care programme invite</p>
          <h1 className="mt-2 text-2xl font-semibold text-text sm:text-3xl">
            You&rsquo;re invited to join a diabetes care programme
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Register once, get enrolled with the clinic, and continue with your programme tasks from your patient dashboard.
          </p>
        </div>

        <Suspense fallback={<p className="text-sm text-muted">Loading care plan...</p>}>
          <ProgrammeShareRegistrationForm token={token} />
        </Suspense>
      </Container>
    </PublicOnly>
  );
}
