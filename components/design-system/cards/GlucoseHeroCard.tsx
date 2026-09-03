import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { StatusBadge } from "../status/StatusBadge";
import { glucoseStatusKey, type StatusKey } from "../status/status.config";
import { cn } from "@/lib/utils/cn";

type GlucoseBar = {
  label: string;
  average: number | null;
  status: string | null;
  readingCount: number;
};

export type GlucoseHeroCardProps = {
  /** e.g. "mmol/L · 7-day average" or just the unit — shown as the eyebrow label. */
  eyebrow: string;
  /** The one big tabular number this card exists to show. */
  value: number | null;
  valueCaption: string;
  status: StatusKey;
  /** A second headline stat next to the main value (e.g. Time in Range). */
  secondaryStat?: { value: ReactNode; label: string };
  /** Optional trend bars (e.g. a week of daily averages). */
  bars?: GlucoseBar[];
  /** Small text under everything — a count, a timestamp, a link. */
  footer?: ReactNode;
  /** A primary action rendered next to the status badge (e.g. "Log reading"). */
  action?: ReactNode;
  className?: string;
};

/**
 * The one bold "am I okay?" glucose card — docs/02 §1/§12 (Dashboard + Monitoring
 * both need this as their #1 element). Built once, reused by both screens instead
 * of each hand-rolling its own dark hero card.
 */
export function GlucoseHeroCard({
  eyebrow,
  value,
  valueCaption,
  status,
  secondaryStat,
  bars,
  footer,
  action,
  className,
}: GlucoseHeroCardProps) {
  const maxAvg = bars ? Math.max(...bars.map((b) => b.average ?? 0), 1) : 1;

  return (
    <div className={cn("rounded-lg border border-primary-800 bg-primary-700 px-6 py-6 sm:px-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
          <Activity className="size-4" />
          {eyebrow}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <StatusBadge status={status} className="border-white/25 bg-white/10 text-white" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-5">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold leading-none tabular-nums text-white">
            {value != null ? Number(value).toFixed(1) : "—"}
          </span>
          <span className="text-base text-white/60">{valueCaption}</span>
        </div>

        {secondaryStat ? (
          <>
            <div className="hidden h-12 w-px bg-white/15 sm:block" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold tabular-nums text-white">{secondaryStat.value}</span>
              <span className="text-xs text-white/60">{secondaryStat.label}</span>
            </div>
          </>
        ) : null}

        {bars && bars.length > 0 ? (
          <div className="flex flex-1 items-end gap-1.5" style={{ minWidth: 180, height: 56 }}>
            {bars.map((bar, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  title={`${bar.label}: ${bar.average != null ? Number(bar.average).toFixed(1) : "no readings"}`}
                  className={cn(
                    "w-full rounded-sm",
                    glucoseStatusKey(bar.status) === "LOW"
                      ? "bg-danger"
                      : glucoseStatusKey(bar.status) === "HIGH"
                        ? "bg-warning"
                        : "bg-white/70",
                    bar.readingCount === 0 ? "opacity-20" : "opacity-90",
                  )}
                  style={{ height: `${Math.max(4, Math.round(((bar.average ?? 0) / maxAvg) * 44))}px` }}
                />
                <span className="text-[10px] text-white/45">{bar.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-4 text-xs text-white/55">{footer}</div> : null}
    </div>
  );
}
