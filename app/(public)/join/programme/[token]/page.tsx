import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ProgrammeShareRegistrationForm } from "@/features/auth/components/programme-share-registration-form";
import { PublicOnly } from "@/features/auth/components/public-only";

type ProgrammeJoinPageProps = Readonly<{
  params: Promise<{ token: string }>;
}>;

export default async function ProgrammeJoinPage({ params }: ProgrammeJoinPageProps) {
  const { token } = await params;

  return (
    <PublicOnly>
      <AuthCard
        title="Join this diabetes care programme"
        description="Register once, get enrolled with the clinic, and continue with your programme tasks from your patient dashboard."
      >
        <Suspense fallback={<p className="text-sm text-muted">Loading care plan...</p>}>
          <ProgrammeShareRegistrationForm token={token} />
        </Suspense>
      </AuthCard>
    </PublicOnly>
  );
}
