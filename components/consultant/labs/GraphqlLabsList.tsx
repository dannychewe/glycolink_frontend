"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FlaskConical, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import {
  CLOSE_LAB_ORDER_MUTATION,
  PENDING_LAB_REVIEWS_QUERY,
  REVIEW_LAB_RESULTS_MUTATION,
} from "@/lib/consultant/labs-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────

type CriticalFlag = {
  id: string;
  severity: string;
  notifiedProviderAt: string | null;
  acknowledgedAt: string | null;
};

type LabResult = {
  id: string;
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
  resultedAt: string;
  criticalFlags: CriticalFlag[];
};

type LabTestResult = {
  testId: string;
  testName: string;
  result: LabResult | null;
};

type PendingLabReview = {
  patientName: string | null;
  labOrder: {
    id: string;
    status: string;
    orderedAt: string;
    encounterId: string | null;
    patientId: string;
  };
  results: LabTestResult[];
};

type AlertState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function flagVariant(flag: string | null): "danger" | "warning" | "success" | "secondary" {
  if (!flag) return "secondary";
  const f = flag.toUpperCase();
  if (f === "CRITICAL" || f === "PANIC") return "danger";
  if (f === "HIGH" || f === "LOW" || f === "ABNORMAL") return "warning";
  if (f === "NORMAL") return "success";
  return "secondary";
}

function formatValue(result: LabResult): string {
  if (result.valueNumeric != null) {
    return `${result.valueNumeric}${result.unit ? ` ${result.unit}` : ""}`;
  }
  if (result.valueText) return result.valueText;
  return "—";
}

// ─── Inline Alert ─────────────────────────────────────────

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Review Panel ─────────────────────────────────────────

function ReviewPanel({
  labOrderId,
  onDone,
}: {
  labOrderId: string;
  onDone: () => void;
}) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [notes, setNotes] = useState("");
  const [reviewLabResults, { loading }] = useMutation(REVIEW_LAB_RESULTS_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await reviewLabResults({
        variables: { labOrderId, notes },
        refetchQueries: [{ query: PENDING_LAB_REVIEWS_QUERY, variables: { limit: 50 } }],
      });
      setAlert({ type: "success", message: "Review notes saved." });
      setTimeout(onDone, 1200);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to save review notes.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3 rounded-lg border border-border bg-background px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Review Notes</p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <div className="space-y-1.5">
        <Label htmlFor={`review-notes-${labOrderId}`}>
          Clinical notes <span className="text-danger">*</span>
        </Label>
        <Textarea
          id={`review-notes-${labOrderId}`}
          rows={3}
          placeholder="Summarise findings, clinical impression, and any follow-up actions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "Saving..." : "Save Review"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Lab Order Card ───────────────────────────────────────

function LabOrderCard({ item, onRefetch: _onRefetch }: { item: PendingLabReview; onRefetch: () => void }) {
  const [showReview, setShowReview] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [closeAlert, setCloseAlert] = useState<AlertState>(null);
  const [closeLabOrder, { loading: closing }] = useMutation(CLOSE_LAB_ORDER_MUTATION);

  const hasCritical = item.results.some(
    (r) => r.result && ["CRITICAL", "PANIC"].includes((r.result.flag ?? "").toUpperCase()),
  );

  async function handleClose() {
    setCloseAlert(null);
    try {
      await closeLabOrder({
        variables: { labOrderId: item.labOrder.id },
        refetchQueries: [{ query: PENDING_LAB_REVIEWS_QUERY, variables: { limit: 50 } }],
      });
    } catch (error) {
      setCloseAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to close lab order.") });
    }
  }

  return (
    <div className={cn(
      "rounded-lg border-l-4 bg-surface",
      hasCritical ? "border-l-danger/70" : "border-l-warning/60",
    )}>
      <div className="px-5 py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-base font-semibold text-text">
              {item.patientName ?? `Patient ${item.labOrder.patientId.slice(0, 8)}…`}
            </p>
            <p className="text-xs text-muted">Ordered {formatDate(item.labOrder.orderedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasCritical ? <Badge variant="danger">Critical Flag</Badge> : null}
            <Badge variant="warning">Result Uploaded</Badge>
          </div>
        </div>

        {/* Results */}
        <div>
          <button
            type="button"
            onClick={() => setShowResults((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-text transition"
          >
            {showResults ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            {item.results.length} test{item.results.length !== 1 ? "s" : ""}
          </button>

          {showResults && item.results.length > 0 ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {item.results.map((r) => (
                <div key={r.testId} className="rounded-xl border border-border bg-background px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-text">{r.testName}</p>
                    {r.result?.flag ? (
                      <Badge variant={flagVariant(r.result.flag)}>{r.result.flag}</Badge>
                    ) : null}
                  </div>
                  {r.result ? (
                    <>
                      <p className="mt-1 text-lg font-semibold text-text">{formatValue(r.result)}</p>
                      {r.result.referenceRange ? (
                        <p className="text-xs text-muted">Ref: {r.result.referenceRange}</p>
                      ) : null}
                      {r.result.resultedAt ? (
                        <p className="text-xs text-muted">{formatDate(r.result.resultedAt)}</p>
                      ) : null}
                      {r.result.criticalFlags.length > 0 ? (
                        <p className="mt-1 text-xs text-danger font-medium">
                          ⚠ Critical — severity: {r.result.criticalFlags[0].severity}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted italic">No result yet</p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {closeAlert ? (
          <InlineAlert alert={closeAlert} onDismiss={() => setCloseAlert(null)} />
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowReview((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
              showReview
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-text hover:bg-surface",
            )}
          >
            {showReview ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            Add Review Notes
          </button>
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={closing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-text transition hover:bg-surface disabled:pointer-events-none disabled:opacity-50"
          >
            <CheckCircle className="size-3.5 text-success" />
            {closing ? "Closing..." : "Close Order"}
          </button>
          {item.labOrder.encounterId ? (
            <Button
              href={`/consultant/consultations/${item.labOrder.encounterId}`}
              variant="ghost"
              size="sm"
            >
              View Encounter
            </Button>
          ) : null}
        </div>

        {showReview ? (
          <ReviewPanel labOrderId={item.labOrder.id} onDone={() => setShowReview(false)} />
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function GraphqlLabsList() {
  const { data, loading, error, refetch } = useQuery<{ pendingLabReviews: PendingLabReview[] }>(
    PENDING_LAB_REVIEWS_QUERY,
    { variables: { limit: 50 }, fetchPolicy: "network-only" },
  );

  const items = data?.pendingLabReviews ?? [];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load lab reviews.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
        <FlaskConical className="size-8 text-muted/40" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text">No pending lab reviews</p>
          <p className="text-xs text-muted">Results will appear here once uploaded by the laboratory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length} order{items.length !== 1 ? "s" : ""} awaiting review
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-xs font-medium text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <LabOrderCard key={item.labOrder.id} item={item} onRefetch={() => void refetch()} />
        ))}
      </div>
    </div>
  );
}
