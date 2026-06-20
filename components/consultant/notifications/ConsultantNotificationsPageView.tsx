"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Bell } from "lucide-react";
import {
  NOTIFICATIONS_FEED_QUERY,
  MARK_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
} from "@/lib/consultant/notifications-graphql";
import { ConsultantNotificationTypeBadge } from "@/components/consultant/notifications/ConsultantNotificationTypeBadge";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type FeedData = {
  myNotifications: {
    items: NotificationItem[];
    page: number;
    limit: number;
    total: number;
  };
};

function formatTimestamp(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function ConsultantNotificationsPageView() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useQuery<FeedData>(NOTIFICATIONS_FEED_QUERY, {
    variables: { page, limit: PAGE_SIZE },
    fetchPolicy: "network-only",
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ_MUTATION, {
    onCompleted: () => refetch(),
  });

  const [markAllRead, { loading: markingAll }] = useMutation(
    MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    { onCompleted: () => refetch() },
  );

  const feed = data?.myNotifications;
  const items = feed?.items ?? [];
  const total = feed?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const unreadCount = items.filter((n) => !n.isRead).length;

  function handleMarkRead(id: string, isRead: boolean) {
    if (isRead) return;
    markRead({ variables: { notificationId: id } });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load notifications.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {total > 0
            ? `${total} notification${total !== 1 ? "s" : ""}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`
            : "No notifications"}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => markAllRead()}
          disabled={unreadCount === 0 || markingAll}
        >
          Mark all as read
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <Bell className="size-8 text-muted/40" />
          <p className="text-sm font-medium text-text">No notifications</p>
          <p className="text-xs text-muted">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleMarkRead(notification.id, notification.isRead)}
              className={`flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-background sm:flex-row sm:items-start sm:justify-between ${
                notification.isRead ? "bg-surface" : "bg-primary/5"
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    notification.isRead ? "bg-border" : "bg-primary"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 space-y-1">
                  <p
                    className={`text-sm ${
                      notification.isRead ? "text-text/80" : "font-semibold text-text"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {notification.message ? (
                    <p className="text-sm text-muted">{notification.message}</p>
                  ) : null}
                  <p className="text-xs text-muted/60">{formatTimestamp(notification.createdAt)}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                <ConsultantNotificationTypeBadge type={notification.type as never} />
                {!notification.isRead ? (
                  <span className="text-xs font-medium text-primary">Unread</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <p className="text-xs text-muted">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
