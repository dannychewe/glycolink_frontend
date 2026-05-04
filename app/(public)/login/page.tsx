import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { PublicOnly } from "@/features/auth/components/public-only";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;

  const notice =
    reason === "session_expired"
      ? "Your session has expired. Please log in again."
      : undefined;

  return (
    <PublicOnly>
      <AuthCard
        title="Sign in to Naje Health"
        description="Welcome back. Enter your details below."
        notice={notice}
      >
        <AuthForm mode="login" />
      </AuthCard>
    </PublicOnly>
  );
}
