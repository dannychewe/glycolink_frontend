"use client";

import { useQuery } from "@apollo/client";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  TODAYS_APPOINTMENTS_QUERY,
  UPCOMING_APPOINTMENTS_QUERY,
} from "@/lib/bookings/graphql";

type ConsultantAppointmentItem = {
  patientName: string | null;
  appointment: {
    id: string;
    startsAt: string;
    endsAt: string | null;
    status: string;
    consultationType: string | null;
  };
};

type TodaysAppointmentsData = {
  todaysAppointments: ConsultantAppointmentItem[];
};

type UpcomingAppointmentsData = {
  upcomingAppointments: ConsultantAppointmentItem[];
};

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { hour: "numeric", minute: "2-digit" });
}

function formatStatus(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "AWAITING_PAYMENT") return "Awaiting Payment";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "CHECKED_IN") return "Checked In";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function getStatusVariant(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS" || s === "CHECKED_IN") return "primary" as const;
  if (s === "CONFIRMED" || s === "COMPLETED") return "success" as const;
  if (s === "AWAITING_PAYMENT" || s === "PENDING") return "warning" as const;
  if (s === "CANCELLED" || s === "NO_SHOW") return "danger" as const;
  return "secondary" as const;
}

function statusBorder(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS" || s === "CHECKED_IN") return "border-l-primary/60";
  if (s === "CONFIRMED") return "border-l-success/50";
  if (s === "AWAITING_PAYMENT" || s === "PENDING") return "border-l-warning/50";
  if (s === "CANCELLED" || s === "NO_SHOW") return "border-l-danger/40";
  return "border-l-border";
}

export function GraphqlConsultantAppointmentsSection() {
  const { data: todaysData, loading, error } = useQuery<TodaysAppointmentsData>(
    TODAYS_APPOINTMENTS_QUERY,
    { fetchPolicy: "network-only" },
  );
  const { data: upcomingData } = useQuery<UpcomingAppointmentsData>(
    UPCOMING_APPOINTMENTS_QUERY,
    { variables: { limit: 10 }, fetchPolicy: "network-only" },
  );

  const todaysAppointments = todaysData?.todaysAppointments ?? [];
  const upcomingCount = upcomingData?.upcomingAppointments?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Gradient summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-5 text-white shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Calendar className="size-4" />
            Today&apos;s schedule
          </div>
          {upcomingCount > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90">
              <ArrowRight className="size-3" />
              {upcomingCount} upcoming
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          {loading ? (
            <div className="h-12 w-16 animate-pulse rounded-lg bg-white/20" />
          ) : (
            <>
              <p className="text-5xl font-semibold">{todaysAppointments.length}</p>
              <p className="text-sm text-white/70">
                {todaysAppointments.length === 1 ? "appointment" : "appointments"} today
              </p>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
          <Clock className="size-3" />
          {new Date().toLocaleDateString("en-ZM", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load today&apos;s appointments right now.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && todaysAppointments.length === 0 && !error ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-6 text-center">
          <p className="text-sm font-medium text-text">No appointments today</p>
          <p className="mt-0.5 text-xs text-muted">Your schedule is clear for today.</p>
        </div>
      ) : null}

      {!loading ? (
        <div className="space-y-2">
          {todaysAppointments.map((item) => (
            <div
              key={item.appointment.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border-l-4 bg-surface px-4 py-3.5 shadow-subtle sm:flex-row sm:items-center sm:justify-between",
                statusBorder(item.appointment.status),
              )}
            >
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-text">
                  {item.patientName ?? "Patient"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Clock className="size-3" />
                  {formatTime(item.appointment.startsAt)}
                  {item.appointment.consultationType ? (
                    <span className="rounded-full bg-background px-2 py-0.5 capitalize">
                      {item.appointment.consultationType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(item.appointment.status)}>
                  {formatStatus(item.appointment.status)}
                </Badge>
                <Button
                  href="/consultant/appointments"
                  variant="secondary"
                  size="sm"
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button href="/consultant/appointments" variant="ghost" size="sm" className="gap-1.5">
          View all appointments
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
