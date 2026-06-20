"use client";

import { useMutation, useQuery } from "@apollo/client";
import { NotificationTypeBadge } from "@/components/patient/notifications/NotificationTypeBadge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import type { NotificationType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  PATIENT_MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  PATIENT_MARK_NOTIFICATION_READ_MUTATION,
  PATIENT_NOTIFICATIONS_FEED_QUERY,
} from "@/lib/patient/notifications-graphql";

type NotificationItem = {
  id: string;
  title: string | null;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsFeedData = {
  myNotifications: {
    items: NotificationItem[];
    page: number;
    limit: number;
    total: number;
  };
};

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function NotificationsPageView() {
  const { data, loading } = useQuery<NotificationsFeedData>(PATIENT_NOTIFICATIONS_FEED_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "network-only",
  });

  const [markRead] = useMutation(PATIENT_MARK_NOTIFICATION_READ_MUTATION, {
    refetchQueries: [{ query: PATIENT_NOTIFICATIONS_FEED_QUERY, variables: { limit: 50 } }],
  });

  const [markAllRead, { loading: markingAll }] = useMutation(
    PATIENT_MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    {
      refetchQueries: [{ query: PATIENT_NOTIFICATIONS_FEED_QUERY, variables: { limit: 50 } }],
    },
  );

  const notifications = data?.myNotifications?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleNotificationClick(notificationId: string, isRead: boolean) {
    if (!isRead) {
      markRead({ variables: { notificationId } });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Inbox"
        title="Notifications"
        description={
          loading
            ? "Loading…"
            : unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All notifications have been read"
        }
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => markAllRead()}
            disabled={loading || notifications.length === 0 || unreadCount === 0 || markingAll}
          >
            Mark all as read
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                  className={`flex w-full flex-col gap-3 px-5 py-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between ${
                    notification.isRead ? "bg-surface" : "bg-primary/5"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                        notification.isRead ? "bg-slate-200" : "bg-primary"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="space-y-2">
                      {notification.title ? (
                        <p className="text-sm font-semibold text-text">{notification.title}</p>
                      ) : null}
                      <p
                        className={`text-sm leading-6 ${
                          notification.isRead ? "text-text/80" : "font-medium text-text"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        {formatTimestamp(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:pl-4">
                    <NotificationTypeBadge type={notification.type as NotificationType} />
                    {!notification.isRead ? (
                      <span className="text-xs font-medium text-primary">Unread</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-base font-medium text-text">No notifications available</p>
        </div>
      )}
    </div>
  );
}
