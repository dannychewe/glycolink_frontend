"use client";

import { FormEvent, useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Users, Search, UserPlus, CheckCircle, AlertCircle,
  MessageSquare, FlaskConical, ClipboardList, Bell,
} from "lucide-react";
import {
  CONSULTANT_CLIENTS_QUERY,
  INVITE_PATIENT_MUTATION,
  mapInviteError,
} from "@/lib/consultant/clients-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────

type ConsultantClient = {
  patientId: string;
  patientName: string | null;
  email: string | null;
  phone: string | null;
  diabetesType: string | null;
  onboardingStatus: string | null;
  profileComplete: boolean;
  lastAppointmentAt: string | null;
  nextAppointmentAt: string | null;
  activeConversationId: string | null;
  unreadMessageCount: number;
  pendingPcqCount: number;
  pendingLabReviewCount: number;
  latestAlertSeverity: string | null;
};

type AlertState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function alertBorderClass(severity: string | null) {
  if (!severity) return "border-l-border";
  const s = severity.toUpperCase();
  if (s === "CRITICAL" || s === "HIGH") return "border-l-danger/60";
  if (s === "MEDIUM") return "border-l-warning/60";
  return "border-l-border";
}

function onboardingVariant(status: string | null): "success" | "warning" | "secondary" {
  if (!status) return "secondary";
  const s = status.toUpperCase();
  if (s === "COMPLETE" || s === "COMPLETED") return "success";
  if (s === "PENDING" || s === "IN_PROGRESS") return "warning";
  return "secondary";
}

function formatDiabetesType(value: string | null) {
  if (!value) return null;
  if (value === "type_1") return "Type 1";
  if (value === "type_2") return "Type 2";
  if (value === "prediabetes") return "Prediabetes";
  if (value === "gestational") return "Gestational";
  return value.replace(/_/g, " ");
}

// ─── Inline Alert ─────────────────────────────────────────

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Invite Panel ─────────────────────────────────────────

type InviteResult = {
  fullName: string;
  email: string;
  onboardingStatus: string | null;
};

function InvitePanel({ onClose }: { onClose: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [invited, setInvited] = useState<InviteResult | null>(null);
  const [form, setForm] = useState({ email: "", fullName: "", phone: "", note: "" });
  const [invitePatient, { loading }] = useMutation(INVITE_PATIENT_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      const res = await invitePatient({
        variables: {
          email: form.email,
          fullName: form.fullName || undefined,
          phone: form.phone || undefined,
          note: form.note || undefined,
        },
        refetchQueries: [{ query: CONSULTANT_CLIENTS_QUERY, variables: { limit: 50 } }],
      });
      const profile = res.data?.invitePatient?.patientProfile;
      if (profile) {
        setInvited({
          fullName: profile.fullName ?? form.fullName ?? form.email,
          email: profile.email ?? form.email,
          onboardingStatus: profile.onboardingStatus ?? null,
        });
      }
      setForm({ email: "", fullName: "", phone: "", note: "" });
    } catch (error) {
      setAlert({ type: "error", message: mapInviteError(error) });
    }
  }

  if (invited) {
    return (
      <div className="rounded-2xl border border-success/25 bg-success/5 px-5 py-5 space-y-3">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="size-5" />
          <p className="text-sm font-semibold">Invitation sent</p>
        </div>
        <p className="text-sm text-text">
          <span className="font-medium">{invited.fullName}</span> ({invited.email}) has been
          invited. They will receive an email with setup instructions to complete their profile.
        </p>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={() => setInvited(null)}>
            Invite another
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text">Invite Patient</p>
        <button type="button" onClick={onClose} className="text-xs text-muted hover:text-text transition">✕</button>
      </div>
      <p className="text-xs text-muted">
        The patient will receive a setup email with a link to create their account and complete their profile.
      </p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inviteEmail">
              Email address <span className="text-danger">*</span>
            </Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="patient@example.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inviteFullName">Full name</Label>
            <Input
              id="inviteFullName"
              placeholder="e.g. Thandiwe Mwape"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invitePhone">Phone number</Label>
            <Input
              id="invitePhone"
              type="tel"
              placeholder="+260 97 000 0000"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inviteNote">Personal note (optional)</Label>
            <Textarea
              id="inviteNote"
              rows={2}
              placeholder="Any context to include in the invitation email..."
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Client Row ───────────────────────────────────────────

function ClientRow({ client }: { client: ConsultantClient }) {
  const hasActivity =
    client.unreadMessageCount > 0 ||
    client.pendingPcqCount > 0 ||
    client.pendingLabReviewCount > 0 ||
    !!client.latestAlertSeverity;

  return (
    <div className={cn(
      "rounded-2xl border-l-4 bg-surface shadow-subtle",
      alertBorderClass(client.latestAlertSeverity),
    )}>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: identity */}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-text truncate">
                {client.patientName ?? client.email ?? `Patient ${client.patientId.slice(0, 8)}…`}
              </p>
              {client.latestAlertSeverity ? (
                <Badge variant={["CRITICAL", "HIGH"].includes(client.latestAlertSeverity.toUpperCase()) ? "danger" : "warning"}>
                  {client.latestAlertSeverity} alert
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              {client.email ? <span>{client.email}</span> : null}
              {client.phone ? <span>{client.phone}</span> : null}
              {client.diabetesType ? (
                <span className="rounded-full bg-primary/8 px-2 py-0.5 text-primary font-medium">
                  {formatDiabetesType(client.diabetesType)}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-0.5">
              {client.lastAppointmentAt ? (
                <span>Last seen {formatDate(client.lastAppointmentAt)}</span>
              ) : null}
              {client.nextAppointmentAt ? (
                <span className="text-primary font-medium">Next {formatDate(client.nextAppointmentAt)}</span>
              ) : null}
            </div>
          </div>

          {/* Right: status + activity */}
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Badge variant={onboardingVariant(client.onboardingStatus)}>
              {client.profileComplete ? "Profile complete" : (client.onboardingStatus?.replace(/_/g, " ") ?? "Pending setup")}
            </Badge>

            {hasActivity ? (
              <div className="flex flex-wrap items-center gap-2">
                {client.unreadMessageCount > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <MessageSquare className="size-3" />
                    {client.unreadMessageCount}
                  </span>
                ) : null}
                {client.pendingPcqCount > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    <ClipboardList className="size-3" />
                    {client.pendingPcqCount} PCQ
                  </span>
                ) : null}
                {client.pendingLabReviewCount > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    <FlaskConical className="size-3" />
                    {client.pendingLabReviewCount} labs
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <Button href={`/consultant/patients/${client.patientId}`} variant="secondary" size="sm">
            View Profile
          </Button>
          {client.nextAppointmentAt ? (
            <Button href="/consultant/appointments" variant="ghost" size="sm">
              View Appointment
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function GraphqlClientsList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const { data, loading, error } = useQuery<{ consultantClients: ConsultantClient[] }>(
    CONSULTANT_CLIENTS_QUERY,
    {
      variables: { limit: 50, search: debouncedSearch || undefined },
      fetchPolicy: "network-only",
    },
  );

  const clients = data?.consultantClients ?? [];
  const activeAlerts = clients.filter((c) => c.latestAlertSeverity).length;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          variant={showInvite ? "secondary" : "primary"}
          size="sm"
          onClick={() => setShowInvite((v) => !v)}
        >
          <UserPlus className="size-4" />
          {showInvite ? "Cancel" : "Invite Patient"}
        </Button>
      </div>

      {/* Alert summary */}
      {!loading && activeAlerts > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          <Bell className="size-4 shrink-0" />
          <p>
            <span className="font-semibold">{activeAlerts} patient{activeAlerts !== 1 ? "s" : ""}</span>{" "}
            with unacknowledged monitoring alerts.{" "}
            <a href="/consultant/monitoring" className="font-medium underline">Review alerts</a>
          </p>
        </div>
      ) : null}

      {/* Invite panel */}
      {showInvite ? (
        <InvitePanel onClose={() => setShowInvite(false)} />
      ) : null}

      {/* Stats row */}
      {!loading && clients.length > 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
          </p>
          <div className="flex gap-3 text-xs text-muted">
            {clients.filter((c) => !c.profileComplete).length > 0 ? (
              <span>{clients.filter((c) => !c.profileComplete).length} pending setup</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load client list.
        </div>
      ) : null}

      {/* Loading skeletons */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-border/40" />
          ))}
        </div>
      ) : null}

      {/* Client list */}
      {!loading && clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientRow key={client.patientId} client={client} />
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {!loading && clients.length === 0 && !error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <Users className="size-8 text-muted/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text">
              {debouncedSearch ? `No clients matching "${debouncedSearch}"` : "No clients yet"}
            </p>
            <p className="text-xs text-muted">
              {debouncedSearch
                ? "Try a different name, email, or phone number."
                : "Invite your first patient to get started."}
            </p>
          </div>
          {!debouncedSearch ? (
            <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="size-4" />
              Invite Patient
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
