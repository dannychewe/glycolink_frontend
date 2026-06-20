"use client";

import { FormEvent, useState } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { CalendarClock, CalendarX, Eye, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  CONSULTANT_AVAILABILITY_QUERY,
  DELETE_AVAILABILITY_RULE_MUTATION,
  DELETE_AVAILABILITY_EXCEPTION_MUTATION,
  SET_AVAILABILITY_RULE_MUTATION,
  ADD_AVAILABILITY_EXCEPTION_MUTATION,
  PREVIEW_SLOTS_QUERY,
  MY_PROVIDER_PROFILE_QUERY,
  PROVIDER_WEEKDAY_OPTIONS,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type AlertState = {
  type: "success" | "error";
  message: string;
  section: "rule" | "exception" | "preview";
} | null;

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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function weekdayLabel(n: number) {
  return PROVIDER_WEEKDAY_OPTIONS.find((o) => o.value === n)?.label ?? `Day ${n}`;
}

function mapError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PROVIDER_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED")
    return "Access denied. Ensure your provider profile is approved.";
  if (code === "PROVIDER_NOT_FOUND") return "Provider profile not found.";
  if (code === "INVALID_PROVIDER_STATE" || code === "INVALID_STATE_TRANSITION")
    return "This action is not allowed in your current profile state.";
  return getGraphQLErrorMessage(error, "Unable to save. Please try again.");
}

function SectionHeader({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

function InlineAlert({ alert, section, onDismiss }: {
  alert: AlertState;
  section: NonNullable<AlertState>["section"];
  onDismiss: () => void;
}) {
  if (!alert || alert.section !== section) return null;
  const isError = alert.type === "error";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError
        ? <AlertCircle className="mt-0.5 size-4 shrink-0" />
        : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

export function ConsultantAvailabilityLifecycleManager() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    weekday: 1,
    startTime: "08:00",
    endTime: "16:00",
    slotMinutes: 30,
    timezone: "Africa/Lusaka",
    isActive: true,
  });
  const [exceptionForm, setExceptionForm] = useState({
    date: "",
    isAvailable: false,
    overrideStartTime: "",
    overrideEndTime: "",
    reason: "",
  });
  const [previewDate, setPreviewDate] = useState("");

  const { data, loading: loadingAvailability, refetch } = useQuery<{
    myAvailabilityRules: AvailabilityRule[];
    myAvailabilityExceptions: AvailabilityException[];
  }>(CONSULTANT_AVAILABILITY_QUERY, { fetchPolicy: "network-only" });

  const { data: profileData } = useQuery(MY_PROVIDER_PROFILE_QUERY, {
    fetchPolicy: "cache-first",
  });

  const [fetchSlots, { data: slotsData, loading: loadingSlots }] = useLazyQuery<{
    availableSlots: Slot[];
  }>(PREVIEW_SLOTS_QUERY);

  const [setAvailabilityRule, { loading: isSavingRule }] = useMutation(SET_AVAILABILITY_RULE_MUTATION);
  const [addAvailabilityException, { loading: isSavingException }] = useMutation(ADD_AVAILABILITY_EXCEPTION_MUTATION);
  const [deleteRule] = useMutation(DELETE_AVAILABILITY_RULE_MUTATION);
  const [deleteException] = useMutation(DELETE_AVAILABILITY_EXCEPTION_MUTATION);

  const rules = (data?.myAvailabilityRules ?? []).slice().sort((a, b) => a.weekday - b.weekday);
  const exceptions = (data?.myAvailabilityExceptions ?? []).slice().sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const providerId: string | undefined = profileData?.myProviderProfile?.id;
  const slots: Slot[] = slotsData?.availableSlots ?? [];

  async function handleSaveRule(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await setAvailabilityRule({
        variables: {
          data: {
            weekday: ruleForm.weekday,
            startTime: toApiTime(ruleForm.startTime),
            endTime: toApiTime(ruleForm.endTime),
            slotMinutes: ruleForm.slotMinutes,
            timezone: ruleForm.timezone,
            isActive: ruleForm.isActive,
          },
        },
      });
      await refetch();
      setAlert({
        type: "success",
        section: "rule",
        message: `${weekdayLabel(ruleForm.weekday)} schedule saved — ${ruleForm.startTime}–${ruleForm.endTime}, ${ruleForm.slotMinutes}-min slots.`,
      });
    } catch (error) {
      setAlert({ type: "error", section: "rule", message: mapError(error) });
    }
  }

  async function handleDeleteRule(ruleId: string) {
    setDeletingId(ruleId);
    try {
      await deleteRule({ variables: { ruleId } });
      await refetch();
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddException(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    if (!exceptionForm.date) {
      setAlert({ type: "error", section: "exception", message: "Please select a date." });
      return;
    }
    const hasPartialOverride =
      Boolean(exceptionForm.overrideStartTime) !== Boolean(exceptionForm.overrideEndTime);
    if (hasPartialOverride) {
      setAlert({ type: "error", section: "exception", message: "Provide both override start and end times, or neither." });
      return;
    }
    try {
      await addAvailabilityException({
        variables: {
          data: {
            date: exceptionForm.date,
            isAvailable: exceptionForm.isAvailable,
            overrideStartTime: exceptionForm.overrideStartTime
              ? toApiTime(exceptionForm.overrideStartTime)
              : undefined,
            overrideEndTime: exceptionForm.overrideEndTime
              ? toApiTime(exceptionForm.overrideEndTime)
              : undefined,
            reason: exceptionForm.reason || undefined,
          },
        },
      });
      await refetch();
      setAlert({
        type: "success",
        section: "exception",
        message: `Exception saved for ${formatDate(exceptionForm.date)} — marked as ${exceptionForm.isAvailable ? "available" : "unavailable"}.`,
      });
      setExceptionForm({ date: "", isAvailable: false, overrideStartTime: "", overrideEndTime: "", reason: "" });
    } catch (error) {
      setAlert({ type: "error", section: "exception", message: mapError(error) });
    }
  }

  async function handleDeleteException(exceptionId: string) {
    setDeletingId(exceptionId);
    try {
      await deleteException({ variables: { exceptionId } });
      await refetch();
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

  function handlePreview() {
    if (!previewDate || !providerId) return;
    fetchSlots({ variables: { providerId, date: previewDate } });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Availability"
        description="Set your weekly working hours and manage one-off date exceptions."
      />

      {/* ── Weekly schedule ── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<CalendarClock className="size-4" />}
          title="Weekly Schedule"
          description="Define working hours for each day of the week. Saving a rule for the same day replaces it."
        />

        <InlineAlert alert={alert} section="rule" onDismiss={() => setAlert(null)} />

        {/* Current rules list */}
        {loadingAvailability ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-border/40" />
            ))}
          </div>
        ) : rules.length > 0 ? (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      rule.isActive ? "bg-success" : "bg-border",
                    )}
                    aria-label={rule.isActive ? "Active" : "Inactive"}
                  />
                  <div>
                    <p className="text-sm font-medium text-text">{weekdayLabel(rule.weekday)}</p>
                    <p className="text-xs text-muted">
                      {formatTime(rule.startTime)}–{formatTime(rule.endTime)} · {rule.slotMinutes} min slots · {rule.timezone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${weekdayLabel(rule.weekday)} rule`}
                  disabled={deletingId === rule.id}
                  onClick={() => void handleDeleteRule(rule.id)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted">
            No weekly rules yet. Add one below.
          </p>
        )}

        {/* Add rule form */}
        <form
          onSubmit={(e) => void handleSaveRule(e)}
          className="space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6"
        >
          <p className="text-sm font-medium text-text">Add or update a day&apos;s schedule</p>

          <div className="space-y-2">
            <Label htmlFor="weekday">Day of the week</Label>
            <select
              id="weekday"
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={ruleForm.weekday}
              onChange={(e) => setRuleForm((p) => ({ ...p, weekday: Number(e.target.value) }))}
            >
              {PROVIDER_WEEKDAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time</Label>
              <Input
                id="startTime"
                type="time"
                value={ruleForm.startTime}
                onChange={(e) => setRuleForm((p) => ({ ...p, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time</Label>
              <Input
                id="endTime"
                type="time"
                value={ruleForm.endTime}
                onChange={(e) => setRuleForm((p) => ({ ...p, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slot length</Label>
            <div className="flex flex-wrap gap-2">
              {SLOT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRuleForm((p) => ({ ...p, slotMinutes: opt.value }))}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                    ruleForm.slotMinutes === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-text hover:border-primary/40",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={ruleForm.timezone}
              onChange={(e) => setRuleForm((p) => ({ ...p, timezone: e.target.value }))}
              placeholder="Africa/Lusaka"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={ruleForm.isActive}
                onChange={(e) => setRuleForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <div className={cn("flex h-5 w-9 items-center rounded-full transition", ruleForm.isActive ? "bg-primary" : "bg-border")}>
                <div className={cn("mx-0.5 size-4 rounded-full bg-white shadow-sm transition-all", ruleForm.isActive ? "translate-x-4" : "translate-x-0")} />
              </div>
            </div>
            <span className="text-sm text-text">{ruleForm.isActive ? "Rule is active" : "Rule is inactive"}</span>
          </label>

          <Button type="submit" variant="primary" disabled={isSavingRule}>
            {isSavingRule ? "Saving…" : "Save Schedule"}
          </Button>
        </form>
      </section>

      {/* ── Date exceptions ── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<CalendarX className="size-4" />}
          title="Date Exceptions"
          description="Block a specific date or set custom hours for a one-off day. Adding the same date again updates it."
        />

        <InlineAlert alert={alert} section="exception" onDismiss={() => setAlert(null)} />

        {/* Current exceptions list */}
        {exceptions.length > 0 ? (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {exceptions.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={cn("size-2 shrink-0 rounded-full", ex.isAvailable ? "bg-success" : "bg-danger")}
                    aria-label={ex.isAvailable ? "Available" : "Unavailable"}
                  />
                  <div>
                    <p className="text-sm font-medium text-text">{formatDate(ex.date)}</p>
                    <p className="text-xs text-muted">
                      {ex.isAvailable
                        ? ex.overrideStartTime
                          ? `${formatTime(ex.overrideStartTime)}–${formatTime(ex.overrideEndTime)} (override)`
                          : "Available (usual hours)"
                        : "Unavailable"}
                      {ex.reason ? ` · ${ex.reason}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Delete exception for ${ex.date}`}
                  disabled={deletingId === ex.id}
                  onClick={() => void handleDeleteException(ex.id)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : !loadingAvailability ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted">
            No date exceptions. Add one below.
          </p>
        ) : null}

        {/* Add exception form */}
        <form
          onSubmit={(e) => void handleAddException(e)}
          className="space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6"
        >
          <p className="text-sm font-medium text-text">Add or update a date exception</p>

          <div className="space-y-2">
            <Label htmlFor="exceptionDate">Date</Label>
            <Input
              id="exceptionDate"
              type="date"
              value={exceptionForm.date}
              onChange={(e) => setExceptionForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Availability on this date</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExceptionForm((p) => ({ ...p, isAvailable: false, overrideStartTime: "", overrideEndTime: "" }))}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-sm font-medium transition",
                  !exceptionForm.isAvailable
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-border bg-background text-text hover:border-danger/30",
                )}
              >
                Unavailable
              </button>
              <button
                type="button"
                onClick={() => setExceptionForm((p) => ({ ...p, isAvailable: true }))}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-sm font-medium transition",
                  exceptionForm.isAvailable
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border bg-background text-text hover:border-success/30",
                )}
              >
                Available
              </button>
            </div>
          </div>

          {exceptionForm.isAvailable ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Override hours (optional — leave blank to use usual hours)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="overrideStart">Start time</Label>
                  <Input
                    id="overrideStart"
                    type="time"
                    value={exceptionForm.overrideStartTime}
                    onChange={(e) => setExceptionForm((p) => ({ ...p, overrideStartTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overrideEnd">End time</Label>
                  <Input
                    id="overrideEnd"
                    type="time"
                    value={exceptionForm.overrideEndTime}
                    onChange={(e) => setExceptionForm((p) => ({ ...p, overrideEndTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="exceptionReason">Reason (optional)</Label>
            <Textarea
              id="exceptionReason"
              rows={2}
              placeholder="e.g. Public holiday, conference, personal leave…"
              value={exceptionForm.reason}
              onChange={(e) => setExceptionForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </div>

          <Button type="submit" variant="primary" disabled={isSavingException}>
            {isSavingException ? "Saving…" : "Save Exception"}
          </Button>
        </form>
      </section>

      {/* ── Slot preview ── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<Eye className="size-4" />}
          title="Preview Bookable Slots"
          description="See exactly what a patient would see when booking with you on a given date."
        />

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="previewDate">Date</Label>
            <Input
              id="previewDate"
              type="date"
              value={previewDate}
              onChange={(e) => setPreviewDate(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={!previewDate || !providerId || loadingSlots}
          >
            {loadingSlots ? "Loading…" : "Preview"}
          </Button>
        </div>

        {!providerId && (
          <p className="text-xs text-muted">Provider profile not loaded — preview unavailable.</p>
        )}

        {slotsData && (
          slots.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted">
              No available slots on this date based on your current schedule.
            </p>
          ) : (
            <div>
              <p className="mb-3 text-xs text-muted">{slots.length} slot{slots.length !== 1 ? "s" : ""} available</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <span
                    key={slot.startTime}
                    className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
      </section>
    </div>
  );
}
