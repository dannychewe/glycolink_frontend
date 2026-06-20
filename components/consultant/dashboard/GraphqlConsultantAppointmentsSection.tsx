"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelTitle, PanelList, PanelEmpty, ViewAllLink } from "@/components/ui/panel";
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

function statusAccent(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS" || s === "CHECKED_IN") return "bg-primary";
  if (s === "CONFIRMED") return "bg-success";
  if (s === "AWAITING_PAYMENT" || s === "PENDING") return "bg-warning";
  if (s === "CANCELLED" || s === "NO_SHOW") return "bg-danger";
  return "bg-border";
}

export function GraphqlConsultantAppointmentsSection() {
  const { data: todaysData, loading, error } = useQuery<TodaysAppointmentsData>(
    TODAYS_APPOINTMENTS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: upcomingData } = useQuery<UpcomingAppointmentsData>(
    UPCOMING_APPOINTMENTS_QUERY,
    { variables: { limit: 50 }, fetchPolicy: "cache-and-network" },
  );

  const todaysAppointments = todaysData?.todaysAppointments ?? [];
  const upcomingCount = upcomingData?.upcomingAppointments?.length ?? 0;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.appointments} count={todaysAppointments.length} countTone="primary">
          Today&apos;s Schedule
        </PanelTitle>
        <ViewAllLink href="/consultant/appointments" />
      </PanelHeader>

      {error ? (
        <PanelEmpty className="text-warning">Unable to load today&apos;s appointments right now.</PanelEmpty>
      ) : loading && todaysAppointments.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 flex-1 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : todaysAppointments.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">No appointments today</p>
          <p className="mt-0.5 text-xs text-muted">Your schedule is clear.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {todaysAppointments.map((item) => (
            <div
              key={item.appointment.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-background"
            >
              <span className={cn("h-9 w-1 shrink-0 rounded-full", statusAccent(item.appointment.status))} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">
                  {item.patientName ?? "Patient"}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <Icons.time className="size-3" />
                  {formatTime(item.appointment.startsAt)}
                  {item.appointment.consultationType ? (
                    <span className="capitalize text-muted">
                      · {item.appointment.consultationType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ) : null}
                </div>
              </div>
              <Badge variant={getStatusVariant(item.appointment.status)}>
                {formatStatus(item.appointment.status)}
              </Badge>
              <Button href="/consultant/appointments" variant="secondary" size="sm">
                Open
              </Button>
            </div>
          ))}
        </PanelList>
      )}

      {upcomingCount > 0 ? (
        <div className="border-t border-border px-5 py-2.5 text-xs text-muted">
          {upcomingCount} more appointment{upcomingCount === 1 ? "" : "s"} scheduled ahead.
        </div>
      ) : null}
    </Panel>
  );
}
