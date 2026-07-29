"use client";

import { useQuery } from "@apollo/client";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { PROFILE_COMPLETION_STATUS_QUERY } from "@/lib/patient/clinical-profile-graphql";

type CompletionStatus = {
  isComplete: boolean;
  pcqComplete: boolean;
  consultationReady: boolean;
};

export function OnboardingBanner() {
  const { patientProfile, postLoginRedirect, isAuthenticated } = useAuth();

  const profileIncomplete =
    postLoginRedirect?.reason === "PATIENT_PROFILE_INCOMPLETE" ||
    postLoginRedirect?.reason === "PROFILE_MISSING" ||
    (postLoginRedirect?.reason === "PATIENT_ONBOARDING" && patientProfile?.profileComplete === false) ||
    patientProfile?.profileComplete === false;
  const baselinePcqRequired = postLoginRedirect?.reason === "BASELINE_PCQ_REQUIRED";

  const { data } = useQuery<{ profileCompletionStatus: CompletionStatus | null }>(
    PROFILE_COMPLETION_STATUS_QUERY,
    { fetchPolicy: "cache-and-network", skip: !isAuthenticated || profileIncomplete },
  );

  // Profile setup is the first gate.
  if (profileIncomplete) {
    return (
      <div className="rounded-lg border border-l-4 border-l-primary bg-surface px-5 py-4">
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

  // Profile done, but the baseline PCQ must be submitted to be consultation-ready.
  const completion = data?.profileCompletionStatus;
  if (baselinePcqRequired || (completion && !completion.pcqComplete)) {
    return (
      <div className="rounded-lg border border-l-4 border-l-primary bg-surface px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-text">Complete your baseline questionnaire</p>
            <p className="mt-1 text-sm text-muted">
              Share your diabetes history so your care team is ready for your first consultation.
            </p>
          </div>
          <Button href="/patient/pcq/baseline" className="shrink-0">
            Start questionnaire
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
