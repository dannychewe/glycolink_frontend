"use client";

import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { PATIENT_NOTIFICATIONS_PREVIEW_QUERY } from "@/lib/patient/notifications-graphql";

type NotificationItem = {
  id: string;
  title: string | null;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsPreviewData = {
  notificationsPreview: {
    unreadCount: number;
    items: NotificationItem[];
  };
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return parsed.toLocaleDateString("en-ZM", { month: "short", day: "numeric" });
}

export function NotificationsSection() {
  const { data, loading } = useQuery<NotificationsPreviewData>(PATIENT_NOTIFICATIONS_PREVIEW_QUERY, {
    variables: { limit: 3 },
    fetchPolicy: "cache-and-network",
  });

  const items = data?.notificationsPreview?.items ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl">Notifications</h2>
        {items.length > 0 ? (
          <Button href="/patient/notifications" variant="secondary">
            View all
          </Button>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-border/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm text-muted">No notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-subtle">
          {items.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-4 px-5 py-4"
            >
              <div
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  notification.isRead ? "bg-slate-200" : "bg-primary/40"
                }`}
              />
              <div className="min-w-0 flex-1">
                {notification.title ? (
                  <p className="text-sm font-medium text-text">{notification.title}</p>
                ) : null}
                <p className="text-sm text-text">{notification.message}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(notification.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
