"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { Panel, PanelHeader, PanelTitle, PanelList, PanelEmpty, ViewAllLink } from "@/components/ui/panel";
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
  const unreadCount = data?.notificationsPreview?.unreadCount ?? 0;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.notifications} count={unreadCount} countTone="primary">
          Notifications
        </PanelTitle>
        {items.length > 0 ? <ViewAllLink href="/patient/notifications" /> : null}
      </PanelHeader>

      {loading && items.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-8 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <PanelEmpty>No notifications yet.</PanelEmpty>
      ) : (
        <PanelList>
          {items.map((notification) => (
            <div key={notification.id} className="flex items-start gap-4 px-5 py-3.5">
              <div
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  notification.isRead ? "bg-slate-200" : "bg-primary"
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
        </PanelList>
      )}
    </Panel>
  );
}
