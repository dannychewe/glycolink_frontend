import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AcceptClinicPatientInvitePanel } from "@/features/auth/components/accept-clinic-patient-invite-panel";

export default function AcceptClinicPatientInvitePage() {
  return (
    <AuthCard
      title="Accept clinic invitation"
      description="Confirm the clinic invitation to link your patient account."
    >
      <Suspense>
        <AcceptClinicPatientInvitePanel />
      </Suspense>
    </AuthCard>
  );
}
