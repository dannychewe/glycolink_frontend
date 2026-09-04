import { useQuery } from "@apollo/client";
import { useAuth } from "@/features/auth/auth-context";
import { PATIENT_ONBOARDING_READINESS_QUERY } from "@/lib/patient/clinical-profile-graphql";

export type PatientOnboardingReadiness = {
  isComplete: boolean;
  pcqComplete: boolean;
  missingRequired: string[];
  nextAction?: string | null;
};

/**
 * Shared setup-gate check for the patient dashboard. `isComplete` from the
 * backend covers profile fields only — the baseline PCQ is a sibling flag it
 * doesn't fold in — so `ready` here is the actual combined gate every screen
 * below the setup blocker should key off.
 */
export function usePatientOnboardingReadiness() {
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery<{ patientOnboardingReadiness: PatientOnboardingReadiness | null }>(
    PATIENT_ONBOARDING_READINESS_QUERY,
    { fetchPolicy: "cache-and-network", skip: !isAuthenticated },
  );

  const readiness = data?.patientOnboardingReadiness ?? null;
  const ready = readiness ? readiness.isComplete && readiness.pcqComplete : null;

  return { readiness, ready, loading };
}
