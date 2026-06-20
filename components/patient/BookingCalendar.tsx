"use client";

import { cn } from "@/lib/utils/cn";

type BookingCalendarProps = Readonly<{
  dates: { date: string; hasSlots: boolean }[];
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
      {dates.map(({ date, hasSlots }) => {
        const isSelected = selectedDate === date;

        return (
          <button
            key={date}
            type="button"
            disabled={!hasSlots}
            onClick={() => onSelectDate(date)}
            className={cn(
              "rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              hasSlots
                ? "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                : "cursor-not-allowed border-border/60 bg-slate-100 text-muted opacity-70",
              isSelected ? "border-primary bg-primary/10" : "",
            )}
            aria-pressed={isSelected}
            aria-label={`Select ${formatDateLabel(date)}`}
          >
            <p className="text-sm font-semibold text-text">{formatDateLabel(date)}</p>
            <p className="mt-1 text-sm text-muted">
              {hasSlots ? "Appointments available" : "No slots available"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
