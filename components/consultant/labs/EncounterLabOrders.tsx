"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Plus, Trash2, CheckCircle, AlertCircle, FlaskConical } from "lucide-react";
import {
  CREATE_LAB_ORDER_MUTATION,
  LAB_ORDERS_BY_ENCOUNTER_QUERY,
  LAB_PRIORITY_OPTIONS,
  LAB_TEST_SUGGESTIONS,
} from "@/lib/consultant/labs-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────

type LabTestResult = {
  id: string;
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
  flag: string | null;
  resultedAt: string;
};

type LabTest = {
  id: string;
  testName: string;
  priority: string;
  results: LabTestResult[];
};

type LabOrder = {
  id: string;
  status: string;
  orderedAt: string;
  patientId: string;
  tests: LabTest[];
};

type TestInput = { testName: string; priority: string };
type AlertState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusVariant(status: string): "success" | "warning" | "primary" | "secondary" {
  const s = status.toUpperCase();
  if (s === "CLOSED" || s === "REVIEWED") return "success";
  if (s === "RESULT_UPLOADED") return "warning";
  if (s === "ORDERED" || s === "SAMPLE_COLLECTED") return "primary";
  return "secondary";
}

function flagVariant(flag: string | null): "danger" | "warning" | "success" | "secondary" {
  if (!flag) return "secondary";
  const f = flag.toUpperCase();
  if (f === "CRITICAL" || f === "PANIC") return "danger";
  if (f === "HIGH" || f === "LOW" || f === "ABNORMAL") return "warning";
  if (f === "NORMAL") return "success";
  return "secondary";
}

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

// ─── Existing Orders ──────────────────────────────────────

function LabOrderRow({ order }: { order: LabOrder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-text">
            Order · {order.tests.length} test{order.tests.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted">Ordered {formatDate(order.orderedAt)}</p>
        </div>
        <Badge variant={statusVariant(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          {order.tests.map((test) => (
            <div key={test.id} className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text">{test.testName}</p>
                <span className="text-xs text-muted capitalize">{test.priority.toLowerCase()}</span>
              </div>
              {test.results.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {test.results.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-text">
                        {r.valueNumeric != null ? r.valueNumeric : r.valueText ?? "—"}
                        {r.unit ? ` ${r.unit}` : ""}
                      </span>
                      {r.flag ? <Badge variant={flagVariant(r.flag)}>{r.flag}</Badge> : null}
                      <span className="text-xs text-muted">{formatDate(r.resultedAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted italic">Awaiting result</p>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Create Order Form ────────────────────────────────────

function CreateLabOrderForm({
  encounterId,
  onCreated,
}: {
  encounterId: string;
  onCreated: () => void;
}) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [tests, setTests] = useState<TestInput[]>([{ testName: "", priority: "ROUTINE" }]);
  const [createLabOrder, { loading }] = useMutation(CREATE_LAB_ORDER_MUTATION);

  function addTest() {
    setTests((p) => [...p, { testName: "", priority: "ROUTINE" }]);
  }

  function removeTest(idx: number) {
    setTests((p) => p.filter((_, i) => i !== idx));
  }

  function updateTest(idx: number, field: keyof TestInput, value: string) {
    setTests((p) => p.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validTests = tests.filter((t) => t.testName.trim());
    if (validTests.length === 0) {
      setAlert({ type: "error", message: "Add at least one test." });
      return;
    }
    setAlert(null);
    try {
      await createLabOrder({
        variables: {
          encounterId,
          tests: validTests.map((t) => ({ testName: t.testName.trim(), priority: t.priority })),
        },
        refetchQueries: [
          { query: LAB_ORDERS_BY_ENCOUNTER_QUERY, variables: { encounterId } },
        ],
      });
      setTests([{ testName: "", priority: "ROUTINE" }]);
      setAlert({ type: "success", message: "Lab order created." });
      setTimeout(onCreated, 1000);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to create lab order.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-text">New Lab Order</p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <div className="space-y-2">
        {tests.map((test, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                list={`lab-suggestions-${idx}`}
                placeholder="Test name (e.g. HbA1c)"
                value={test.testName}
                onChange={(e) => updateTest(idx, "testName", e.target.value)}
              />
              <datalist id={`lab-suggestions-${idx}`}>
                {LAB_TEST_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <select
              value={test.priority}
              onChange={(e) => updateTest(idx, "priority", e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {LAB_PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {tests.length > 1 ? (
              <button
                type="button"
                onClick={() => removeTest(idx)}
                className="rounded-lg p-2 text-muted hover:text-danger transition"
                aria-label="Remove test"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addTest}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="size-4" />
          Add test
        </button>
      </div>

      <Button type="submit" variant="primary" size="sm" disabled={loading}>
        {loading ? "Creating..." : "Create Lab Order"}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────

export function EncounterLabOrders({
  encounterId,
  isFinalized,
}: {
  encounterId: string;
  isFinalized: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ labOrdersByEncounter: LabOrder[] }>(
    LAB_ORDERS_BY_ENCOUNTER_QUERY,
    { variables: { encounterId }, fetchPolicy: "network-only" },
  );

  const orders = data?.labOrdersByEncounter ?? [];

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-border/40" />
        <div className="h-16 animate-pulse rounded-xl bg-border/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load lab orders.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Existing orders */}
      {orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((order) => (
            <LabOrderRow key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted">
          <FlaskConical className="size-5 shrink-0 text-muted/50" />
          No lab orders for this encounter yet.
        </div>
      )}

      {/* Create form or prompt */}
      {isFinalized ? (
        showForm ? (
          <CreateLabOrderForm
            encounterId={encounterId}
            onCreated={() => { setShowForm(false); void refetch(); }}
          />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Order Labs
          </Button>
        )
      ) : (
        <p className="text-xs text-muted">
          Lab orders can only be created after the encounter is finalized.
        </p>
      )}
    </div>
  );
}
