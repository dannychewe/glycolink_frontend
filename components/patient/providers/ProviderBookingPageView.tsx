"use client";

import { useQuery } from "@apollo/client";
import { BookingFlow } from "@/components/patient/BookingFlow";
import { Button } from "@/components/ui/button";
import { useAuth, getGraphQLErrorCode, getUserAccountType } from "@/features/auth/auth-context";
import { PROVIDER_QUERY } from "@/lib/providers/directory-graphql";
import type { BookableProvider } from "@/types";

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
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-4 text-sm text-danger">
        {code === "PROVIDER_NOT_FOUND"
          ? "Provider not found."
          : code === "PROVIDER_ACCESS_DENIED"
            ? "This provider is not available under your clinic's consultant access settings."
            : "Unable to load provider details."}
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

  const bookableProvider: BookableProvider = {
    id: provider.id,
    name: provider.displayName,
    specialty: provider.specialties[0] ?? "Specialist",
    consultationFee: provider.consultationFeeInitial ? Number(provider.consultationFeeInitial) : 0,
    isAvailable: provider.eligible,
  };

  return <BookingFlow provider={bookableProvider} />;
}
