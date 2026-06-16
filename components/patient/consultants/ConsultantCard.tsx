import Link from "next/link";
import { ArrowRight, MessageSquare, Stethoscope } from "lucide-react";
import type { PatientConsultantInvite } from "@/lib/patient/consultant-invites-graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Badge } from "@/components/ui/badge";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * A consultant the patient is connected to (accepted relationship). Links
 * through to the provider workspace keyed by `inviteId`.
 */
export function ConsultantCard({ invite }: { invite: PatientConsultantInvite }) {
  const { provider } = invite;
  const avatar = provider.avatarUrl ?? getProviderFallbackImage(provider.id);
  const specialty = provider.specialties[0] ?? "Healthcare provider";
  const acceptedOn = formatDate(invite.acceptedAt);

  return (
    <Link
      href={`/patient/consultants/${invite.inviteId}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-subtle transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-start gap-4">
        <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 ring-1 ring-border">
          <span className="font-display text-base font-semibold text-primary">
            {initialsOf(provider.displayName) || "Dr"}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- avoids next/image SVG/remote config */}
          <img
            src={avatar}
            alt={provider.displayName}
            className="absolute inset-0 size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold text-ink">{provider.displayName}</p>
            <Badge variant="success">Connected</Badge>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Stethoscope className="size-3.5 text-primary" />
            {specialty}
          </p>
          {acceptedOn ? (
            <p className="text-xs text-muted">Connected since {acceptedOn}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm font-medium text-primary">
        <span className="flex items-center gap-1.5">
          {invite.activeConversationId ? (
            <>
              <MessageSquare className="size-4" />
              Open workspace &amp; messages
            </>
          ) : (
            "Open workspace"
          )}
        </span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
