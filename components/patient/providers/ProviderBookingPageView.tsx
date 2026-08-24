"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, getGraphQLErrorCode, getUserAccountType } from "@/features/auth/auth-context";
import { CONSULTANT_QUERY, REQUEST_CONSULTATION_MUTATION } from "@/lib/healthcare/graphql";

type ProviderDetailData = {
  consultant: {
    id: string;
    displayName: string;
    biography: string | null;
    specialty: string;
    languages: string[];
    acceptingPatients: boolean;
    status: string;
    clinic: { id: string; name: string } | null;
  } | null;
};

type RequestConsultationData = {
  requestConsultation: {
    success: boolean;
    message: string;
    errors: Array<{ code: string; message: string }>;
    data: {
      consultationRequest: {
        id: string;
        status: string;
      } | null;
    } | null;
  };
};

type ProviderBookingPageViewProps = Readonly<{
  providerId: string;
}>;

export function ProviderBookingPageView({ providerId }: ProviderBookingPageViewProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data, loading, error } = useQuery<ProviderDetailData>(CONSULTANT_QUERY, {
    variables: { id: providerId },
    fetchPolicy: "network-only",
  });
  const [requestConsultation, { loading: requesting }] = useMutation<RequestConsultationData>(
    REQUEST_CONSULTATION_MUTATION,
  );

  const provider = data?.consultant ?? null;
  const code = getGraphQLErrorCode(error);
  const accountType = getUserAccountType(user);
  const isVerifiedUser = Boolean(user?.isVerified);

  async function handleRequestConsultation() {
    setSubmitError(null);
    setSuccessMessage(null);

    const result = await requestConsultation({
      variables: {
        consultantId: providerId,
        reason: reason.trim() || undefined,
      },
    });
    const payload = result.data?.requestConsultation;

    if (!payload?.success) {
      setSubmitError(payload?.errors?.[0]?.message ?? "Unable to request this consultation.");
      return;
    }

    setSuccessMessage("Consultation request submitted.");
    window.setTimeout(() => router.push("/patient/consultants"), 900);
  }

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
        {code === "not_found"
          ? "Consultant not found."
          : code === "forbidden"
            ? "Access denied for this consultant."
            : "Unable to load consultant details."}
      </div>
    );
  }

  if (!provider.acceptingPatients) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        This consultant is currently not accepting consultation requests.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{provider.displayName}</CardTitle>
          <p className="text-sm font-medium text-primary">{provider.specialty}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {provider.biography ? <p className="text-sm leading-6 text-muted">{provider.biography}</p> : null}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted">Clinic</p>
              <p className="font-medium text-text">{provider.clinic?.name ?? "Independent practice"}</p>
            </div>
            <div>
              <p className="text-muted">Languages</p>
              <p className="font-medium text-text">{provider.languages.length ? provider.languages.join(", ") : "Not specified"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request consultation</CardTitle>
          <p className="text-sm text-muted">Share a short reason so the consultant can review the request.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Briefly describe what you need help with..."
          />
          {submitError ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {submitError}
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
              {successMessage}
            </div>
          ) : null}
          <Button
            type="button"
            fullWidth
            disabled={requesting}
            onClick={() => void handleRequestConsultation()}
          >
            {requesting ? "Submitting..." : "Submit request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
