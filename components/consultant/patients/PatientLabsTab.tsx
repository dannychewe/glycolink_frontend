"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FlaskConical,
} from "lucide-react";
import {
  REVIEW_LAB_RESULTS_MUTATION,
  CLOSE_LAB_ORDER_MUTATION,
} from "@/lib/consultant/labs-graphql";
import type {
  WorkspaceLabOrder,
  WorkspaceLabResult,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(
  status: string | null,
): "success" | "warning" | "danger" | "secondary" | "primary" {
  const s = (status ?? "").toLowerCase();
  if (["reviewed", "closed"].includes(s)) return "success";
  if (s === "result_uploaded") return "primary";
  if (["ordered", "sample_collected"].includes(s)) return "warning";
  if (s === "cancelled") return "danger";
  return "secondary";
}

function flagVariant(
  flag: string | null | undefined,
): "success" | "warning" | "danger" | "secondary" {
  const f = (flag ?? "").toLowerCase();
  if (f.includes("critical")) return "danger";
  if (f.includes("high") || f.includes("low") || f.includes("abnormal"))
    return "warning";
  if (f.includes("normal")) return "success";
  return "secondary";
}

function canReview(status: string | null) {
  return (status ?? "").toLowerCase() === "result_uploaded";
}

function canClose(status: string | null) {
  return (status ?? "").toLowerCase() === "reviewed";
}

function ReviewModal({
  order,
  onClose,
  onReviewed,
}: {
  order: WorkspaceLabOrder;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [review, { loading }] = useMutation(REVIEW_LAB_RESULTS_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !notes.trim()) return;
    setError(null);
    try {
      await review({
        variables: { labOrderId: order.id, notes: notes.trim() },
      });
      onReviewed();
      onClose();
    } catch {
      setError("Unable to review this lab order. Please try again.");
    }
  }

  const allResults = order.tests.flatMap((t) =>
    t.results.map((r) => ({ ...r, testName: t.testName })),
  );

  return (
    <DetailModal
      title="Review lab results"
      className="sm:max-w-lg"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="review-lab-form"
            size="sm"
            disabled={loading || !notes.trim()}
          >
            <CheckCircle2 className="size-4" />
            {loading ? "Submitting..." : "Submit review"}
          </Button>
        </div>
      }
    >
      <form
        id="review-lab-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        {allResults.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Results
            </p>
            <ul className="divide-y divide-border border border-border">
              {allResults.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-text">{r.testName}</span>
                  <span className="text-muted">
                    {r.valueText ??
                      (r.valueNumeric != null
                        ? `${r.valueNumeric} ${r.unit ?? ""}`
                        : "--")}
                    {r.referenceRange ? (
                      <span className="ml-2 text-xs">
                        (ref: {r.referenceRange})
                      </span>
                    ) : null}
                  </span>
                  {r.flag ? (
                    <Badge variant={flagVariant(r.flag)}>
                      {titleCase(r.flag)}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="review-notes">
            Review notes <span className="text-danger">*</span>
          </Label>
          <textarea
            id="review-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Clinical interpretation of results..."
            disabled={loading}
            rows={3}
            className="flex w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text shadow-soft outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
      </form>
    </DetailModal>
  );
}

function LabOrderCard({
  order,
  onReview,
  onClose,
  defaultExpanded,
}: {
  order: WorkspaceLabOrder;
  onReview: () => void;
  onClose: () => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const hasResults = order.tests.some((t) => t.results.length > 0);
  const abnormalCount = order.tests
    .flatMap((t) => t.results)
    .filter((r) => {
      const f = (r.flag ?? "").toLowerCase();
      return f && f !== "normal";
    }).length;

  return (
    <div className="border border-border">
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-primary/5"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted" />
        ) : (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              Lab order — {formatDate(order.orderedAt)}
            </span>
            <Badge
              className="rounded-md tracking-normal"
              variant={statusVariant(order.status)}
            >
              {titleCase(order.status)}
            </Badge>
            {abnormalCount > 0 ? (
              <Badge className="rounded-md tracking-normal" variant="warning">
                {abnormalCount} abnormal
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted">
            {order.tests.length} test{order.tests.length !== 1 ? "s" : ""}
            {hasResults ? " · Results available" : " · Awaiting results"}
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {canReview(order.status) ? (
            <Button type="button" size="sm" onClick={onReview}>
              <ClipboardList className="size-4" />
              Review
            </Button>
          ) : canClose(order.status) ? (
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              <CheckCircle2 className="size-4" />
              Close
            </Button>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border px-4 py-4">
          {order.tests.map((test) => (
            <div key={test.id} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text">{test.testName}</p>
                {test.priority &&
                test.priority.toLowerCase() !== "routine" ? (
                  <Badge className="rounded-md text-[10px]" variant="warning">
                    {titleCase(test.priority)}
                  </Badge>
                ) : null}
              </div>
              {test.results.length > 0 ? (
                <ul className="divide-y divide-border border border-border">
                  {test.results.map((result) => (
                    <li
                      key={result.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span className="tabular-nums text-text">
                        {result.valueText ??
                          (result.valueNumeric != null
                            ? `${result.valueNumeric} ${result.unit ?? ""}`
                            : "--")}
                      </span>
                      {result.referenceRange ? (
                        <span className="text-xs text-muted">
                          Ref: {result.referenceRange}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted">
                        {formatDate(result.resultedAt)}
                      </span>
                      {result.flag ? (
                        <Badge
                          className="rounded-md tracking-normal"
                          variant={flagVariant(result.flag)}
                        >
                          {titleCase(result.flag)}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">Awaiting results</p>
              )}
            </div>
          ))}

          {order.reviewNotes.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Review notes
              </p>
              {order.reviewNotes.map((note) => (
                <div key={note.id} className="border border-border p-3">
                  <p className="whitespace-pre-wrap break-words text-sm text-text">
                    {note.note}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(note.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PatientLabsTab({
  labOrders,
  labResults,
  onChanged,
}: Readonly<{
  labOrders: WorkspaceLabOrder[];
  labResults: WorkspaceLabResult[];
  onChanged: () => void;
}>) {
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState<WorkspaceLabOrder | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeOrder, { loading: closingLoading }] = useMutation(
    CLOSE_LAB_ORDER_MUTATION,
  );

  async function handleClose(orderId: string) {
    setCloseError(null);
    setClosingId(orderId);
    try {
      await closeOrder({ variables: { labOrderId: orderId } });
      onChanged();
    } catch {
      setCloseError("Unable to close this lab order.");
    } finally {
      setClosingId(null);
    }
  }

  const visible = labOrders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "needs_review")
      return (o.status ?? "").toLowerCase() === "result_uploaded";
    return (o.status ?? "").toLowerCase() === filter;
  });

  const needsReviewCount = labOrders.filter(
    (o) => (o.status ?? "").toLowerCase() === "result_uploaded",
  ).length;

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <FlaskConical className="size-4 text-primary" />
          Labs
          <span className="text-xs font-medium tabular-nums text-muted">
            {labOrders.length} orders
          </span>
        </h2>
        <Select
          aria-label="Filter lab orders"
          className="w-48"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          options={[
            { value: "all", label: `All (${labOrders.length})` },
            ...(needsReviewCount
              ? [
                  {
                    value: "needs_review",
                    label: `Needs review (${needsReviewCount})`,
                  },
                ]
              : []),
          ]}
        />
      </header>

      {closeError ? (
        <p role="alert" className="text-sm text-danger">
          {closeError}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted">
          No lab orders match this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((order, i) => (
            <LabOrderCard
              key={order.id}
              order={order}
              defaultExpanded={i === 0}
              onReview={() => setReviewing(order)}
              onClose={() => void handleClose(order.id)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        New lab orders are created during an encounter consultation.
      </p>

      {reviewing ? (
        <ReviewModal
          order={reviewing}
          onClose={() => setReviewing(null)}
          onReviewed={onChanged}
        />
      ) : null}
    </div>
  );
}
