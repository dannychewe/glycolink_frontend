"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ArrowRight } from "lucide-react";
import { Icons } from "@/components/ui/icons";
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icons.invites className="size-4 shrink-0 text-muted" />
          <h2 className="text-lg font-semibold text-ink">Consultant invitations</h2>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
            {invites.length}
          </span>
        </div>
        <Link
          href="/patient/consultants"
          className="hidden shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
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
