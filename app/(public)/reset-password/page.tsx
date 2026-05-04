import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordPanel } from "@/features/auth/components/reset-password-panel";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Choose a new password for your account."
    >
      <Suspense>
        <ResetPasswordPanel />
      </Suspense>
    </AuthCard>
  );
}
