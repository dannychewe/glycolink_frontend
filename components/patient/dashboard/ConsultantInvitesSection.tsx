"use client";

import { useQuery } from "@apollo/client";
import { Mail } from "lucide-react";
import {
  MY_PATIENT_CONSULTANTS_QUERY,
  type PatientConsultantInvite,
} from "@/lib/patient/consultant-invites-graphql";
import { ConsultantInviteCard } from "@/components/patient/invites/ConsultantInviteCard";

type Data = { myPatientConsultants: PatientConsultantInvite[] };

export function ConsultantInvitesSection() {
  const { data, loading, refetch } = useQuery<Data>(MY_PATIENT_CONSULTANTS_QUERY, {
    variables: { status: "INVITED" },
    fetchPolicy: "cache-and-network",
  });

  const invites = data?.myPatientConsultants ?? [];

  // Stay quiet until there is something pending — no empty-state clutter.
  if (loading && invites.length === 0) return null;
  if (invites.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="size-4" />
        </span>
        <div>
          <h2 className="text-xl">Consultant invitations</h2>
          <p className="text-sm text-muted">
            {invites.length} provider{invites.length !== 1 ? "s" : ""} invited you to connect.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {invites.map((invite) => (
          <ConsultantInviteCard
            key={invite.inviteId}
            invite={invite}
            onChanged={() => void refetch()}
          />
        ))}
      </div>
    </section>
  );
}
