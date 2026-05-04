import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { PublicOnly } from "@/features/auth/components/public-only";

export default function RegisterPage() {
  return (
    <PublicOnly>
      <AuthCard
        title="Create your account"
        description="Join GlycoLink to manage your health journey."
      >
        <AuthForm mode="register" />
      </AuthCard>
    </PublicOnly>
  );
}
