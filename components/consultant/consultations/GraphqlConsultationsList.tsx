"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { Clock, Play, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { MY_ENCOUNTERS_QUERY, START_ENCOUNTER_MUTATION } from "@/lib/consultant/consultation-graphql";
import { TODAYS_APPOINTMENTS_QUERY } from "@/lib/bookings/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";

type Encounter = {
  id: string;
  appointmentId: string;
  patientId: string;
  encounterType: string | null;
  status: string;
  startedAt: string;
  finalizedAt: string | null;
};

type AppointmentItem = {
  patientName: string | null;
  appointment: {
    id: string;
    startsAt: string;
    status: string;
    consultationType: string | null;
  };
};

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { hour: "numeric", minute: "2-digit" });
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function encounterStatusVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "FINALIZED") return "success" as const;
  if (s === "OPEN" || s === "IN_PROGRESS") return "primary" as const;
  return "secondary" as const;
}

function StartEncounterButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [startEncounter, { loading }] = useMutation(START_ENCOUNTER_MUTATION);

  async function handleStart() {
    setError(null);
    try {
      const result = await startEncounter({ variables: { appointmentId } });
      const encounterId = result.data?.startEncounter?.encounter?.id;
      if (encounterId) {
        router.push(`/consultant/consultations/${encounterId}`);
      }
    } catch (error) {
      setError(getGraphQLErrorMessage(error, "Unable to start encounter. Please try again."));
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={loading}
        onClick={() => void handleStart()}
        className="gap-1.5"
      >
        <Play className="size-3.5" />
        {loading ? "Starting..." : "Start Encounter"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function GraphqlConsultationsList() {
  const { data: encountersData, loading: encountersLoading } = useQuery<{ myEncounters: Encounter[] }>(
    MY_ENCOUNTERS_QUERY,
    { fetchPolicy: "network-only" },
  );

  const { data: appointmentsData, loading: appointmentsLoading } = useQuery<{ todaysAppointments: AppointmentItem[] }>(
    TODAYS_APPOINTMENTS_QUERY,
    { fetchPolicy: "network-only" },
  );

  const encounters = encountersData?.myEncounters ?? [];
  const appointments = appointmentsData?.todaysAppointments ?? [];

  // Map appointmentId → encounterId for quick lookup
  const encounterByAppointmentId = new Map(encounters.map((e) => [e.appointmentId, e]));

  const activeEncounters = encounters.filter((e) => e.status.toUpperCase() !== "FINALIZED");
  const finalizedEncounters = encounters.filter((e) => e.status.toUpperCase() === "FINALIZED");

  const loading = encountersLoading || appointmentsLoading;

  return (
    <div className="space-y-8">
      {/* Today's appointments */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="size-3.5" />
          </span>
          <h2 className="text-base font-semibold text-text">Today&apos;s Appointments</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface px-5 py-6 text-center">
            <p className="text-sm text-muted">No appointments scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((item) => {
              const encounter = encounterByAppointmentId.get(item.appointment.id);
              const hasEncounter = !!encounter;

              return (
                <div
                  key={item.appointment.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border-l-4 bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                    hasEncounter ? "border-l-primary/50" : "border-l-border",
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
                        <span className="capitalize">
                          · {item.appointment.consultationType.replace(/_/g, " ").toLowerCase()}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasEncounter ? (
                      <>
                        <Badge variant={encounterStatusVariant(encounter.status)}>
                          {encounter.status}
                        </Badge>
                        <Button
                          href={`/consultant/consultations/${encounter.id}`}
                          variant="secondary"
                          size="sm"
                          className="gap-1.5"
                        >
                          <ArrowRight className="size-3.5" />
                          Continue
                        </Button>
                      </>
                    ) : (
                      <StartEncounterButton appointmentId={item.appointment.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active encounters */}
      {activeEncounters.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <AlertCircle className="size-3.5" />
            </span>
            <h2 className="text-base font-semibold text-text">Open Encounters</h2>
            <span className="flex size-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
              {activeEncounters.length}
            </span>
          </div>

          <div className="space-y-2">
            {activeEncounters.map((encounter) => (
              <div
                key={encounter.id}
                className="flex flex-col gap-3 rounded-xl border-l-4 border-l-warning/50 bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-text">
                    Patient {encounter.patientId.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-muted">
                    Started {formatDate(encounter.startedAt)}
                    {encounter.encounterType ? ` · ${encounter.encounterType}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{encounter.status}</Badge>
                  <Button
                    href={`/consultant/consultations/${encounter.id}`}
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                  >
                    <ArrowRight className="size-3.5" />
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Finalized encounters */}
      {finalizedEncounters.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle className="size-3.5" />
            </span>
            <h2 className="text-base font-semibold text-text">Finalized Encounters</h2>
          </div>

          <div className="space-y-2">
            {finalizedEncounters.map((encounter) => (
              <div
                key={encounter.id}
                className="flex flex-col gap-3 rounded-xl border-l-4 border-l-success/40 bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-text">
                    Patient {encounter.patientId.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-muted">
                    Finalized {formatDate(encounter.finalizedAt ?? encounter.startedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Finalized</Badge>
                  <Button
                    href={`/consultant/consultations/${encounter.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && encounters.length === 0 && appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="text-base font-medium text-text">No encounters yet</p>
          <p className="mt-1 text-sm text-muted">
            Encounters are created when you start a consultation from today&apos;s appointments.
          </p>
        </div>
      ) : null}
    </div>
  );
}
