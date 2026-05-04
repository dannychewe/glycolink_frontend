"use client";

import { cn } from "@/lib/utils/cn";

type DetailModalProps = Readonly<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  className?: string;
}>;

export function DetailModal({
  title,
  subtitle,
  children,
  onClose,
  footer,
  className,
}: DetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex h-[92vh] w-full flex-col rounded-t-[1.5rem] bg-surface shadow-subtle sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-[1.5rem]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 id="detail-modal-title" className="text-lg font-semibold text-text">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
