import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { PublicOnly } from "@/features/auth/components/public-only";

export default function RegisterPage() {
  return (
    <PublicOnly>
      <AuthCard
        title="Create your account"
        description="Join Naje Health to manage your health journey."
      >
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </AuthCard>
    </PublicOnly>
  );
}
