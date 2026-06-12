"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { MailCheck } from "lucide-react";
import {
  MY_PATIENT_CONSULTANTS_QUERY,
  type PatientConsultantInvite,
} from "@/lib/patient/consultant-invites-graphql";
import { ConsultantInviteCard } from "@/components/patient/invites/ConsultantInviteCard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type Data = { myPatientConsultants: PatientConsultantInvite[] };

export default function AcceptConsultantInvitePage() {
  const params = useParams<{ inviteId: string }>();
  const inviteId = params?.inviteId;
  const router = useRouter();

  const { data, loading } = useQuery<Data>(MY_PATIENT_CONSULTANTS_QUERY, {
    variables: { status: "INVITED" },
    fetchPolicy: "network-only",
  });

  const invite = data?.myPatientConsultants.find((i) => i.inviteId === inviteId) ?? null;

  return (
    <Container className="max-w-xl space-y-6 py-6">
      <header className="space-y-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </span>
        <h1 className="text-2xl sm:text-3xl">Consultant invitation</h1>
        <p className="text-sm text-muted">
          Accept to connect with your provider and open a direct conversation, or decline if you
          weren&apos;t expecting this.
        </p>
      </header>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-border/40" />
      ) : invite ? (
        <ConsultantInviteCard
          invite={invite}
          onAccepted={(conversationId) =>
            router.replace(conversationId ? `/patient/messages/${conversationId}` : "/patient/dashboard")
          }
          onChanged={() => {
            // Reject path lands here too — head back to the dashboard once answered.
            if (!invite.activeConversationId) router.replace("/patient/dashboard");
          }}
        />
      ) : (
        <div className="space-y-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="text-sm font-medium text-text">This invitation isn&apos;t available</p>
          <p className="text-sm text-muted">
            It may have already been accepted, declined, or expired.
          </p>
          <Button href="/patient/dashboard" variant="secondary" size="sm" className="mx-auto">
            Go to dashboard
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/patient/dashboard" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to dashboard
        </Link>
      </p>
    </Container>
  );
}
