"use client";

import { useQuery } from "@apollo/client";
import { CalendarClock, Loader2, MessageSquare, Stethoscope, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPOINTMENT_QUERY } from "@/lib/bookings/graphql";
import { PROVIDER_QUERY } from "@/lib/providers/directory-graphql";

type VideoPatientPanelProps = Readonly<{
  appointmentId: string;
  isLive: boolean;
  hasLeft: boolean;
}>;

type AppointmentData = {
  appointment: {
    id: string;
    providerId: string;
    startsAt: string;
    endsAt: string | null;
    consultationType: string | null;
    status: string;
  } | null;
};

type ProviderData = {
  provider: {
    id: string;
    displayName: string;
    specialties: string[];
    organization: { name: string } | null;
  } | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VideoPatientPanel({ appointmentId, isLive, hasLeft }: VideoPatientPanelProps) {
  const appointmentQuery = useQuery<AppointmentData>(APPOINTMENT_QUERY, {
    variables: { id: appointmentId },
    fetchPolicy: "cache-and-network",
  });
  const appointment = appointmentQuery.data?.appointment ?? null;

  const providerQuery = useQuery<ProviderData>(PROVIDER_QUERY, {
    variables: appointment ? { id: appointment.providerId } : undefined,
    skip: !appointment,
    fetchPolicy: "cache-and-network",
  });
  const provider = providerQuery.data?.provider ?? null;

  if (appointmentQuery.loading && !appointment) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading appointment...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      {/* Consultant info */}
      <div className="rounded-lg border border-border bg-background px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0">
            {providerQuery.loading && !provider ? (
              <p className="text-sm text-muted">Loading consultant...</p>
            ) : provider ? (
              <>
                <p className="text-base font-semibold text-text">{provider.displayName}</p>
                {provider.specialties.length > 0 ? (
                  <p className="mt-0.5 text-xs text-muted">{provider.specialties.join(", ")}</p>
                ) : null}
                {provider.organization?.name ? (
                  <p className="mt-0.5 text-xs text-muted">{provider.organization.name}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">Consultant details unavailable</p>
            )}
          </div>
        </div>
        {appointment ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <CalendarClock className="size-3.5" />
            {formatTime(appointment.startsAt)}
          </div>
        ) : null}
      </div>

      {/* Guidance based on state */}
      {isLive ? (
        <div className="rounded-lg border border-border bg-background px-4 py-4">
          <div className="flex items-start gap-3">
            <Video className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-medium text-text">You&apos;re in the consultation</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Take your time to discuss your symptoms, glucose readings, and any concerns
                with your consultant. They may adjust your care plan based on this session.
              </p>
            </div>
          </div>
        </div>
      ) : hasLeft ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <p className="text-sm font-medium text-text">Consultation ended</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Your consultant will review the session and update your care plan if needed.
              You&apos;ll be able to see any new prescriptions, lab orders, and notes in your records.
            </p>
          </div>
          <div className="space-y-2">
            <Button href="/patient/records" size="sm" fullWidth>
              View your records
            </Button>
            <Button href="/patient/messages" variant="secondary" size="sm" fullWidth>
              <MessageSquare className="size-4" />
              Message consultant
            </Button>
            {provider ? (
              <Button href={`/patient/providers/${provider.id}/book`} variant="secondary" size="sm" fullWidth>
                Book follow-up
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background px-4 py-4">
          <p className="text-sm font-medium text-text">Preparing your consultation</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Make sure you&apos;re in a quiet space with a stable internet connection.
            Have any recent glucose readings or medication details ready to discuss.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
