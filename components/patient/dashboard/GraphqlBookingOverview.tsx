"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelTitle, PanelList } from "@/components/ui/panel";
import { PENDING_ACTIONS_QUERY, UPCOMING_APPOINTMENT_QUERY } from "@/lib/bookings/graphql";
import { canJoinVideoConsultation } from "@/lib/video-consultation-graphql";

type UpcomingAppointmentData = {
  upcomingAppointment: {
    appointment: {
      id: string;
      startsAt: string;
      endsAt: string | null;
      status: string;
      consultationType: string | null;
    } | null;
    provider: {
      id: string;
      displayName: string;
      specialties: string[];
      consultationFee: number | null;
      shortBio: string | null;
    } | null;
  } | null;
};

type PendingActionsData = {
  pendingActions: Array<{
    action: string;
    title: string;
    description: string;
    status: string;
    dueAt: string | null;
    appointment: {
      id: string;
      status: string;
    } | null;
    provider: {
      id: string;
      displayName: string;
    } | null;
  }>;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", { hour: "numeric", minute: "2-digit" });
}

function getActionHref(action: string, appointmentId?: string | null) {
  if (!appointmentId) return "/patient/bookings";
  if (action === "PCQ_NOT_COMPLETED") return `/patient/pcq/${appointmentId}`;
  return `/patient/bookings/${appointmentId}`;
}

function getActionLabel(action: string) {
  if (action === "PCQ_NOT_COMPLETED") return "Complete questionnaire";
  if (action === "PAYMENT_PENDING") return "Payment guidance";
  return "Open Appointment";
}

function getActionType(action: string) {
  if (action === "PAYMENT_PENDING") return "Payment";
  if (action === "PCQ_NOT_COMPLETED") return "Questionnaire";
  return "Action";
}

export function GraphqlBookingOverview() {
  const {
    data: upcomingData,
    loading: upcomingLoading,
    error: upcomingError,
  } = useQuery<UpcomingAppointmentData>(UPCOMING_APPOINTMENT_QUERY, {
    fetchPolicy: "network-only",
  });
  const {
    data: pendingData,
    loading: pendingLoading,
    error: pendingError,
  } = useQuery<PendingActionsData>(PENDING_ACTIONS_QUERY, {
    fetchPolicy: "network-only",
  });

  const pendingActions = pendingData?.pendingActions ?? [];
  const upcoming = upcomingData?.upcomingAppointment;
  const nextAppointment = upcoming?.appointment;
  const nextProvider = upcoming?.provider;

  if (upcomingLoading || pendingLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-lg border border-border bg-border/30" />
        <div className="h-36 animate-pulse rounded-lg border border-border bg-border/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingError ? (
        <div className="rounded-lg border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm text-warning">
          Unable to load pending actions right now.
        </div>
      ) : null}

      {pendingActions.length > 0 ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Icons.actionRequired} count={pendingActions.length} countTone="warning">
              Action Required
            </PanelTitle>
          </PanelHeader>
          <PanelList>
            {pendingActions.map((action) => (
              <div
                key={`${action.action}-${action.appointment?.id ?? "na"}`}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
                    {getActionType(action.action)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text">{action.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{action.description}</p>
                </div>
                <Button
                  href={getActionHref(action.action, action.appointment?.id)}
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                >
                  {getActionLabel(action.action)}
                </Button>
              </div>
            ))}
          </PanelList>
        </Panel>
      ) : null}

      {upcomingError ? (
        <div className="rounded-lg border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm text-warning">
          Unable to load upcoming appointment right now.
        </div>
      ) : null}

      {nextAppointment && nextProvider ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Icons.appointments}>Next Appointment</PanelTitle>
            <Badge variant={nextAppointment.status === "CONFIRMED" ? "success" : "warning"}>
              {nextAppointment.status.replace(/_/g, " ")}
            </Badge>
          </PanelHeader>
          <div className="p-5 sm:p-6">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-text">{nextProvider.displayName}</p>
              {nextProvider.specialties.length > 0 ? (
                <p className="text-sm font-medium text-primary">
                  {nextProvider.specialties.slice(0, 2).join(" · ")}
                </p>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
              <div className="bg-surface px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Icons.appointments className="size-3.5 text-primary" /> Date
                </p>
                <p className="mt-1 text-sm font-semibold text-text">{formatDate(nextAppointment.startsAt)}</p>
              </div>
              <div className="bg-surface px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Icons.time className="size-3.5 text-primary" /> Time
                </p>
                <p className="mt-1 text-sm font-semibold text-text">{formatTime(nextAppointment.startsAt)}</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">{formatDateTime(nextAppointment.startsAt)}</p>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
              <Button
                href={`/patient/bookings/${nextAppointment.id}`}
                variant="secondary"
                fullWidth
              >
                View Details
              </Button>
              {canJoinVideoConsultation(nextAppointment.consultationType, nextAppointment.status) ? (
                <Button href={`/patient/bookings/${nextAppointment.id}/video`} fullWidth>
                  Join video consultation
                </Button>
              ) : null}
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
