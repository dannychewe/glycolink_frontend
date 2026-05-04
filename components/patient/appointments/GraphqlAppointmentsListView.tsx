"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { CalendarDays, CircleDot, Clock3, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MY_APPOINTMENTS_QUERY } from "@/lib/bookings/graphql";
import { cn } from "@/lib/utils/cn";

type MyAppointmentsData = {
  myAppointments: AppointmentItem[];
};

type AppointmentItem = {
  id: string;
  providerId: string;
  patientId: string;
  consultationType: string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

type AppointmentTab = "Upcoming" | "Past" | "Cancelled";

const tabs: AppointmentTab[] = ["Upcoming", "Past", "Cancelled"];

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function formatDateTime(value: string | null) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBadgeVariant(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "CONFIRMED") return "success";
  if (normalized === "IN_PROGRESS") return "primary";
  if (normalized === "CHECKED_IN") return "primary";
  if (normalized === "PENDING") return "warning";
  if (normalized === "AWAITING_PAYMENT") return "warning";
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger";
  return "secondary";
}

function formatConsultationType(value: string | null) {
  if (!value) return "Telemedicine";

  const normalized = value.trim().toLowerCase();
  if (normalized === "telemedicine") return "Telemedicine";
  if (normalized === "in_person") return "In-person";
  if (normalized === "home_visit") return "Home visit";
  return value;
}

export function GraphqlAppointmentsListView() {
  const [activeTab, setActiveTab] = useState<AppointmentTab>("Upcoming");
  const { data, loading, error } = useQuery<MyAppointmentsData>(MY_APPOINTMENTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: "network-only",
  });

  const appointments = useMemo(() => data?.myAppointments ?? [], [data?.myAppointments]);

  const groupedCounts = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        const status = normalizeStatus(appointment.status);
        if (
          status === "PENDING" ||
          status === "REQUESTED" ||
          status === "AWAITING_PAYMENT" ||
          status === "CONFIRMED" ||
          status === "CHECKED_IN" ||
          status === "IN_PROGRESS"
        ) {
          acc.upcoming += 1;
          return acc;
        }
        if (status === "COMPLETED" || status === "NO_SHOW") {
          acc.past += 1;
          return acc;
        }
        if (status === "CANCELLED" || status === "RESCHEDULED") {
          acc.cancelled += 1;
        }
        return acc;
      },
      { upcoming: 0, past: 0, cancelled: 0 },
    );
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter((appointment) => {
      const status = normalizeStatus(appointment.status);
      if (activeTab === "Cancelled") return status === "CANCELLED" || status === "RESCHEDULED";
      if (activeTab === "Past") return status === "COMPLETED" || status === "NO_SHOW";
      return (
        status === "PENDING" ||
        status === "REQUESTED" ||
        status === "AWAITING_PAYMENT" ||
        status === "CONFIRMED" ||
        status === "CHECKED_IN" ||
        status === "IN_PROGRESS"
      );
    });
  }, [activeTab, appointments]);

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            My bookings
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Appointments</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Track your consultations, follow pending payment steps, and access completed visits.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 bg-surface/80 shadow-soft">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Upcoming</p>
              <p className="text-2xl font-semibold text-text">{groupedCounts.upcoming}</p>
            </div>
            <CalendarDays className="size-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-surface/80 shadow-soft">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Past</p>
              <p className="text-2xl font-semibold text-text">{groupedCounts.past}</p>
            </div>
            <Clock3 className="size-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-surface/80 shadow-soft">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Cancelled</p>
              <p className="text-2xl font-semibold text-text">{groupedCounts.cancelled}</p>
            </div>
            <CircleDot className="size-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border/70 bg-surface px-3 py-3">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text hover:bg-slate-50",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load appointments right now.
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-36 animate-pulse bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((appointment) => (
            <Card
              key={appointment.id}
              className="border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-subtle"
            >
              <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {activeTab === "Past"
                      ? "Past appointment"
                      : activeTab === "Cancelled"
                        ? "Cancelled appointment"
                        : "Upcoming appointment"}
                  </p>
                  <p className="text-lg font-semibold text-text">
                    {formatConsultationType(appointment.consultationType)} consultation
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDateTime(appointment.startsAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Stethoscope className="size-3.5" />
                      {formatConsultationType(appointment.consultationType)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(appointment.status)}>
                    {normalizeStatus(appointment.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button href={`/patient/bookings/${appointment.id}`} variant="secondary" className="sm:w-auto" fullWidth>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No appointments found</p>
        </div>
      ) : null}
    </div>
  );
}
