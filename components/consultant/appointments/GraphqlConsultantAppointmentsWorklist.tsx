"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CANCEL_APPOINTMENT_MUTATION,
  MY_APPOINTMENTS_QUERY,
  RESCHEDULE_APPOINTMENT_MUTATION,
  TODAYS_APPOINTMENTS_QUERY,
  UPCOMING_APPOINTMENTS_QUERY,
} from "@/lib/bookings/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";
import { canJoinVideoConsultation } from "@/lib/video-consultation-graphql";

// ─── Types ───────────────────────────────────────────────

type Appointment = {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string | null;
  organizationId: string | null;
  consultationType: string | null;
  source: string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  rescheduledFromAppointmentId: string | null;
};

type AppointmentLite = {
  patientName: string | null;
  appointment: {
    id: string;
    startsAt: string;
    endsAt: string | null;
    status: string;
    consultationType: string | null;
    patientId: string;
  };
};

type AlertState = { type: "success" | "error"; message: string } | null;
type Tab = "Today" | "Upcoming" | "Completed";

// ─── Helpers ─────────────────────────────────────────────

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatStatus(status: string) {
  const n = normalizeStatus(status);
  if (n === "AWAITING_PAYMENT") return "Awaiting Payment";
  if (n === "IN_PROGRESS") return "In Progress";
  if (n === "CHECKED_IN") return "Checked In";
  if (n === "NO_SHOW") return "No Show";
  return n.charAt(0) + n.slice(1).toLowerCase();
}

function getStatusVariant(status: string) {
  const n = normalizeStatus(status);
  if (n === "IN_PROGRESS" || n === "CHECKED_IN") return "primary" as const;
  if (n === "CONFIRMED" || n === "COMPLETED") return "success" as const;
  if (n === "AWAITING_PAYMENT" || n === "PENDING" || n === "REQUESTED") return "warning" as const;
  if (n === "CANCELLED" || n === "NO_SHOW" || n === "RESCHEDULED") return "danger" as const;
  return "secondary" as const;
}

function statusBorderClass(status: string) {
  const n = normalizeStatus(status);
  if (n === "IN_PROGRESS" || n === "CHECKED_IN") return "border-l-primary/60";
  if (n === "CONFIRMED") return "border-l-success/60";
  if (n === "AWAITING_PAYMENT" || n === "PENDING" || n === "REQUESTED") return "border-l-warning/60";
  if (n === "CANCELLED" || n === "NO_SHOW" || n === "RESCHEDULED") return "border-l-danger/40";
  return "border-l-border";
}

function isActionable(status: string) {
  const n = normalizeStatus(status);
  return ["PENDING", "REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(n);
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Inline Alert ─────────────────────────────────────────

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Reschedule Panel ─────────────────────────────────────

function ReschedulePanel({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone: () => void;
}) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({
    newStartTime: toDatetimeLocal(appointment.startsAt),
    newEndTime: toDatetimeLocal(appointment.endsAt),
  });
  const [reschedule, { loading }] = useMutation(RESCHEDULE_APPOINTMENT_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await reschedule({
        variables: {
          appointmentId: appointment.id,
          newStartTime: new Date(form.newStartTime).toISOString(),
          newEndTime: new Date(form.newEndTime).toISOString(),
        },
        refetchQueries: [
          { query: MY_APPOINTMENTS_QUERY, variables: { limit: 100 } },
          { query: TODAYS_APPOINTMENTS_QUERY },
          { query: UPCOMING_APPOINTMENTS_QUERY, variables: { limit: 100 } },
        ],
      });
      setAlert({ type: "success", message: "Appointment rescheduled." });
      setTimeout(onDone, 1200);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to reschedule. Check the new times and try again.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3 rounded-lg border border-border bg-background px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Reschedule</p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`rs-start-${appointment.id}`}>New start time</Label>
          <input
            id={`rs-start-${appointment.id}`}
            type="datetime-local"
            required
            value={form.newStartTime}
            onChange={(e) => setForm((p) => ({ ...p, newStartTime: e.target.value }))}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`rs-end-${appointment.id}`}>New end time</Label>
          <input
            id={`rs-end-${appointment.id}`}
            type="datetime-local"
            required
            value={form.newEndTime}
            onChange={(e) => setForm((p) => ({ ...p, newEndTime: e.target.value }))}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "Saving..." : "Confirm Reschedule"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Cancel Panel ─────────────────────────────────────────

function CancelPanel({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone: () => void;
}) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [reason, setReason] = useState("");
  const [cancel, { loading }] = useMutation(CANCEL_APPOINTMENT_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await cancel({
        variables: { appointmentId: appointment.id, reason: reason || undefined },
        refetchQueries: [
          { query: MY_APPOINTMENTS_QUERY, variables: { limit: 100 } },
          { query: TODAYS_APPOINTMENTS_QUERY },
          { query: UPCOMING_APPOINTMENTS_QUERY, variables: { limit: 100 } },
        ],
      });
      setAlert({ type: "success", message: "Appointment cancelled." });
      setTimeout(onDone, 1200);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to cancel appointment.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3 rounded-lg border border-danger/20 bg-danger/5 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-danger">Cancel Appointment</p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <div className="space-y-1.5">
        <Label htmlFor={`cancel-reason-${appointment.id}`}>Reason (optional)</Label>
        <Textarea
          id={`cancel-reason-${appointment.id}`}
          rows={2}
          placeholder="Provide a reason for the patient..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-danger px-3 text-xs font-medium text-white transition hover:bg-danger/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Cancel Appointment"}
        </button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Keep</Button>
      </div>
    </form>
  );
}

// ─── Appointment Card ─────────────────────────────────────

type PanelOpen = "reschedule" | "cancel" | null;

function AppointmentCard({
  appointment,
  patientName,
}: {
  appointment: Appointment;
  patientName: string | null;
}) {
  const [panel, setPanel] = useState<PanelOpen>(null);
  const actionable = isActionable(appointment.status);
  const isCompleted = normalizeStatus(appointment.status) === "COMPLETED";
  const isCancelled = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(normalizeStatus(appointment.status));
  const canJoinVideo = canJoinVideoConsultation(appointment.consultationType, appointment.status);

  return (
    <div className={cn(
      "rounded-lg border-l-4 bg-surface",
      statusBorderClass(appointment.status),
    )}>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-text">
              {patientName ?? "Patient"}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDateTime(appointment.startsAt)}
                {appointment.endsAt ? ` – ${new Date(appointment.endsAt).toLocaleString("en-ZM", { hour: "numeric", minute: "2-digit" })}` : ""}
              </span>
              {appointment.consultationType ? (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  <span className="capitalize">{appointment.consultationType.replace(/_/g, " ")}</span>
                </span>
              ) : null}
            </div>
            {isCancelled && appointment.cancelReason ? (
              <p className="text-xs text-muted">Reason: {appointment.cancelReason}</p>
            ) : null}
          </div>

          <div className="shrink-0">
            <Badge variant={getStatusVariant(appointment.status)}>
              {formatStatus(appointment.status)}
            </Badge>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-4 flex flex-wrap gap-2">
          {canJoinVideo ? (
            <Button href={`/consultant/appointments/${appointment.id}/video`} size="sm">
              Join video consultation
            </Button>
          ) : null}

          {isCompleted ? (
            <Button href={`/consultant/consultations`} variant="secondary" size="sm">
              View Consultation
            </Button>
          ) : null}

          {actionable ? (
            <>
              <button
                type="button"
                onClick={() => setPanel(panel === "reschedule" ? null : "reschedule")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
                  panel === "reschedule"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-text hover:bg-surface",
                )}
              >
                {panel === "reschedule" ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === "cancel" ? null : "cancel")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
                  panel === "cancel"
                    ? "border-danger bg-danger/5 text-danger"
                    : "border-border bg-background text-text hover:bg-surface",
                )}
              >
                {panel === "cancel" ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                Cancel
              </button>
            </>
          ) : null}
        </div>

        {/* Inline panels */}
        {panel === "reschedule" ? (
          <ReschedulePanel appointment={appointment} onDone={() => setPanel(null)} />
        ) : null}
        {panel === "cancel" ? (
          <CancelPanel appointment={appointment} onDone={() => setPanel(null)} />
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Worklist ────────────────────────────────────────

const TABS: Tab[] = ["Today", "Upcoming", "Completed"];

export function GraphqlConsultantAppointmentsWorklist() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");

  const { data, loading, error } = useQuery<{ myAppointments: Appointment[] }>(MY_APPOINTMENTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: "network-only",
  });
  const { data: todaysData } = useQuery<{ todaysAppointments: AppointmentLite[] }>(TODAYS_APPOINTMENTS_QUERY, {
    fetchPolicy: "network-only",
  });
  const { data: upcomingData } = useQuery<{ upcomingAppointments: AppointmentLite[] }>(UPCOMING_APPOINTMENTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: "network-only",
  });

  const patientNameById = useMemo(() => {
    const map = new Map<string, string>();
    (todaysData?.todaysAppointments ?? []).forEach((item) => {
      if (item.patientName) map.set(item.appointment.id, item.patientName);
    });
    (upcomingData?.upcomingAppointments ?? []).forEach((item) => {
      if (item.patientName) map.set(item.appointment.id, item.patientName);
    });
    return map;
  }, [todaysData?.todaysAppointments, upcomingData?.upcomingAppointments]);

  const counts = useMemo(() => {
    const all = data?.myAppointments ?? [];
    const todayStr = new Date().toISOString().slice(0, 10);
    return {
      Today: all.filter((a) => a.startsAt.slice(0, 10) === todayStr).length,
      Upcoming: all.filter((a) => {
        const n = normalizeStatus(a.status);
        return new Date(a.startsAt).getTime() >= Date.now() && isActionable(a.status) && a.startsAt.slice(0, 10) !== todayStr
          || (isActionable(n) && new Date(a.startsAt).getTime() >= Date.now());
      }).length,
      Completed: all.filter((a) => ["COMPLETED", "NO_SHOW", "CANCELLED", "RESCHEDULED"].includes(normalizeStatus(a.status))).length,
    };
  }, [data?.myAppointments]);

  const filtered = useMemo(() => {
    const all = data?.myAppointments ?? [];
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);

    let result: Appointment[];
    if (activeTab === "Today") {
      result = all.filter((a) => a.startsAt.slice(0, 10) === todayStr);
    } else if (activeTab === "Upcoming") {
      result = all.filter((a) => {
        return new Date(a.startsAt).getTime() >= now && isActionable(a.status);
      });
    } else {
      result = all.filter((a) =>
        ["COMPLETED", "NO_SHOW", "CANCELLED", "RESCHEDULED"].includes(normalizeStatus(a.status)),
      );
    }

    return [...result].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [activeTab, data?.myAppointments]);

  return (
    <div className="space-y-5">
      {/* Tabs with counts */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          const count = counts[tab];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text hover:bg-background",
              )}
              aria-pressed={isActive}
            >
              {tab}
              {count > 0 ? (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold leading-none",
                  isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
                )}>
                  {count}
                </span>
              ) : null}
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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              patientName={patientNameById.get(appointment.id) ?? null}
            />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
          <Calendar className="size-8 text-muted/40" />
          <p className="text-sm font-medium text-text">No {activeTab.toLowerCase()} appointments</p>
          <p className="text-xs text-muted">
            {activeTab === "Today" ? "Nothing scheduled for today." : activeTab === "Upcoming" ? "No upcoming appointments found." : "No completed appointments yet."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
