"use client";

import { useQuery } from "@apollo/client";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PENDING_ACTIONS_QUERY, UPCOMING_APPOINTMENT_QUERY } from "@/lib/bookings/graphql";

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
  if (action === "PCQ_NOT_COMPLETED") return "Complete Questionnaire";
  if (action === "PAYMENT_PENDING") return "Pay Now";
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-2xl bg-border/40" />
        <div className="h-36 animate-pulse rounded-2xl bg-border/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pendingError ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load pending actions right now.
        </div>
      ) : null}

      {pendingActions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl">Action Required</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingActions.map((action) => (
              <div
                key={`${action.action}-${action.appointment?.id ?? "na"}`}
                className="rounded-2xl border border-warning/25 bg-warning/5 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">
                  {getActionType(action.action)}
                </p>
                <p className="mt-2 text-base font-semibold text-text">{action.title}</p>
                <p className="mt-1 text-sm text-muted">{action.description}</p>
                <Button
                  href={getActionHref(action.action, action.appointment?.id)}
                  variant="secondary"
                  className="mt-4"
                >
                  {getActionLabel(action.action)}
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {upcomingError ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load upcoming appointment right now.
        </div>
      ) : null}

      {nextAppointment && nextProvider ? (
        <section className="space-y-4">
          <h2 className="text-2xl">Next Appointment</h2>
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-text">{nextProvider.displayName}</p>
                    {nextProvider.specialties.length > 0 ? (
                      <p className="text-sm font-medium text-primary">
                        {nextProvider.specialties.slice(0, 2).join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      {formatDate(nextAppointment.startsAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      {formatTime(nextAppointment.startsAt)}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={nextAppointment.status === "CONFIRMED" ? "success" : "warning"}
                  className="shrink-0"
                >
                  {nextAppointment.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="mt-5 h-1.5 rounded-full bg-primary/10">
                <div className="h-1.5 w-2/3 rounded-full bg-primary" />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {formatDateTime(nextAppointment.startsAt)}
              </p>

              <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                <Button
                  href={`/patient/bookings/${nextAppointment.id}`}
                  variant="secondary"
                  fullWidth
                >
                  View Details
                </Button>
                {nextAppointment.status === "CONFIRMED" ? (
                  <Button href={`/patient/bookings/${nextAppointment.id}`} fullWidth>
                    Join Consultation
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
