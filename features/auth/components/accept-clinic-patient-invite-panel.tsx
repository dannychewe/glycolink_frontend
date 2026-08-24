"use client";

import { useMutation } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { ACCEPT_PATIENT_INVITATION_MUTATION } from "@/lib/healthcare/graphql";

type AcceptPatientInvitationData = {
  acceptPatientInvitation: {
    success: boolean;
    message: string;
    errors: Array<{ code: string; message: string }>;
  };
};

export function AcceptClinicPatientInvitePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const { status, isAuthenticated, bootstrapSession } = useAuth();
  const [acceptInvite, { loading }] = useMutation<AcceptPatientInvitationData>(
    ACCEPT_PATIENT_INVITATION_MUTATION,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setMessage(null);
    setError(null);

    const result = await acceptInvite({ variables: { token } });
    const payload = result.data?.acceptPatientInvitation;

    if (!payload?.success) {
      setError(payload?.errors?.[0]?.message ?? "Unable to accept this invitation.");
      return;
    }

    await bootstrapSession();
    setMessage("Invitation accepted.");
    window.setTimeout(() => router.replace("/patient/providers"), 900);
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Invalid invitation link.
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-sm text-muted">Checking your session...</p>;
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`/patient-invitations/accept?token=${token}`);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Sign in with the invited email address before accepting this clinic invitation.
        </div>
        <Button href={`/login?next=${next}`} fullWidth>
          Sign in to accept
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {message}
        </div>
      ) : null}
      <Button type="button" fullWidth disabled={loading} onClick={() => void handleAccept()}>
        {loading ? "Accepting..." : "Accept clinic invitation"}
      </Button>
    </div>
  );
}
