"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, Bell, BellOff, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ADMIN_MARK_NOTIFICATION_READ_MUTATION,
  ADMIN_MARK_NOTIFICATIONS_READ_MUTATION,
  ADMIN_SYSTEM_NOTIFICATIONS_PREVIEW_QUERY,
  ADMIN_SYSTEM_NOTIFICATIONS_QUERY,
} from "@/lib/admin/graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────

type Notification = {
  id: string;
  tenantId: string | null;
  userId: string | null;
  userEmail: string | null;
  title: string;
  message: string | null;
  type: string;
  isRead: boolean;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
};

type PreviewData = {
  systemNotificationsPreview: {
    unreadCount: number;
    items: Notification[];
  };
};

type FeedData = {
  systemNotifications: {
    items: Notification[];
    total: number;
    page: number;
    limit: number;
  };
};

type Filters = {
  tenantId: string;
  userId: string;
  type: string;
  isRead: "all" | "unread" | "read";
};

const PAGE_LIMIT = 25;

// ─── Helpers ─────────────────────────────────────────────

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function truncate(value: string, max = 36) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function isReadFilter(value: Filters["isRead"]): boolean | undefined {
  if (value === "unread") return false;
  if (value === "read") return true;
  return undefined;
}

function typeVariant(type: string): "primary" | "warning" | "danger" | "secondary" {
  const t = type.toUpperCase();
  if (t.includes("ERROR") || t.includes("CRITICAL") || t.includes("ALERT")) return "danger";
  if (t.includes("WARN") || t.includes("PENDING")) return "warning";
  if (t.includes("MESSAGE") || t.includes("SYSTEM")) return "primary";
  return "secondary";
}

// ─── Sub-components ───────────────────────────────────────

function ErrorBanner({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
      <AlertCircle className="size-4 shrink-0 text-danger" />
      <p className="text-sm text-danger">{message}</p>
    </div>
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

// ─── Preview strip ────────────────────────────────────────

function UnreadSummary({ filters }: { filters: Filters }) {
  const { data, loading } = useQuery<PreviewData>(ADMIN_SYSTEM_NOTIFICATIONS_PREVIEW_QUERY, {
    variables: {
      limit: 1,
      tenantId: filters.tenantId || undefined,
      type: filters.type || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const unread = data?.systemNotificationsPreview?.unreadCount ?? 0;

  if (loading && !data) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3",
      unread > 0
        ? "border-primary/30 bg-primary/5"
        : "border-border bg-surface",
    )}>
      {unread > 0 ? (
        <Bell className="size-4 shrink-0 text-primary" />
      ) : (
        <BellOff className="size-4 shrink-0 text-muted" />
      )}
      <p className="text-sm text-text">
        {unread > 0 ? (
          <>
            <span className="font-semibold text-primary">{unread.toLocaleString()}</span>{" "}
            unread notification{unread !== 1 ? "s" : ""}
            {filters.tenantId || filters.type ? " matching current filters" : " platform-wide"}
          </>
        ) : (
          "All notifications have been read."
        )}
      </p>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────

function NotificationRow({
  notification,
  onMarkedRead,
}: {
  notification: Notification;
  onMarkedRead: () => void;
}) {
  const [markRead, { loading }] = useMutation(ADMIN_MARK_NOTIFICATION_READ_MUTATION, {
    variables: { notificationId: notification.id },
    onCompleted: onMarkedRead,
  });

  return (
    <div className={cn(
      "space-y-1.5 border-b border-border px-5 py-4 last:border-0 transition",
      !notification.isRead && "bg-primary/[0.02]",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {!notification.isRead && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
          <div className="min-w-0 space-y-0.5">
            <p className={cn(
              "truncate text-sm",
              notification.isRead ? "font-medium text-text" : "font-semibold text-text",
            )}>
              {notification.title}
            </p>
            {notification.message ? (
              <p className="text-sm text-muted">{notification.message}</p>
            ) : null}
          </div>
        </div>

        {!notification.isRead ? (
          <button
            type="button"
            onClick={() => void markRead()}
            disabled={loading}
            title="Mark as read"
            className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-primary disabled:opacity-50"
          >
            <CheckCheck className="size-4" />
          </button>
        ) : (
          <span className="shrink-0 rounded-lg p-1.5 text-border">
            <CheckCheck className="size-4" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[1.125rem]">
        <Badge variant={typeVariant(notification.type)} className="text-xs">
          {notification.type}
        </Badge>
        {notification.userEmail ? (
          <span className="text-xs text-muted">{notification.userEmail}</span>
        ) : null}
        {notification.tenantId ? (
          <span className="font-mono text-xs text-muted" title="Tenant ID">
            tenant:{truncate(notification.tenantId, 8)}
          </span>
        ) : null}
        {notification.sourceType ? (
          <span className="text-xs text-muted">
            {notification.sourceType}
            {notification.sourceId ? ` · ${truncate(notification.sourceId, 8)}` : ""}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-muted">{formatDate(notification.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── Feed panel ───────────────────────────────────────────

function NotificationsFeed({ filters }: { filters: Filters }) {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useQuery<FeedData>(
    ADMIN_SYSTEM_NOTIFICATIONS_QUERY,
    {
      variables: {
        page,
        limit: PAGE_LIMIT,
        tenantId: filters.tenantId || undefined,
        userId: filters.userId || undefined,
        type: filters.type || undefined,
        isRead: isReadFilter(filters.isRead),
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const [markAllRead, { loading: markingAll }] = useMutation(
    ADMIN_MARK_NOTIFICATIONS_READ_MUTATION,
    {
      variables: {
        tenantId: filters.tenantId || undefined,
        userId: filters.userId || undefined,
        type: filters.type || undefined,
      },
      onCompleted: () => void refetch(),
    },
  );

  const result = data?.systemNotifications;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const unreadInPage = items.filter((n) => !n.isRead).length;

  if (error) return <ErrorBanner message="Unable to load notifications." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {loading && !data
            ? "Loading…"
            : `${total.toLocaleString()} notification${total !== 1 ? "s" : ""}`}
        </p>
        {unreadInPage > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={markingAll}
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="size-3.5" />
            {markingAll ? "Marking…" : "Mark all as read"}
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {loading && items.length === 0 ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <BellOff className="size-8 text-muted/40" />
            <p className="text-sm font-medium text-text">No notifications</p>
            <p className="text-xs text-muted">Try adjusting your filters.</p>
          </div>
        ) : (
          items.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onMarkedRead={() => void refetch()}
            />
          ))
        )}

        {total > 0 ? (
          <PaginationBar
            page={page}
            total={total}
            limit={PAGE_LIMIT}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────

const READ_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "unread" as const, label: "Unread" },
  { value: "read" as const, label: "Read" },
];

export function AdminNotificationsView() {
  const [filters, setFilters] = useState<Filters>({
    tenantId: "",
    userId: "",
    type: "",
    isRead: "all",
  });

  function update(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace · Notifications
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">System Notifications</h1>
        <p className="max-w-2xl text-sm text-muted">
          Inspect platform-wide notifications sent to patients and consultants. Filter by tenant,
          user, type, or read state.
        </p>
      </header>

      <UnreadSummary filters={filters} />

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-text">Filters</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-tenant">Tenant ID</Label>
              <Input
                id="filter-tenant"
                placeholder="UUID"
                value={filters.tenantId}
                onChange={(e) => update({ tenantId: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-user">User ID</Label>
              <Input
                id="filter-user"
                placeholder="UUID"
                value={filters.userId}
                onChange={(e) => update({ userId: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-type">Type</Label>
              <Input
                id="filter-type"
                placeholder="e.g. MESSAGE, ALERT"
                value={filters.type}
                onChange={(e) => update({ type: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Read state</Label>
              <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
                {READ_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ isRead: value })}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs font-medium transition",
                      filters.isRead === value
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:text-text",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ tenantId: "", userId: "", type: "", isRead: "all" })}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotificationsFeed filters={filters} />
    </div>
  );
}
