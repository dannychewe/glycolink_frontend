import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordPanel } from "@/features/auth/components/forgot-password-panel";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we'll send a reset link."
    >
      <ForgotPasswordPanel />
    </AuthCard>
  );
}
