"use client";

import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";

export function OnboardingBanner() {
  const { patientProfile, postLoginRedirect } = useAuth();

  const needsOnboarding =
    postLoginRedirect?.reason === "PATIENT_ONBOARDING" ||
    patientProfile?.profileComplete === false;

  if (!needsOnboarding) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
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
