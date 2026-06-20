"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  HeartPulse,
  MessageSquare,
  Shield,
  Stethoscope,
} from "lucide-react";
import {
  PATIENT_PROVIDER_WORKSPACE_QUERY,
  type PatientProviderWorkspace,
  type WorkspaceAppointment,
  type WorkspaceAssignedPcq,
  type WorkspaceCarePlan,
  type WorkspacePrivacyPreferences,
} from "@/lib/patient/provider-workspace-graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type Data = { patientProviderWorkspace: PatientProviderWorkspace | null };

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function humanize(value: string | null) {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "primary" | "success" | "warning" | "danger" | "secondary" {
  const s = status.toUpperCase();
  if (["COMPLETED", "ACTIVE", "CONFIRMED", "SUBMITTED"].includes(s)) return "success";
  if (["PENDING", "SCHEDULED", "ASSIGNED", "IN_PROGRESS", "DUE"].includes(s)) return "warning";
  if (["CANCELLED", "CANCELED", "REJECTED", "EXPIRED", "OVERDUE"].includes(s)) return "danger";
  return "secondary";
}

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

function AppointmentRow({ appointment }: { appointment: WorkspaceAppointment }) {
  const when = formatDateTime(appointment.startsAt);
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/50 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">
          {humanize(appointment.consultationType) || "Consultation"}
        </p>
        <p className="truncate text-xs text-muted">{when ?? "Time to be confirmed"}</p>
      </div>
      <Badge variant={statusVariant(appointment.status)}>{humanize(appointment.status)}</Badge>
    </li>
  );
}

function PcqRow({ pcq }: { pcq: WorkspaceAssignedPcq }) {
  const due = formatDate(pcq.dueAt);
  const isSubmitted = !!pcq.submittedAt;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/50 px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-text">
          {pcq.template?.name ?? "Questionnaire"}
        </p>
        <p className="truncate text-xs text-muted">
          {pcq.assignmentReason ? humanize(pcq.assignmentReason) : "Assigned by your consultant"}
          {due ? ` · Due ${due}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant(pcq.status)}>{humanize(pcq.status)}</Badge>
        {!isSubmitted ? (
          <Button href={`/patient/pcq/response/${pcq.id}`} size="sm" variant="secondary">
            Complete
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function CarePlanCard({ plan }: { plan: WorkspaceCarePlan }) {
  return (
    <article className="space-y-3 rounded-xl border border-border/70 bg-background/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{plan.title ?? "Care plan"}</p>
          {plan.summary ? <p className="text-xs text-muted">{plan.summary}</p> : null}
        </div>
        <Badge variant={statusVariant(plan.status)}>{humanize(plan.status)}</Badge>
      </div>
      {plan.actions.length > 0 ? (
        <ul className="space-y-1.5">
          {plan.actions.map((action) => {
            const target = formatDate(action.targetDate);
            return (
              <li key={action.id} className="flex items-start gap-2 text-sm text-text">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="flex-1">
                  {action.description ?? (humanize(action.type) || "Action")}
                  {target ? <span className="text-muted"> · by {target}</span> : null}
                </span>
                <Badge variant={statusVariant(action.status)} className="shrink-0">
                  {humanize(action.status)}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}

const PRIVACY_LABELS: { key: keyof Omit<WorkspacePrivacyPreferences, "updatedAt">; label: string }[] = [
  { key: "allowConsultantRecordAccess", label: "Medical record access" },
  { key: "allowDeviceDataSharing", label: "Device & monitoring data" },
  { key: "allowLabResultSharing", label: "Lab results" },
  { key: "allowPharmacySharing", label: "Pharmacy & prescriptions" },
];

function PrivacyRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/50 px-4 py-3">
      <span className="text-sm text-text">{label}</span>
      <Badge variant={enabled ? "success" : "secondary"}>{enabled ? "Shared" : "Private"}</Badge>
    </div>
  );
}

export function ProviderWorkspaceView({ inviteId }: { inviteId: string }) {
  const { data, loading, error } = useQuery<Data>(PATIENT_PROVIDER_WORKSPACE_QUERY, {
    variables: { inviteId, limit: 20 },
    fetchPolicy: "cache-and-network",
  });

  const workspace = data?.patientProviderWorkspace ?? null;

  if (loading && !workspace) {
    return (
      <Container className="space-y-6 py-2">
        <div className="h-32 animate-pulse rounded-lg bg-border/40" />
        <div className="h-64 animate-pulse rounded-lg bg-border/40" />
      </Container>
    );
  }

  if (error || !workspace) {
    return (
      <Container className="max-w-xl space-y-4 py-10 text-center">
        <p className="text-sm font-medium text-text">This workspace isn&apos;t available</p>
        <p className="text-sm text-muted">
          The relationship may have changed, or you don&apos;t have access to this consultant.
        </p>
        <Button href="/patient/consultants" variant="secondary" size="sm" className="mx-auto">
          Back to my consultants
        </Button>
      </Container>
    );
  }

  const {
    provider,
    relationship,
    conversation,
    canMessage,
    canBookAppointment,
    appointments,
    assignedPcqs,
    carePlans,
    privacyPreferences,
  } = workspace;

  const avatar = provider.avatarUrl ?? getProviderFallbackImage(provider.id);
  const specialty = provider.specialties[0] ?? "Healthcare provider";
  const initials = provider.displayName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const conversationId = conversation?.id ?? relationship.activeConversationId;

  return (
    <Container className="space-y-6 py-2">
      <Link
        href="/patient/consultants"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-text"
      >
        <ArrowLeft className="size-4" />
        My consultants
      </Link>

      {/* Provider header */}
      <header className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-border">
          <span className="font-display text-xl font-semibold text-primary">{initials || "Dr"}</span>
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
          <h1 className="truncate text-2xl font-semibold text-ink">{provider.displayName}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Stethoscope className="size-3.5 text-primary" />
            {specialty}
          </p>
          <Badge variant={statusVariant(relationship.status)}>{humanize(relationship.status)}</Badge>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-col">
          {canMessage && conversationId ? (
            <Button href={`/patient/messages/${conversationId}`} size="sm">
              <MessageSquare className="size-4" />
              Message
              {conversation && conversation.unreadMessageCount > 0
                ? ` (${conversation.unreadMessageCount})`
                : ""}
            </Button>
          ) : null}
          {canBookAppointment ? (
            <Button
              href={`/patient/providers/${provider.id}/book`}
              size="sm"
              variant={canMessage && conversationId ? "secondary" : "primary"}
            >
              <CalendarPlus className="size-4" />
              Book appointment
            </Button>
          ) : null}
        </div>
      </header>

      <SectionCard
        icon={<CalendarPlus className="size-4" />}
        title="Appointments"
        action={
          canBookAppointment ? (
            <Button href={`/patient/providers/${provider.id}/book`} size="sm" variant="ghost">
              Book new
            </Button>
          ) : undefined
        }
      >
        {appointments.length > 0 ? (
          <ul className="space-y-2">
            {appointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </ul>
        ) : (
          <EmptyRow>No appointments with this consultant yet.</EmptyRow>
        )}
      </SectionCard>

      <SectionCard icon={<ClipboardList className="size-4" />} title="Assigned questionnaires">
        {assignedPcqs.length > 0 ? (
          <ul className="space-y-2">
            {assignedPcqs.map((pcq) => (
              <PcqRow key={pcq.id} pcq={pcq} />
            ))}
          </ul>
        ) : (
          <EmptyRow>No questionnaires assigned by this consultant.</EmptyRow>
        )}
      </SectionCard>

      <SectionCard icon={<HeartPulse className="size-4" />} title="Care plans">
        {carePlans.length > 0 ? (
          <div className="space-y-3">
            {carePlans.map((plan) => (
              <CarePlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <EmptyRow>No care plans from this consultant yet.</EmptyRow>
        )}
      </SectionCard>

      <SectionCard icon={<Shield className="size-4" />} title="Data sharing">
        {privacyPreferences ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              What this consultant&apos;s practice can access from your profile. Manage these in{" "}
              <Link
                href="/patient/settings"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                settings
              </Link>
              .
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRIVACY_LABELS.map(({ key, label }) => (
                <PrivacyRow key={key} label={label} enabled={privacyPreferences[key]} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyRow>No sharing preferences configured for this consultant.</EmptyRow>
        )}
      </SectionCard>
    </Container>
  );
}
