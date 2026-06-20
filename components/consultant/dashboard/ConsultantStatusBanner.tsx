"use client";

import { useQuery } from "@apollo/client";
import { ShieldAlert, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROVIDER_STATUS_SUMMARY_QUERY } from "@/lib/consultant/provider-lifecycle-graphql";

type ExpiryWarning = {
  type: string;
  label: string;
  status: string;
  expiryDate: string | null;
  daysRemaining: number | null;
  currentStatus: string;
};

type StatusSummaryData = {
  providerStatusSummary: {
    status: string;
    isApproved: boolean;
    isSuspended: boolean;
    verificationStatus: string;
    suspensionReason: string | null;
    expiryWarnings: ExpiryWarning[];
  };
};

function ExpiryWarningRow({ warning }: { warning: ExpiryWarning }) {
  const isExpired = warning.status === "EXPIRED";
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${isExpired ? "border-danger/30 bg-danger/5 text-danger" : "border-warning/30 bg-warning/5 text-warning"}`}>
      <Clock className="size-3.5 shrink-0" />
      <span className="font-medium">{warning.label}</span>
      {warning.daysRemaining != null ? (
        <span className="text-xs opacity-80">
          — {isExpired ? "expired" : `${warning.daysRemaining}d remaining`}
        </span>
      ) : null}
    </div>
  );
}

export function ConsultantStatusBanner() {
  const { data, loading } = useQuery<StatusSummaryData>(PROVIDER_STATUS_SUMMARY_QUERY, {
    variables: { warningWindowDays: 60 },
    fetchPolicy: "network-only",
  });

  if (loading || !data) return null;

  const summary = data.providerStatusSummary;
  const criticalWarnings = (summary.expiryWarnings ?? []).filter(
    (w) => w.status === "EXPIRING_SOON" || w.status === "EXPIRED",
  );

  if (summary.isApproved && criticalWarnings.length === 0) return null;

  const isSuspended = summary.isSuspended;
  const isPending = !summary.isApproved && !isSuspended;

  return (
    <div
      className={`rounded-lg border border-l-4 bg-surface px-5 py-5 ${
        isSuspended ? "border-l-danger" : "border-l-warning"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border ${
              isSuspended ? "border-danger/30 text-danger" : "border-warning/30 text-warning"
            }`}
          >
            <ShieldAlert className="size-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text">
              {isSuspended
                ? "Your account has been suspended"
                : isPending
                  ? "Your account is under review"
                  : "Action required on your account"}
            </p>
            <p className="text-sm text-muted">
              {isSuspended
                ? summary.suspensionReason
                  ? `Reason: ${summary.suspensionReason}. Contact platform support to restore access.`
                  : "Please contact platform support to restore access to patient care workflows."
                : isPending
                  ? "You can review your dashboard, but access to clinical actions remains limited until approval is complete."
                  : "Some credentials require attention before they affect your account standing."}
            </p>

            {criticalWarnings.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {criticalWarnings.map((w) => (
                  <ExpiryWarningRow key={w.type} warning={w} />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Badge variant={isSuspended ? "danger" : "warning"}>
            {summary.status}
          </Badge>
          {(isPending || isSuspended) ? (
            <Button href="/consultant/profile" variant="secondary" size="sm">
              View Profile
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
