"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { CalendarDays, CalendarPlus, CircleDot, Clock3, Stethoscope, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { MY_APPOINTMENTS_QUERY } from "@/lib/bookings/graphql";
import { cn } from "@/lib/utils/cn";
import { canJoinVideoConsultation } from "@/lib/video-consultation-graphql";

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

  const tabCounts: Record<AppointmentTab, number> = {
    Upcoming: groupedCounts.upcoming,
    Past: groupedCounts.past,
    Cancelled: groupedCounts.cancelled,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My bookings"
        title="Appointments"
        description="Track your consultations, follow pending payment steps, and access completed visits."
        actions={
          <Button href="/patient/providers">
            <CalendarPlus className="size-4" />
            Book a consultation
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <StatCell label="Upcoming" value={groupedCounts.upcoming} icon={CalendarDays} />
        <StatCell label="Past" value={groupedCounts.past} icon={Clock3} />
        <StatCell label="Cancelled" value={groupedCounts.cancelled} icon={CircleDot} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-text",
              )}
            >
              {tab}
              <span className="ml-1.5 text-sm text-muted">{tabCounts[tab]}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm text-warning">
          Unable to load appointments right now.
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-36 animate-pulse bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map((appointment) => (
            <Card key={appointment.id} className="transition-colors hover:bg-background">
              <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {activeTab === "Past"
                      ? "Past appointment"
                      : activeTab === "Cancelled"
                        ? "Cancelled appointment"
                        : "Upcoming appointment"}
                  </p>
                  <p className="text-lg font-semibold text-text">
                    {formatConsultationType(appointment.consultationType)} consultation
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-base text-muted">
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
                  <StatusBadge tone={toneForLifecycleStatus(appointment.status)} label={normalizeStatus(appointment.status)} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0 sm:flex-row">
                {canJoinVideoConsultation(appointment.consultationType, appointment.status) ? (
                  <Button href={`/patient/bookings/${appointment.id}/video`} className="sm:w-auto" fullWidth>
                    <Video className="size-4" />
                    Join video consultation
                  </Button>
                ) : null}
                <Button href={`/patient/bookings/${appointment.id}`} variant="secondary" className="sm:w-auto" fullWidth>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-base font-medium text-text">
            {activeTab === "Upcoming" ? "No upcoming appointments" : "No appointments found"}
          </p>
          {activeTab === "Upcoming" ? (
            <Button href="/patient/providers" size="sm">
              <CalendarPlus className="size-4" />
              Book a consultation
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-surface px-4 py-4">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      </div>
      <Icon className="size-5 shrink-0 text-muted" />
    </div>
  );
}
