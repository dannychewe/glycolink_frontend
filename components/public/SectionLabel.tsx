import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionLabelProps = {
  index: string;
  children: ReactNode;
  className?: string;
};

/**
 * Clinical numbered section index — a mono figure, a measured rule, and a
 * spaced label. Reads like instrument labelling rather than a generic eyebrow.
 */
export function SectionLabel({ index, children, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-xs font-medium tabular-nums text-primary">{index}</span>
      <span className="h-px w-8 bg-primary/30" />
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted">
        {children}
      </span>
    </div>
  );
}
