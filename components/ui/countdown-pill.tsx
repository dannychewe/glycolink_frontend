import { AlarmClock, Clock } from "lucide-react";
import type { CountdownState } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils/cn";

type CountdownPillProps = Readonly<{
  countdown: CountdownState;
  /** Short label shown before the timer, e.g. "Ends in". */
  label?: string;
  /** Use the dark-surface palette (for overlaying the video stage). */
  onDark?: boolean;
  className?: string;
}>;

/**
 * Compact live timer chip. Escalates from neutral → amber (warning) → red
 * (critical) as the countdown approaches zero.
 */
export function CountdownPill({
  countdown,
  label = "Ends in",
  onDark = false,
  className,
}: CountdownPillProps) {
  const { label: time, isExpired, isWarning, isCritical } = countdown;
  const Icon = isWarning || isCritical ? AlarmClock : Clock;

  const tone = isExpired
    ? onDark
      ? "border-white/20 bg-white/10 text-white/70"
      : "border-border bg-slate-100 text-muted"
    : isCritical
      ? "border-danger/40 bg-danger/10 text-danger"
      : isWarning
        ? "border-warning/40 bg-warning/10 text-warning"
        : onDark
          ? "border-white/20 bg-white/10 text-white"
          : "border-border bg-surface text-text";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
        tone,
        isCritical && !isExpired && "animate-pulse",
        className,
      )}
      role="timer"
      aria-live={isWarning ? "assertive" : "off"}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {isExpired ? (
        <span>Time ended</span>
      ) : (
        <>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wide opacity-70">
            {label}
          </span>
          <span>{time}</span>
        </>
      )}
    </span>
  );
}
