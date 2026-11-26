"use client";

import { useQuery } from "@apollo/client";
import { BookingFlow } from "@/components/patient/BookingFlow";
import { Button } from "@/components/ui/button";
import { useAuth, getGraphQLErrorCode, getGraphQLErrorMessage, getUserAccountType } from "@/features/auth/auth-context";
import { PROVIDER_QUERY } from "@/lib/providers/directory-graphql";
import type { BookableProvider } from "@/types";
import { MY_PATIENT_PROFILE_QUERY } from "@/lib/patient/clinical-profile-graphql";
import { rememberCareDestination } from "@/lib/auth/care-destination";

type ProviderDetailData = {
  provider: {
    id: string;
    displayName: string;
    specialties: string[];
    consultationFeeInitial: string | null;
    eligible: boolean;
  } | null;
};

type ProviderBookingPageViewProps = Readonly<{
  providerId: string;
}>;

export function ProviderBookingPageView({ providerId }: ProviderBookingPageViewProps) {
  const { isAuthenticated, user } = useAuth();
  const { data, loading, error } = useQuery<ProviderDetailData>(PROVIDER_QUERY, {
    variables: { id: providerId },
    fetchPolicy: "network-only",
    skip: !isAuthenticated,
  });

  const provider = data?.provider ?? null;
  const code = getGraphQLErrorCode(error);
  const accountType = getUserAccountType(user);
  const isVerifiedUser = Boolean(user?.isVerified);
  const profileQuery = useQuery<{ myPatientProfile: { profileComplete: boolean } | null }>(MY_PATIENT_PROFILE_QUERY, {
    fetchPolicy: "network-only",
    skip: !isAuthenticated || !isVerifiedUser || accountType !== "PATIENT",
  });

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

  if (loading) {
    return <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted">Loading provider...</div>;
  }

  if (error || !provider) {
    return (
      <div className="space-y-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-4 text-sm text-danger">
        <p>{code === "PROVIDER_NOT_FOUND" || code === "PROVIDER_ACCESS_DENIED"
          ? getGraphQLErrorMessage(error, "This consultant is currently unavailable for booking. Please contact your care team.")
          : "Unable to load consultant details. Please try again."}</p>
        <Button href="/patient/care-plan" variant="secondary" size="sm">Back to care plans</Button>
      </div>
    );
  }

  if (!provider.eligible) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        This provider is currently not eligible for booking.
      </div>
    );
  }

  if (profileQuery.loading) {
    return <p className="text-sm text-muted">Checking your patient profile...</p>;
  }

  if (!profileQuery.data?.myPatientProfile?.profileComplete) {
    const next = `/patient/providers/${providerId}/book`;
    return (
      <div className="space-y-3 border border-border bg-surface px-4 py-4">
        <p className="text-sm text-text">Complete your patient profile before booking this consultation.</p>
        <Button href={`/patient/onboarding?next=${encodeURIComponent(next)}`} onClick={() => rememberCareDestination(next)}>Complete patient profile</Button>
        <Button href={`/our-team/${providerId}`} variant="secondary">Back to care options</Button>
      </div>
    );
  }

  const bookableProvider: BookableProvider = {
    id: provider.id,
    name: provider.displayName,
    specialty: provider.specialties[0] ?? "Specialist",
    consultationFee: provider.consultationFeeInitial ? Number(provider.consultationFeeInitial) : 0,
    isAvailable: provider.eligible,
  };

  return <BookingFlow provider={bookableProvider} />;
}
