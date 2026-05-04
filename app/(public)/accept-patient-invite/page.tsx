import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AcceptPatientInvitePanel } from "@/features/auth/components/accept-patient-invite-panel";

export default function AcceptPatientInvitePage() {
  return (
    <AuthCard
      title="Welcome to NAJE Health"
      description="Set your password to finish setting up your account."
    >
      <Suspense>
        <AcceptPatientInvitePanel />
      </Suspense>
    </AuthCard>
  );
}
