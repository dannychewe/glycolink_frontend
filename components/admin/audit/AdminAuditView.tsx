"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ADMIN_ACCESS_LOGS_QUERY,
  ADMIN_AUDIT_EVENTS_QUERY,
  ADMIN_AUDIT_STATUS_QUERY,
} from "@/lib/admin/graphql";
import { cn } from "@/lib/utils/cn";

const PAGE_LIMIT = 50;

type Tab = "status" | "events" | "logs";

type AuditEvent = {
  id: string;
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AccessLog = {
  id: string;
  actorUserId: string;
  patientId: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  accessedAt: string;
  createdAt: string;
};

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function truncate(value: string, max = 32) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function ErrorBanner({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
      <AlertCircle className="size-4 shrink-0 text-danger" />
      <p className="text-sm text-danger">{message}</p>
    </div>
  );
}

function SkeletonRows({ cols, rows = 6 }: Readonly<{ cols: number; rows?: number }>) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-border/50" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function PaginationBar({
  page,
  total,
  limit,
  onPrev,
  onNext,
}: Readonly<{
  page: number;
  total: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
}>) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
      <span>
        Page {page} of {totalPages} · {total.toLocaleString()} total
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface transition hover:border-primary/40 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface transition hover:border-primary/40 disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function AuditStatusPanel() {
  const { data, loading, error } = useQuery<{ auditStatus: string }>(
    ADMIN_AUDIT_STATUS_QUERY,
    { fetchPolicy: "network-only" },
  );

  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl bg-border/50" />;
  }
  if (error) {
    return <ErrorBanner message="Unable to load audit status." />;
  }

  const status = data?.auditStatus ?? "unknown";
  const isHealthy = status.toLowerCase() === "ok" || status.toLowerCase() === "healthy";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4">
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full",
        isHealthy ? "bg-success/15" : "bg-warning/15",
      )}>
        <ShieldCheck className={cn("size-5", isHealthy ? "text-success" : "text-warning")} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Audit Service</p>
        <p className={cn("text-lg font-semibold capitalize", isHealthy ? "text-success" : "text-warning")}>
          {status}
        </p>
      </div>
    </div>
  );
}

function AuditEventsPanel() {
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<{ auditEvents: PaginatedResult<AuditEvent> }>(
    ADMIN_AUDIT_EVENTS_QUERY,
    { variables: { page, limit: PAGE_LIMIT }, fetchPolicy: "cache-and-network" },
  );

  const result = data?.auditEvents;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;

  if (error) return <ErrorBanner message="Unable to load audit events." />;

  const cols = ["Actor", "Action", "Entity", "IP Address", "When"];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {cols.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <SkeletonRows cols={cols.length} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-4 py-12 text-center text-muted">
                  No audit events found.
                </td>
              </tr>
            ) : (
              items.map((event) => (
                <tr key={event.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{truncate(event.actorUserId, 20)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {event.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold text-text">{event.entityType}</span>
                    <span className="ml-1.5 font-mono text-muted">{truncate(event.entityId, 16)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{event.ipAddress ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDate(event.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={PAGE_LIMIT}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}

function AccessLogsPanel() {
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<{ accessLogs: PaginatedResult<AccessLog> }>(
    ADMIN_ACCESS_LOGS_QUERY,
    { variables: { page, limit: PAGE_LIMIT }, fetchPolicy: "cache-and-network" },
  );

  const result = data?.accessLogs;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;

  if (error) return <ErrorBanner message="Unable to load access logs." />;

  const cols = ["Actor", "Patient", "Entity", "Reason", "Accessed At"];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {cols.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <SkeletonRows cols={cols.length} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-4 py-12 text-center text-muted">
                  No access logs found.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{truncate(log.actorUserId, 20)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{truncate(log.patientId, 20)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold text-text">{log.entityType}</span>
                    <span className="ml-1.5 font-mono text-muted">{truncate(log.entityId, 16)}</span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-xs text-muted">
                    {log.reason ? truncate(log.reason, 40) : <span className="italic">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDate(log.accessedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={PAGE_LIMIT}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}

const TABS = [
  { key: "status" as Tab, label: "Status", icon: ShieldCheck },
  { key: "events" as Tab, label: "Audit Events", icon: Activity },
  { key: "logs" as Tab, label: "Access Logs", icon: Eye },
] as const;

export function AdminAuditView() {
  const [activeTab, setActiveTab] = useState<Tab>("events");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace · Audit
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Audit & Access Logs</h1>
        <p className="max-w-2xl text-sm text-muted">
          Monitor system events, entity changes, and record access across the platform.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition",
                  activeTab === key ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "status" && <AuditStatusPanel />}
          {activeTab === "events" && <AuditEventsPanel />}
          {activeTab === "logs" && <AccessLogsPanel />}
        </CardContent>
      </Card>
    </div>
  );
}
