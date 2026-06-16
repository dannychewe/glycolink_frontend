"use client";

import { useQuery } from "@apollo/client";
import { Mail, Users, XCircle } from "lucide-react";
import {
  MY_PATIENT_CONSULTANTS_QUERY,
  type PatientConsultantInvite,
} from "@/lib/patient/consultant-invites-graphql";
import { ConsultantInviteCard } from "@/components/patient/invites/ConsultantInviteCard";
import { ConsultantCard } from "@/components/patient/consultants/ConsultantCard";
import { Button } from "@/components/ui/button";

type Data = { myPatientConsultants: PatientConsultantInvite[] };

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h2 className="text-xl">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

export function MyConsultantsView() {
  const { data, loading, error, refetch } = useQuery<Data>(MY_PATIENT_CONSULTANTS_QUERY, {
    // No status filter — we group INVITED / ACCEPTED / REJECTED on the client.
    fetchPolicy: "cache-and-network",
  });

  const all = data?.myPatientConsultants ?? [];
  const pending = all.filter((i) => i.status === "INVITED");
  const accepted = all.filter((i) => i.status === "ACCEPTED");
  const rejected = all.filter((i) => i.status === "REJECTED");

  if (loading && all.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-border/40" />
        ))}
      </div>
    );
  }

  if (error && all.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-6 text-sm text-danger">
        <p>We couldn&apos;t load your consultants. Please try again.</p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="size-6" />
        </span>
        <p className="text-sm font-medium text-text">No consultants yet</p>
        <p className="mx-auto max-w-sm text-sm text-muted">
          When a provider invites you to connect, it will show up here. You can also browse the
          directory to find a provider.
        </p>
        <Button href="/patient/providers" variant="secondary" size="sm" className="mx-auto">
          Browse providers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {pending.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading
            icon={<Mail className="size-4" />}
            title="Pending invitations"
            subtitle={`${pending.length} provider${pending.length !== 1 ? "s" : ""} invited you to connect.`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {pending.map((invite) => (
              <ConsultantInviteCard
                key={invite.inviteId}
                invite={invite}
                onChanged={() => void refetch()}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeading
          icon={<Users className="size-4" />}
          title="Your consultants"
          subtitle={
            accepted.length > 0
              ? `${accepted.length} connected provider${accepted.length !== 1 ? "s" : ""}.`
              : "No connected consultants yet."
          }
        />
        {accepted.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {accepted.map((invite) => (
              <ConsultantCard key={invite.inviteId} invite={invite} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center text-sm text-muted">
            Accept an invitation above to start working with a consultant.
          </p>
        )}
      </section>

      {rejected.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading
            icon={<XCircle className="size-4" />}
            title="Declined"
            subtitle={`${rejected.length} invitation${rejected.length !== 1 ? "s" : ""} you declined.`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {rejected.map((invite) => (
              <div
                key={invite.inviteId}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 opacity-70"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-sm font-semibold text-muted">
                  {invite.provider.displayName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {invite.provider.displayName}
                  </p>
                  <p className="text-xs text-muted">Invitation declined</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
