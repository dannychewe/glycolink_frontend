"use client";

import { FormEvent, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  CalendarClock,
  CalendarX,
  CheckCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  ADD_AVAILABILITY_EXCEPTION_MUTATION,
  CONSULTANT_AVAILABILITY_QUERY,
  DELETE_AVAILABILITY_EXCEPTION_MUTATION,
  DELETE_AVAILABILITY_RULE_MUTATION,
  MY_PROVIDER_PROFILE_QUERY,
  PREVIEW_SLOTS_QUERY,
  PROVIDER_WEEKDAY_OPTIONS,
  SET_AVAILABILITY_RULE_MUTATION,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type AvailabilityRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  timezone: string;
  isActive: boolean;
};

type AvailabilityException = {
  id: string;
  date: string;
  isAvailable: boolean;
  overrideStartTime: string | null;
  overrideEndTime: string | null;
  reason: string | null;
};

type Slot = { startTime: string; endTime: string };
type AlertState = { type: "success" | "error"; message: string } | null;

const availabilityBase = "/consultant/availability";
const SLOT_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

function toApiTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function formatTime(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 5);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function weekdayLabel(value: number) {
  return PROVIDER_WEEKDAY_OPTIONS.find((option) => option.value === value)?.label ?? `Day ${value}`;
}

function mapError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PROVIDER_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") {
    return "Access denied. Ensure your provider profile is approved.";
  }
  if (code === "PROVIDER_NOT_FOUND") return "Provider profile not found.";
  if (code === "INVALID_PROVIDER_STATE" || code === "INVALID_STATE_TRANSITION") {
    return "This action is not allowed in your current profile state.";
  }
  return getGraphQLErrorMessage(error, "Unable to save. Please try again.");
}

function useAvailability() {
  return useQuery<{
    myAvailabilityRules: AvailabilityRule[];
    myAvailabilityExceptions: AvailabilityException[];
  }>(CONSULTANT_AVAILABILITY_QUERY, { fetchPolicy: "network-only" });
}

function sortRules(rules: AvailabilityRule[]) {
  return rules.slice().sort((a, b) => a.weekday - b.weekday);
}

function sortExceptions(exceptions: AvailabilityException[]) {
  return exceptions.slice().sort((a, b) => a.date.localeCompare(b.date));
}

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        x
      </button>
    </div>
  );
}

function LoadingBlocks() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-lg bg-border/40" />
      <div className="h-40 animate-pulse rounded-lg bg-border/40" />
    </div>
  );
}

function AvailabilitySubnav({ current }: { current: "overview" | "schedule" | "exceptions" | "preview" }) {
  const items = [
    { key: "overview", label: "Overview", href: availabilityBase },
    { key: "schedule", label: "Weekly schedule", href: `${availabilityBase}/schedule` },
    { key: "exceptions", label: "Date exceptions", href: `${availabilityBase}/exceptions` },
    { key: "preview", label: "Slot preview", href: `${availabilityBase}/preview` },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Availability sections">
      {items.map((item) => (
        <Button key={item.key} href={item.href} variant={current === item.key ? "primary" : "secondary"} size="sm">
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

function AvailabilityHeader({ current, title, description }: {
  current: "overview" | "schedule" | "exceptions" | "preview";
  title: string;
  description: string;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Consultant Workspace"
        title={title}
        description={description}
        breadcrumbs={current === "overview" ? undefined : [
          { label: "Availability", href: availabilityBase },
          { label: title },
        ]}
      />
      <AvailabilitySubnav current={current} />
    </>
  );
}

function RuleList({
  rules,
  deletingId,
  onDelete,
}: {
  rules: AvailabilityRule[];
  deletingId: string | null;
  onDelete?: (id: string) => void;
}) {
  if (rules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted">
        No weekly rules yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className={cn("size-2 shrink-0 rounded-full", rule.isActive ? "bg-success" : "bg-border")} />
            <div>
              <p className="text-sm font-medium text-text">{weekdayLabel(rule.weekday)}</p>
              <p className="text-xs text-muted">
                {formatTime(rule.startTime)}-{formatTime(rule.endTime)} · {rule.slotMinutes} min · {rule.timezone}
              </p>
            </div>
          </div>
          {onDelete ? (
            <button
              type="button"
              aria-label={`Delete ${weekdayLabel(rule.weekday)} rule`}
              disabled={deletingId === rule.id}
              onClick={() => onDelete(rule.id)}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ExceptionList({
  exceptions,
  deletingId,
  onDelete,
}: {
  exceptions: AvailabilityException[];
  deletingId: string | null;
  onDelete?: (id: string) => void;
}) {
  if (exceptions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted">
        No date exceptions yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {exceptions.map((exception) => (
        <div key={exception.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className={cn("size-2 shrink-0 rounded-full", exception.isAvailable ? "bg-success" : "bg-danger")} />
            <div>
              <p className="text-sm font-medium text-text">{formatDate(exception.date)}</p>
              <p className="text-xs text-muted">
                {exception.isAvailable
                  ? exception.overrideStartTime
                    ? `${formatTime(exception.overrideStartTime)}-${formatTime(exception.overrideEndTime)} override`
                    : "Available using usual hours"
                  : "Unavailable"}
                {exception.reason ? ` · ${exception.reason}` : ""}
              </p>
            </div>
          </div>
          {onDelete ? (
            <button
              type="button"
              aria-label={`Delete exception for ${exception.date}`}
              disabled={deletingId === exception.id}
              onClick={() => onDelete(exception.id)}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ConsultantAvailabilityLifecycleManager() {
  const { data, loading } = useAvailability();
  const rules = sortRules(data?.myAvailabilityRules ?? []);
  const exceptions = sortExceptions(data?.myAvailabilityExceptions ?? []);
  const activeRules = rules.filter((rule) => rule.isActive).length;
  const unavailableExceptions = exceptions.filter((exception) => !exception.isAvailable).length;

  if (loading) return <LoadingBlocks />;

  return (
    <div className="space-y-6">
      <AvailabilityHeader
        current="overview"
        title="Availability"
        description="Manage bookable time in a clear order: weekly schedule, date exceptions, then patient-facing slot preview."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <CalendarClock className="mb-4 size-5 text-primary" />
          <p className="text-2xl font-semibold text-text">{activeRules}</p>
          <p className="text-sm font-medium text-text">Active weekly days</p>
          <p className="mt-1 text-sm text-muted">Set normal working hours and slot length.</p>
          <Button href={`${availabilityBase}/schedule`} variant="secondary" size="sm" className="mt-4">
            Open schedule
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <CalendarX className="mb-4 size-5 text-primary" />
          <p className="text-2xl font-semibold text-text">{exceptions.length}</p>
          <p className="text-sm font-medium text-text">Date exceptions</p>
          <p className="mt-1 text-sm text-muted">{unavailableExceptions} unavailable date{unavailableExceptions === 1 ? "" : "s"}.</p>
          <Button href={`${availabilityBase}/exceptions`} variant="secondary" size="sm" className="mt-4">
            Open exceptions
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <Eye className="mb-4 size-5 text-primary" />
          <p className="text-2xl font-semibold text-text">Preview</p>
          <p className="text-sm font-medium text-text">Bookable slots</p>
          <p className="mt-1 text-sm text-muted">Check what patients can book for a date.</p>
          <Button href={`${availabilityBase}/preview`} variant="secondary" size="sm" className="mt-4">
            Preview slots
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-text">Weekly schedule</h2>
          <RuleList rules={rules} deletingId={null} />
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-text">Upcoming exceptions</h2>
          <ExceptionList exceptions={exceptions.slice(0, 6)} deletingId={null} />
        </section>
      </div>
    </div>
  );
}

export function ConsultantAvailabilitySchedulePageView() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    weekday: 1,
    startTime: "08:00",
    endTime: "16:00",
    slotMinutes: 30,
    timezone: "Africa/Lusaka",
    isActive: true,
  });
  const { data, loading, refetch } = useAvailability();
  const [setAvailabilityRule, { loading: saving }] = useMutation(SET_AVAILABILITY_RULE_MUTATION);
  const [deleteRule] = useMutation(DELETE_AVAILABILITY_RULE_MUTATION);
  const rules = sortRules(data?.myAvailabilityRules ?? []);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    try {
      await setAvailabilityRule({
        variables: {
          data: {
            weekday: form.weekday,
            startTime: toApiTime(form.startTime),
            endTime: toApiTime(form.endTime),
            slotMinutes: form.slotMinutes,
            timezone: form.timezone,
            isActive: form.isActive,
          },
        },
      });
      await refetch();
      setAlert({ type: "success", message: `${weekdayLabel(form.weekday)} schedule saved.` });
    } catch (error) {
      setAlert({ type: "error", message: mapError(error) });
    }
  }

  async function handleDelete(ruleId: string) {
    setDeletingId(ruleId);
    try {
      await deleteRule({ variables: { ruleId } });
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingBlocks />;

  return (
    <div className="space-y-6">
      <AvailabilityHeader
        current="schedule"
        title="Weekly schedule"
        description="Define your normal working days. Saving a rule for the same day replaces that day."
      />
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <RuleList rules={rules} deletingId={deletingId} onDelete={(id) => void handleDelete(id)} />

      <form onSubmit={(event) => void handleSave(event)} className="max-w-3xl space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6">
        <p className="text-sm font-medium text-text">Add or update a day</p>
        <div className="space-y-2">
          <Label htmlFor="weekday">Day</Label>
          <select
            id="weekday"
            className="flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={form.weekday}
            onChange={(event) => setForm((current) => ({ ...current, weekday: Number(event.target.value) }))}
          >
            {PROVIDER_WEEKDAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Slot length</Label>
          <div className="flex flex-wrap gap-2">
            {SLOT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, slotMinutes: option.value }))}
                className={cn(
                  "rounded-lg border px-3.5 py-2 text-sm font-medium transition",
                  form.slotMinutes === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-text hover:border-primary/40",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          <span className="text-sm text-text">{form.isActive ? "Rule is active" : "Rule is inactive"}</span>
        </label>

        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save schedule"}</Button>
      </form>
    </div>
  );
}

export function ConsultantAvailabilityExceptionsPageView() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    isAvailable: false,
    overrideStartTime: "",
    overrideEndTime: "",
    reason: "",
  });
  const { data, loading, refetch } = useAvailability();
  const [addException, { loading: saving }] = useMutation(ADD_AVAILABILITY_EXCEPTION_MUTATION);
  const [deleteException] = useMutation(DELETE_AVAILABILITY_EXCEPTION_MUTATION);
  const exceptions = sortExceptions(data?.myAvailabilityExceptions ?? []);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    const partialOverride = Boolean(form.overrideStartTime) !== Boolean(form.overrideEndTime);
    if (partialOverride) {
      setAlert({ type: "error", message: "Provide both override start and end times, or neither." });
      return;
    }

    try {
      await addException({
        variables: {
          data: {
            date: form.date,
            isAvailable: form.isAvailable,
            overrideStartTime: form.overrideStartTime ? toApiTime(form.overrideStartTime) : undefined,
            overrideEndTime: form.overrideEndTime ? toApiTime(form.overrideEndTime) : undefined,
            reason: form.reason || undefined,
          },
        },
      });
      await refetch();
      setForm({ date: "", isAvailable: false, overrideStartTime: "", overrideEndTime: "", reason: "" });
      setAlert({ type: "success", message: "Date exception saved." });
    } catch (error) {
      setAlert({ type: "error", message: mapError(error) });
    }
  }

  async function handleDelete(exceptionId: string) {
    setDeletingId(exceptionId);
    try {
      await deleteException({ variables: { exceptionId } });
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingBlocks />;

  return (
    <div className="space-y-6">
      <AvailabilityHeader
        current="exceptions"
        title="Date exceptions"
        description="Block a specific date or set one-off custom hours."
      />
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <ExceptionList exceptions={exceptions} deletingId={deletingId} onDelete={(id) => void handleDelete(id)} />

      <form onSubmit={(event) => void handleSave(event)} className="max-w-3xl space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6">
        <p className="text-sm font-medium text-text">Add or update an exception</p>
        <div className="space-y-2">
          <Label htmlFor="exceptionDate">Date</Label>
          <Input id="exceptionDate" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
        </div>

        <div className="space-y-2">
          <Label>Availability</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant={!form.isAvailable ? "primary" : "secondary"} onClick={() => setForm((current) => ({ ...current, isAvailable: false, overrideStartTime: "", overrideEndTime: "" }))}>
              Unavailable
            </Button>
            <Button type="button" variant={form.isAvailable ? "primary" : "secondary"} onClick={() => setForm((current) => ({ ...current, isAvailable: true }))}>
              Available
            </Button>
          </div>
        </div>

        {form.isAvailable ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overrideStart">Override start</Label>
              <Input id="overrideStart" type="time" value={form.overrideStartTime} onChange={(event) => setForm((current) => ({ ...current, overrideStartTime: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overrideEnd">Override end</Label>
              <Input id="overrideEnd" type="time" value={form.overrideEndTime} onChange={(event) => setForm((current) => ({ ...current, overrideEndTime: event.target.value }))} />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="exceptionReason">Reason</Label>
          <Textarea id="exceptionReason" rows={2} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
        </div>

        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save exception"}</Button>
      </form>
    </div>
  );
}

export function ConsultantAvailabilityPreviewPageView() {
  const [previewDate, setPreviewDate] = useState("");
  const { data: profileData } = useQuery(MY_PROVIDER_PROFILE_QUERY, { fetchPolicy: "cache-first" });
  const [fetchSlots, { data, loading }] = useLazyQuery<{ availableSlots: Slot[] }>(PREVIEW_SLOTS_QUERY);
  const providerId: string | undefined = profileData?.myProviderProfile?.id;
  const slots = data?.availableSlots ?? [];

  function handlePreview() {
    if (!previewDate || !providerId) return;
    void fetchSlots({ variables: { providerId, date: previewDate } });
  }

  return (
    <div className="space-y-6">
      <AvailabilityHeader
        current="preview"
        title="Slot preview"
        description="See exactly what patients can book on a selected date."
      />

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="previewDate">Date</Label>
            <Input id="previewDate" type="date" value={previewDate} onChange={(event) => setPreviewDate(event.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={handlePreview} disabled={!previewDate || !providerId || loading}>
            {loading ? "Loading..." : "Preview slots"}
          </Button>
        </div>
        {!providerId ? <p className="mt-3 text-xs text-muted">Provider profile not loaded. Preview unavailable.</p> : null}
      </div>

      {data ? (
        slots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted">
            No available slots on this date.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="mb-3 text-sm font-medium text-text">{slots.length} available slot{slots.length === 1 ? "" : "s"}</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <span key={slot.startTime} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                  {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                </span>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
