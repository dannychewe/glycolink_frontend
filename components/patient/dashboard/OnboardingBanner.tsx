"use client";

import { useQuery } from "@apollo/client";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { PROFILE_COMPLETION_STATUS_QUERY } from "@/lib/patient/clinical-profile-graphql";

type CompletionStatus = {
  isComplete: boolean;
  consultationReady: boolean;
};

export function OnboardingBanner() {
  const { patientProfile, postLoginRedirect, isAuthenticated } = useAuth();

  const profileIncomplete =
    postLoginRedirect?.reason === "PATIENT_PROFILE_INCOMPLETE" ||
    postLoginRedirect?.reason === "PROFILE_MISSING" ||
    (postLoginRedirect?.reason === "PATIENT_ONBOARDING" && patientProfile?.profileComplete === false) ||
    patientProfile?.profileComplete === false;
  const { data } = useQuery<{ profileCompletionStatus: CompletionStatus | null }>(
    PROFILE_COMPLETION_STATUS_QUERY,
    { fetchPolicy: "cache-and-network", skip: !isAuthenticated || profileIncomplete },
  );

  // Profile setup is the first gate.
  if (profileIncomplete) {
    return (
      <div className="border-l-4 border-primary bg-primary/5 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-text">Complete your patient profile</p>
            <p className="mt-1 text-sm text-muted">
              Set up your medical info and emergency contact before your first consultation.
            </p>
          </div>
          <Button href="/patient/onboarding" className="shrink-0">
            Continue setup
          </Button>
        </div>
      </div>
    );
  }

  // Profile completion is the only dashboard setup gate. Clinical forms can be completed later.
  const completion = data?.profileCompletionStatus;
  if (completion && !completion.consultationReady) {
    return (
      <div className="border-l-4 border-primary bg-primary/5 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-text">Finish your patient setup</p>
            <p className="mt-1 text-sm text-muted">
              Complete your profile so your care team has the essentials.
            </p>
          </div>
          <Button href="/patient/onboarding" className="shrink-0">
            Continue setup
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
