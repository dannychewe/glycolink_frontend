"use client";

import { Button } from "@/components/ui/button";

type AppointmentActionModalProps = Readonly<{
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  showFooterActions?: boolean;
}>;

export function AppointmentActionModal({
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Close",
  isLoading = false,
  onConfirm,
  onClose,
  showFooterActions = true,
}: AppointmentActionModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-action-modal-title"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.5rem] bg-surface"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <h2
            id="appointment-action-modal-title"
            className="text-lg font-semibold text-text"
          >
            {title}
          </h2>
        </div>
        <div className="space-y-5 px-5 py-5">
          {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
          {children}
          {showFooterActions ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button type="button" onClick={onConfirm} disabled={isLoading}>
                {isLoading ? "Please wait..." : confirmLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
