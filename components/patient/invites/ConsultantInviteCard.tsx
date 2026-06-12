"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation } from "@apollo/client";
import { Check, X, Stethoscope, AlertCircle } from "lucide-react";
import {
  ACCEPT_PATIENT_CONSULTANT_INVITE_MUTATION,
  REJECT_PATIENT_CONSULTANT_INVITE_MUTATION,
  mapConsultantInviteError,
  type PatientConsultantInvite,
} from "@/lib/patient/consultant-invites-graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type AcceptResult = {
  acceptPatientConsultantInvite: {
    relationship: { inviteId: string; status: string; activeConversationId: string | null };
  };
};

type RejectResult = {
  rejectPatientConsultantInvite: {
    relationship: { inviteId: string; status: string; activeConversationId: string | null };
  };
};

type Props = {
  invite: PatientConsultantInvite;
  /** Called after a successful accept or reject — use to refetch the list. */
  onChanged?: () => void;
  /** Called after a successful accept, with the opened conversation id (if any). */
  onAccepted?: (conversationId: string | null) => void;
};

export function ConsultantInviteCard({ invite, onChanged, onAccepted }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [accept, { loading: accepting }] = useMutation<AcceptResult>(
    ACCEPT_PATIENT_CONSULTANT_INVITE_MUTATION,
  );
  const [reject, { loading: rejecting }] = useMutation<RejectResult>(
    REJECT_PATIENT_CONSULTANT_INVITE_MUTATION,
  );
  const busy = accepting || rejecting;

  const provider = invite.provider;
  const avatar = provider.avatarUrl ?? getProviderFallbackImage(provider.id);
  const specialty = provider.specialties[0] ?? "Healthcare provider";

  async function handleAccept() {
    setError(null);
    try {
      const res = await accept({ variables: { inviteId: invite.inviteId } });
      const convo = res.data?.acceptPatientConsultantInvite.relationship.activeConversationId ?? null;
      onAccepted?.(convo);
      onChanged?.();
    } catch (e) {
      setError(mapConsultantInviteError(e));
    }
  }

  async function handleReject() {
    setError(null);
    try {
      await reject({ variables: { inviteId: invite.inviteId } });
      onChanged?.();
    } catch (e) {
      setError(mapConsultantInviteError(e));
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle">
      <div className="flex items-start gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-primary/5 ring-1 ring-border">
          <Image src={avatar} alt={provider.displayName} fill sizes="56px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-base font-semibold text-ink">{provider.displayName}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Stethoscope className="size-3.5 text-primary" />
            {specialty}
          </p>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-warning">
            Invitation pending
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">{error}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void handleAccept()} disabled={busy}>
          <Check className="size-4" />
          {accepting ? "Accepting…" : "Accept invite"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleReject()}
          disabled={busy}
          className={cn(rejecting && "opacity-70")}
        >
          <X className="size-4" />
          {rejecting ? "Declining…" : "Decline"}
        </Button>
      </div>
    </div>
  );
}
