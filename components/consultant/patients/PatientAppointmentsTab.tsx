"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Video,
  MapPin,
  Home,
  X,
} from "lucide-react";
import { CANCEL_APPOINTMENT_MUTATION } from "@/lib/bookings/graphql";
import type { WorkspaceAppointment } from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    timeZone: "Africa/Lusaka",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-ZM", {
    timeZone: "Africa/Lusaka",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(
  status: string | null,
): "success" | "warning" | "danger" | "secondary" | "primary" {
  const s = (status ?? "").toLowerCase();
  if (["completed"].includes(s)) return "success";
  if (["confirmed", "checked_in"].includes(s)) return "primary";
  if (["pending", "requested", "awaiting_payment", "in_progress"].includes(s))
    return "warning";
  if (["cancelled", "no_show"].includes(s)) return "danger";
  return "secondary";
}

function consultationIcon(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("telemedicine") || t.includes("video"))
    return <Video className="size-4" />;
  if (t.includes("home")) return <Home className="size-4" />;
  return <MapPin className="size-4" />;
}

function isCancellable(status: string | null) {
  const s = (status ?? "").toLowerCase();
  return [
    "pending",
    "requested",
    "awaiting_payment",
    "confirmed",
    "checked_in",
    "in_progress",
  ].includes(s);
}

function isUpcoming(appointment: WorkspaceAppointment) {
  if (!appointment.startsAt) return false;
  const s = (appointment.status ?? "").toLowerCase();
  return (
    new Date(appointment.startsAt) > new Date() &&
    !["completed", "cancelled", "no_show", "rescheduled"].includes(s)
  );
}

function isPast(appointment: WorkspaceAppointment) {
  return !isUpcoming(appointment);
}

function CancelModal({
  appointment,
  onClose,
  onCancelled,
}: {
  appointment: WorkspaceAppointment;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancel, { loading }] = useMutation(CANCEL_APPOINTMENT_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    try {
      await cancel({
        variables: {
          appointmentId: appointment.id,
          reason: reason.trim() || "Cancelled by consultant",
        },
      });
      onCancelled();
      onClose();
    } catch {
      setError("Unable to cancel this appointment. Please try again.");
    }
  }

  return (
    <DetailModal
      title="Cancel appointment"
      className="sm:max-w-md"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Keep appointment
          </Button>
          <Button
            type="submit"
            form="cancel-appointment-form"
            size="sm"
            variant="danger"
            disabled={loading}
          >
            <X className="size-4" />
            {loading ? "Cancelling..." : "Cancel appointment"}
          </Button>
        </div>
      }
    >
      <form
        id="cancel-appointment-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        <div className="border border-border p-3 text-sm">
          <p className="font-medium text-ink">
            {formatDateTime(appointment.startsAt)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {titleCase(appointment.consultationType)}
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">
            Reason <span className="text-muted">(optional)</span>
          </Label>
          <Input
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Patient requested reschedule"
            disabled={loading}
          />
        </div>
      </form>
    </DetailModal>
  );
}

function AppointmentRow({
  appointment,
  onCancel,
}: {
  appointment: WorkspaceAppointment;
  onCancel: () => void;
}) {
  const status = (appointment.status ?? "").toLowerCase();
  const upcoming = isUpcoming(appointment);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border py-4">
      <div className="min-w-0 flex-1 basis-64 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CalendarDays className="size-4 text-primary" />
            {formatDateTime(appointment.startsAt)}
          </span>
          {appointment.endsAt ? (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Clock className="size-3" />
              until {formatTime(appointment.endsAt)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            {consultationIcon(appointment.consultationType)}
            {titleCase(appointment.consultationType) || "Not specified"}
          </span>
          <Badge
            className="rounded-md tracking-normal"
            variant={statusVariant(appointment.status)}
          >
            {titleCase(appointment.status)}
          </Badge>
          {appointment.source ? (
            <span className="text-xs text-muted">
              Booked by {titleCase(appointment.source)}
            </span>
          ) : null}
        </div>
        {status === "cancelled" && appointment.cancelReason ? (
          <p className="text-xs text-muted">
            Reason: {appointment.cancelReason}
          </p>
        ) : null}
        {status === "rescheduled" ? (
          <p className="text-xs text-muted">
            This appointment was rescheduled.
          </p>
        ) : null}
        {status === "completed" && appointment.completedAt ? (
          <p className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="size-3" />
            Completed {formatDateTime(appointment.completedAt)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {upcoming && isCancellable(appointment.status) ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            <X className="size-4" />
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function PatientAppointmentsTab({
  appointments,
  onChanged,
}: Readonly<{
  appointments: WorkspaceAppointment[];
  onChanged: () => void;
}>) {
  const [filter, setFilter] = useState("upcoming");
  const [cancelling, setCancelling] = useState<WorkspaceAppointment | null>(
    null,
  );

  const upcomingCount = appointments.filter(isUpcoming).length;
  const pastCount = appointments.filter(isPast).length;

  const visible = appointments.filter((a) => {
    if (filter === "upcoming") return isUpcoming(a);
    if (filter === "past") return isPast(a);
    return true;
  });

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <CalendarDays className="size-4 text-primary" />
          Appointments
          <span className="text-xs font-medium tabular-nums text-muted">
            {appointments.length}
          </span>
        </h2>
        <Select
          aria-label="Filter appointments"
          className="w-40"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          options={[
            {
              value: "upcoming",
              label: `Upcoming (${upcomingCount})`,
            },
            { value: "past", label: `Past (${pastCount})` },
            { value: "all", label: `All (${appointments.length})` },
          ]}
        />
      </header>

      {visible.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted">
          {filter === "upcoming"
            ? "No upcoming appointments."
            : filter === "past"
              ? "No past appointments."
              : "No appointments."}
        </p>
      ) : (
        <div>
          {visible.map((a) => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              onCancel={() => setCancelling(a)}
            />
          ))}
        </div>
      )}

      {cancelling ? (
        <CancelModal
          appointment={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={onChanged}
        />
      ) : null}
    </div>
  );
}
