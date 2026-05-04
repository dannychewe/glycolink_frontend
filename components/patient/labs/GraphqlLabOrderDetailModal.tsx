"use client";

import { useQuery } from "@apollo/client";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LAB_ORDER_DETAIL_QUERY } from "@/lib/patient/labs-graphql";

type LabResult = {
  id: string;
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
  resultedAt: string | null;
};

type LabTest = {
  id: string;
  testName: string;
  priority: string | null;
  results: LabResult[];
};

type LabOrderDetail = {
  id: string;
  status: string;
  orderedAt: string | null;
  encounterId: string | null;
  providerId: string | null;
  tests: LabTest[];
};

type GraphqlLabOrderDetailModalProps = Readonly<{
  labOrderId: string;
  onClose: () => void;
}>;

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", { month: "long", day: "numeric", year: "numeric" });
}

function formatResultValue(result: LabResult) {
  if (result.valueNumeric !== null && result.valueNumeric !== undefined) {
    return `${result.valueNumeric}${result.unit ? ` ${result.unit}` : ""}`;
  }
  if (result.valueText) return result.valueText;
  return "Pending";
}

function getFlagVariant(flag: string | null): "success" | "warning" | "danger" | "secondary" {
  if (!flag) return "secondary";
  const f = flag.trim().toUpperCase();
  if (f === "NORMAL" || f === "N") return "success";
  if (f === "CRITICAL" || f === "CRITICAL_HIGH" || f === "CRITICAL_LOW") return "danger";
  if (f === "HIGH" || f === "H" || f === "LOW" || f === "L") return "warning";
  return "secondary";
}

function formatFlag(flag: string | null) {
  if (!flag) return "Pending";
  const f = flag.trim().toUpperCase();
  if (f === "N") return "Normal";
  if (f === "H") return "High";
  if (f === "L") return "Low";
  if (f === "CRITICAL_HIGH") return "Critical High";
  if (f === "CRITICAL_LOW") return "Critical Low";
  return f.charAt(0) + f.slice(1).toLowerCase();
}

function formatOrderStatus(status: string) {
  const s = status.trim().toUpperCase().replace(/_/g, " ");
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function getOrderStatusVariant(status: string): "success" | "primary" | "warning" | "secondary" {
  const s = status.trim().toUpperCase();
  if (s === "REVIEWED" || s === "CLOSED") return "success";
  if (s === "RESULT_READY") return "primary";
  if (s === "SAMPLE_COLLECTED") return "warning";
  return "secondary";
}

export function GraphqlLabOrderDetailModal({
  labOrderId,
  onClose,
}: GraphqlLabOrderDetailModalProps) {
  const { data, loading, error } = useQuery<{ labOrderDetail: LabOrderDetail | null }>(
    LAB_ORDER_DETAIL_QUERY,
    { variables: { labOrderId }, fetchPolicy: "cache-first" },
  );

  const order = data?.labOrderDetail;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-order-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] bg-surface shadow-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2 id="lab-order-modal-title" className="text-xl font-semibold text-text">
              Lab Order Details
            </h2>
            {order ? (
              <div className="flex items-center gap-2">
                <Badge variant={getOrderStatusVariant(order.status)}>
                  {formatOrderStatus(order.status)}
                </Badge>
                <span className="text-sm text-muted">Ordered {formatDate(order.orderedAt)}</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:bg-slate-50"
            aria-label="Close lab order details"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-warning">Unable to load order details.</p>
          ) : !order ? (
            <p className="text-sm text-muted">Order not found.</p>
          ) : order.tests.length === 0 ? (
            <p className="text-sm text-muted">No tests in this order.</p>
          ) : (
            <div className="space-y-3">
              {order.tests.map((test) => {
                const latestResult = test.results.length > 0 ? test.results[0] : null;
                return (
                  <div
                    key={test.id}
                    className="rounded-xl border border-border/70 bg-background px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text">{test.testName}</p>
                        {test.priority ? (
                          <p className="text-xs text-muted">Priority: {test.priority}</p>
                        ) : null}
                      </div>
                      {latestResult?.flag ? (
                        <Badge variant={getFlagVariant(latestResult.flag)}>
                          {formatFlag(latestResult.flag)}
                        </Badge>
                      ) : null}
                    </div>

                    {latestResult ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted">Result</p>
                          <p className="text-base font-semibold text-text">
                            {formatResultValue(latestResult)}
                          </p>
                        </div>
                        {latestResult.referenceRange ? (
                          <div>
                            <p className="text-xs text-muted">Reference range</p>
                            <p className="text-sm text-text">{latestResult.referenceRange}</p>
                          </div>
                        ) : null}
                        {latestResult.resultedAt ? (
                          <div>
                            <p className="text-xs text-muted">Resulted</p>
                            <p className="text-sm text-text">{formatDate(latestResult.resultedAt)}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">No result yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
