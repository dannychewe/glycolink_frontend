import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "primary" | "danger" | "warning" | "success";

/** Flat, bordered surface — the building block for every dashboard section. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}
      {...props}
    />
  );
}

/** Header row with a hairline divider beneath it. */
export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}

const countToneClass: Record<Tone, string> = {
  neutral: "border-border bg-background text-muted",
  primary: "border-primary/30 bg-primary/10 text-primary",
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/15 text-warning",
  success: "border-success/30 bg-success/10 text-success",
};

export function PanelTitle({
  icon: Icon,
  children,
  count,
  countTone = "neutral",
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  count?: number;
  countTone?: Tone;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon ? <Icon className="size-4 shrink-0 text-muted" /> : null}
      <h2 className="truncate text-lg font-semibold text-ink">{children}</h2>
      {count != null && count > 0 ? (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
            countToneClass[countTone],
          )}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}

export function ViewAllLink({
  href,
  children = "View all",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/** Stacked rows separated by hairlines — the structured alternative to floating cards. */
export function PanelList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("divide-y divide-border", className)} {...props} />;
}

export function PanelEmpty({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-10 text-center text-base text-muted", className)} {...props}>
      {children}
    </div>
  );
}

const valueToneClass: Record<Tone, string> = {
  neutral: "text-ink",
  primary: "text-primary",
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
};

const tintSurfaceClass: Record<Tone, string> = {
  neutral: "border-border bg-surface",
  primary: "border-primary/30 bg-primary/5",
  danger: "border-danger/30 bg-danger/5",
  warning: "border-warning/30 bg-warning/5",
  success: "border-success/30 bg-success/5",
};

const tintLabelClass: Record<Tone, string> = {
  neutral: "text-muted",
  primary: "text-primary",
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
};

/**
 * Single KPI metric, bordered and flat. Pass `tint` to fill the tile's own
 * background/border/label from `tone` — the bold, decisive treatment for a KPI
 * that needs attention (non-zero due/overdue counts), not a default look.
 */
export function StatTile({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "neutral",
  tint = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: LucideIcon;
  tone?: Tone;
  tint?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tint ? tintSurfaceClass[tone] : "border-border bg-surface",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "truncate text-[13px] font-medium uppercase tracking-wider",
            tint ? tintLabelClass[tone] : "text-muted",
          )}
        >
          {label}
        </p>
        {Icon ? (
          <Icon className={cn("size-4 shrink-0", tint ? tintLabelClass[tone] : "text-muted")} />
        ) : null}
      </div>
      <p className={cn("mt-2 text-3xl font-semibold leading-none tabular-nums", valueToneClass[tone])}>
        {value}
      </p>
      {sublabel ? <p className="mt-1.5 text-sm text-muted">{sublabel}</p> : null}
    </div>
  );
}
