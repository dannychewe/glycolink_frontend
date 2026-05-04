import { Activity } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type HealthSummarySectionProps = Readonly<{
  recentReadings: number[];
}>;

function getGlucoseStatus(avg: number) {
  if (avg < 70) return "Low";
  if (avg > 180) return "Elevated";
  return "Stable";
}

export function HealthSummarySection({ recentReadings }: HealthSummarySectionProps) {
  const avg = Math.round(recentReadings.reduce((a, b) => a + b, 0) / recentReadings.length);
  const highest = Math.max(...recentReadings);
  const lowest = Math.min(...recentReadings);
  const inRange = recentReadings.filter((r) => r >= 70 && r <= 180).length;
  const status = getGlucoseStatus(avg);
  const chartReadings = [...recentReadings].reverse();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Health Summary</h2>

      <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-5 text-white shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Activity className="size-4" />
            Recent glucose readings
          </div>
          <div className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90">
            {status}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <p className="text-4xl font-semibold">{avg}</p>
          <p className="text-sm text-white/70">avg mg/dL</p>
        </div>

        <div className="mt-5 flex items-end gap-2">
          {chartReadings.map((reading, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-full rounded-sm",
                  reading < 70
                    ? "bg-danger/70"
                    : reading > 180
                      ? "bg-warning/80"
                      : "bg-white/35",
                )}
                style={{ height: `${Math.max(6, Math.round((reading / 220) * 52))}px` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-danger/70" />
            Low (&lt;70)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-white/35" />
            In range
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-warning/80" />
            High (&gt;180)
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Highest</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">{highest}</p>
          <p className="text-xs text-muted">mg/dL</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Lowest</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">{lowest}</p>
          <p className="text-xs text-muted">mg/dL</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">In range</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">
            {inRange}/{recentReadings.length}
          </p>
          <p className="text-xs text-muted">readings</p>
        </div>
      </div>
    </section>
  );
}
