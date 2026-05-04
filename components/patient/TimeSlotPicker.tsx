"use client";

import { cn } from "@/lib/utils/cn";

type TimeSlotPickerProps = Readonly<{
  slots: Array<{ value: string; label: string }>;
  selectedTime?: string;
  onSelectTime: (time: string) => void;
}>;

export function TimeSlotPicker({
  slots,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6">
        <p>No appointment times are available for the selected date.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.value;

        return (
          <button
            key={slot.value}
            type="button"
            onClick={() => onSelectTime(slot.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium text-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isSelected
                ? "border-primary bg-primary text-white shadow-soft"
                : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
            )}
            aria-pressed={isSelected}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
