import { CheckCircle2, Circle, Clock, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { STATUS_CONFIG, type StatusKey, type StatusStyle, type StatusTone } from "./status.config";

// Never color alone: an ad hoc `tone`+`label` badge (no `status`/`icon` given)
// still needs an icon. These are the sane defaults per tone.
const defaultToneIcon: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  info: Clock,
  neutral: Circle,
};

type StatusBadgeProps = {
  /** Locked domain status — pulls tone/style/icon/label from status.config.ts. */
  status?: StatusKey;
  /** Escape hatch for a status not yet in the locked config. Prefer `status`. */
  tone?: StatusTone;
  label?: string;
  icon?: LucideIcon;
  style?: StatusStyle;
  size?: "sm" | "md";
  className?: string;
};

const toneSoftClass: Record<StatusTone, string> = {
  success: "bg-success/10 border-success/30 text-success",
  warning: "bg-warning/15 border-warning/40 text-warning",
  danger: "bg-danger/10 border-danger/30 text-danger",
  info: "bg-info/10 border-info/30 text-info",
  neutral: "bg-border/40 border-border text-muted",
};

const toneSolidClass: Record<StatusTone, string> = {
  success: "bg-success border-success text-white",
  warning: "bg-warning border-warning text-white",
  danger: "bg-danger border-danger text-white",
  info: "bg-info border-info text-white",
  neutral: "bg-muted border-muted text-white",
};

const toneOutlineClass: Record<StatusTone, string> = {
  success: "bg-surface border-success/40 text-success",
  warning: "bg-surface border-warning/50 text-warning",
  danger: "bg-surface border-danger/40 text-danger",
  info: "bg-surface border-info/40 text-info",
  neutral: "bg-surface border-border-strong text-muted",
};

/**
 * The one badge every status renders through — docs/03-design-system.md §5.
 * Never color alone: always icon + text. Critical is always forced to `solid`.
 */
export function StatusBadge({
  status,
  tone: toneOverride,
  label: labelOverride,
  icon: IconOverride,
  style: styleOverride,
  size = "md",
  className,
}: StatusBadgeProps) {
  const fromConfig = status ? STATUS_CONFIG[status] : undefined;

  const tone = toneOverride ?? fromConfig?.tone ?? "neutral";
  const label = labelOverride ?? fromConfig?.label ?? status ?? "Unknown";
  const Icon = IconOverride ?? fromConfig?.icon ?? defaultToneIcon[tone];
  // Critical is never soft — lock the solid weight regardless of caller intent.
  const resolvedStyle: StatusStyle =
    status === "CRITICAL" ? "solid" : (styleOverride ?? fromConfig?.style ?? "soft");

  const toneClass =
    resolvedStyle === "solid"
      ? toneSolidClass[tone]
      : resolvedStyle === "outline"
        ? toneOutlineClass[tone]
        : toneSoftClass[tone];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClass,
        className,
      )}
    >
      {Icon ? <Icon className={size === "sm" ? "size-3" : "size-3.5"} /> : null}
      {label}
    </span>
  );
}
