import { AuthCard } from "@/features/auth/components/auth-card";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Verify your email"
      description="Complete verification to unlock your account."
    >
      <VerifyEmailPanel />
    </AuthCard>
  );
}
