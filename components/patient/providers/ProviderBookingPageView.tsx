"use client";

import { useQuery } from "@apollo/client";
import { BookingFlow } from "@/components/patient/BookingFlow";
import { Button } from "@/components/ui/button";
import { useAuth, getGraphQLErrorCode, getUserAccountType } from "@/features/auth/auth-context";
import { PROFILE_COMPLETION_STATUS_QUERY } from "@/lib/patient/clinical-profile-graphql";
import { PROVIDER_QUERY } from "@/lib/providers/directory-graphql";

type ProviderDetailData = {
  provider: {
    id: string;
    displayName: string;
    bio: string | null;
    consultationFeeInitial: string | null;
    status: string;
    verificationStatus: string;
    eligible: boolean;
    specialties: string[];
  } | null;
};

type ProviderBookingPageViewProps = Readonly<{
  providerId: string;
}>;

type CompletionStatus = {
  isComplete: boolean;
  pcqComplete: boolean;
  consultationReady: boolean;
};

export function ProviderBookingPageView({ providerId }: ProviderBookingPageViewProps) {
  const { isAuthenticated, user, patientProfile } = useAuth();
  const { data, loading, error } = useQuery<ProviderDetailData>(PROVIDER_QUERY, {
    variables: { id: providerId },
    fetchPolicy: "network-only",
  });

  const provider = data?.provider ?? null;
  const code = getGraphQLErrorCode(error);
  const accountType = getUserAccountType(user);
  const isVerifiedUser = Boolean(user?.isVerified);
  const shouldCheckCompletion = isAuthenticated && accountType === "PATIENT" && isVerifiedUser;
  const {
    data: completionData,
    loading: completionLoading,
    error: completionError,
  } = useQuery<{ profileCompletionStatus: CompletionStatus | null }>(
    PROFILE_COMPLETION_STATUS_QUERY,
    {
      fetchPolicy: "network-only",
      skip: !shouldCheckCompletion,
    },
  );
  const completion = completionData?.profileCompletionStatus ?? null;
  const completionCode = getGraphQLErrorCode(completionError);
  const needsPatientProfile =
    shouldCheckCompletion &&
    (completionCode === "PATIENT_PROFILE_NOT_FOUND" ||
      completion?.isComplete === false ||
      (!completionLoading && !completion && patientProfile?.profileComplete === false));
  const needsBaselinePcq =
    shouldCheckCompletion &&
    completion?.isComplete === true &&
    !completion.pcqComplete &&
    !completion.consultationReady;

  if (!isAuthenticated) {
    return (
      <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        <p>Please sign in with your patient account to book this consultation.</p>
        <Button href={`/login?next=/patient/providers/${providerId}/book`} variant="secondary">
          Sign in
        </Button>
      </div>
    );
  }

  if (accountType !== "PATIENT") {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Only patient accounts can book consultations.
      </div>
    );
  }

  if (!isVerifiedUser) {
    return (
      <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        <p>Verify your account before booking a consultation.</p>
        <Button href="/verify-email" variant="secondary">
          Verify account
        </Button>
      </div>
    );
  }

  if (completionLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted">
        Checking profile readiness...
      </div>
    );
  }

  if (needsPatientProfile) {
    return (
      <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        <p>Complete your patient profile before booking a consultation.</p>
        <Button href="/patient/onboarding" variant="secondary">
          Complete profile
        </Button>
      </div>
    );
  }

  if (needsBaselinePcq) {
    return (
      <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        <p>Complete your baseline questionnaire before booking a consultation.</p>
        <Button href="/patient/pcq/baseline" variant="secondary">
          Complete questionnaire
        </Button>
      </div>
    );
  }

  if (completionError && !needsPatientProfile) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to verify your profile readiness. Please refresh and try again.
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted">Loading provider...</div>;
  }

  if (error || !provider) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-4 text-sm text-danger">
        {code === "PROVIDER_NOT_FOUND"
          ? "Provider not found."
          : code === "PROVIDER_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED"
            ? "Access denied for this provider."
            : "Unable to load provider details."}
      </div>
    );
  }

  if (!provider.eligible) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        This provider is currently not eligible for directory booking.
      </div>
    );
  }

  const mappedProvider = {
    id: provider.id,
    name: provider.displayName,
    specialty: provider.specialties[0] ?? "General",
    consultationFee: Number(provider.consultationFeeInitial ?? 0),
    isAvailable: provider.eligible,
  } as const;

  return (
    <BookingFlow provider={mappedProvider} />
  );
}
