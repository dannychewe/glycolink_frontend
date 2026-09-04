"use client";

import { cn } from "@/lib/utils/cn";

type BookingCalendarProps = Readonly<{
  dates: string[];
  selectedDate?: string;
  onSelectDate: (date: string) => void;
}>;

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function BookingCalendar({
  dates,
  selectedDate,
  onSelectDate,
}: BookingCalendarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {dates.map((date) => {
        const isSelected = selectedDate === date;

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={cn(
              "rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
              isSelected ? "border-primary bg-primary/10" : "",
            )}
            aria-pressed={isSelected}
            aria-label={`Select ${formatDateLabel(date)}`}
          >
            <p className="text-base font-semibold text-text">{formatDateLabel(date)}</p>
            {/* Whether this date actually has open slots is only known once
                selected — there's no bulk per-date availability query yet, so
                this never claims availability it hasn't verified. */}
            <p className="mt-1 text-sm text-muted">Tap to see available times</p>
          </button>
        );
      })}
    </div>
  );
}
