"use client";

import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { usePatientOnboardingReadiness } from "@/lib/patient/use-onboarding-readiness";

/**
 * The one blocking gate on the dashboard: profile completeness AND the
 * baseline PCQ, both driven off `patientOnboardingReadiness` rather than a
 * single boolean, so this checklist stays in sync with whatever the backend
 * actually requires next.
 */
export function OnboardingBanner() {
  const { postLoginRedirect } = useAuth();
  const { readiness, ready } = usePatientOnboardingReadiness();

  const profileIncomplete =
    postLoginRedirect?.reason === "PATIENT_PROFILE_INCOMPLETE" ||
    postLoginRedirect?.reason === "PROFILE_MISSING";

  if (!readiness && !profileIncomplete) return null;
  if (ready) return null;

  const missingPcqOnly = readiness ? readiness.missingRequired.length === 0 && !readiness.pcqComplete : false;

  return (
    <div className="border-l-4 border-primary bg-primary/5 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-text">
            {missingPcqOnly ? "Complete your baseline questionnaire" : "Finish your patient setup"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {missingPcqOnly
              ? "Share your diabetes history so your care team has the essentials before booking."
              : "Complete your profile and baseline questionnaire before booking or joining a programme."}
          </p>
        </div>
        <Button href={missingPcqOnly ? "/patient/pcq/baseline" : "/patient/onboarding"} className="shrink-0">
          Continue setup
        </Button>
      </div>
    </div>
  );
}
