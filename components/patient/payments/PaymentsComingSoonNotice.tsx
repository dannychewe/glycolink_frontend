import { Clock, Wallet } from "lucide-react";

type PaymentsComingSoonNoticeProps = Readonly<{
  className?: string;
}>;

export function PaymentsComingSoonNotice({ className }: PaymentsComingSoonNoticeProps) {
  return (
    <div
      className={`rounded-2xl border border-warning/30 bg-warning/5 p-5 sm:p-6 ${className ?? ""}`}
      role="status"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <Wallet className="size-5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-text">Online payments coming soon</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              <Clock className="size-3" />
              Soon
            </span>
          </div>
          <p className="text-sm leading-6 text-muted">
            We&apos;re still finalising in-app payments. For now, your consultation fee is arranged
            directly with your provider or clinic. You&apos;ll be able to pay securely here once
            online payments go live.
          </p>
        </div>
      </div>
    </div>
  );
}
