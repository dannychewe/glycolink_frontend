"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Check, Loader2 } from "lucide-react";
import {
  CONSULTANT_AVAILABILITY_QUERY,
  DELETE_AVAILABILITY_RULE_MUTATION,
  PROVIDER_WEEKDAY_OPTIONS,
  SET_AVAILABILITY_RULE_MUTATION,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { Label } from "@/components/ui/label";
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

const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";
const DEFAULT_SLOT = 30;

const SLOT_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

export function StepAvailability() {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [slotMinutes, setSlotMinutes] = useState(DEFAULT_SLOT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDays, setSavedDays] = useState<Set<number>>(new Set());

  const { data } = useQuery<{ myAvailabilityRules: AvailabilityRule[] }>(
    CONSULTANT_AVAILABILITY_QUERY,
    {
      fetchPolicy: "network-only",
      onCompleted(d) {
        const active = d.myAvailabilityRules.filter((r) => r.isActive).map((r) => r.weekday);
        setSelectedDays(new Set(active));
        setSavedDays(new Set(active));
        if (active.length > 0) {
          const first = d.myAvailabilityRules.find((r) => r.isActive);
          if (first) {
            setStartTime(first.startTime.slice(0, 5));
            setEndTime(first.endTime.slice(0, 5));
            setSlotMinutes(first.slotMinutes);
          }
        }
      },
    },
  );

  const [setRule] = useMutation(SET_AVAILABILITY_RULE_MUTATION);
  const [deleteRule] = useMutation(DELETE_AVAILABILITY_RULE_MUTATION);

  const existingRules = data?.myAvailabilityRules ?? [];

  function toggleDay(weekday: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      for (const opt of PROVIDER_WEEKDAY_OPTIONS) {
        const existing = existingRules.find((r) => r.weekday === opt.value);
        if (selectedDays.has(opt.value)) {
          await setRule({
            variables: {
              data: {
                weekday: opt.value,
                startTime,
                endTime,
                slotMinutes,
                timezone: tz,
                isActive: true,
              },
            },
          });
        } else if (existing) {
          await deleteRule({ variables: { ruleId: existing.id } });
        }
      }

      setSavedDays(new Set(selectedDays));
    } catch {
      setSaveError("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    [...selectedDays].sort().join() !== [...savedDays].sort().join() ||
    (savedDays.size > 0 &&
      (() => {
        const first = existingRules.find((r) => r.isActive);
        if (!first) return false;
        return (
          first.startTime.slice(0, 5) !== startTime ||
          first.endTime.slice(0, 5) !== endTime ||
          first.slotMinutes !== slotMinutes
        );
      })());

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Set the days and hours you are available for consultations. You can update this any time
        from your settings.
      </p>

      {/* Day selector */}
      <div className="space-y-2">
        <Label>Available Days</Label>
        <div className="flex flex-wrap gap-2">
          {PROVIDER_WEEKDAY_OPTIONS.map((opt) => {
            const isSelected = selectedDays.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleDay(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/40 hover:text-text",
                )}
              >
                {isSelected ? <Check className="size-3.5" /> : null}
                {opt.label.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time & slot config */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slotMinutes">Slot Duration</Label>
          <select
            id="slotMinutes"
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {SLOT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}

      <button
        type="button"
        disabled={saving || !isDirty}
        onClick={() => void handleSave()}
        className={cn(
          "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition",
          saving || !isDirty
            ? "cursor-not-allowed bg-surface text-muted ring-1 ring-border"
            : "bg-primary text-white hover:bg-primary/90 shadow-sm",
        )}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {saving ? "Saving…" : isDirty ? "Save Availability" : "Availability Saved"}
        {!isDirty && !saving ? <Check className="size-4 text-success" /> : null}
      </button>

      <p className="text-xs text-muted">
        This step is optional — you can continue without saving and configure availability later.
      </p>
    </div>
  );
}
