"use client";

import { useEffect, useMemo, useState } from "react";
import { NotificationTypeBadge } from "@/components/patient/notifications/NotificationTypeBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PatientNotification } from "@/types";

type NotificationsPageViewProps = Readonly<{
  initialNotifications: PatientNotification[];
}>;

const notificationsStorageKey = "glycolink.patient.notifications";

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function NotificationsPageView({
  initialNotifications,
}: NotificationsPageViewProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const rawNotifications = window.localStorage.getItem(notificationsStorageKey);

    if (!rawNotifications) {
      return;
    }

    try {
      const parsedNotifications = JSON.parse(rawNotifications) as PatientNotification[];

      if (Array.isArray(parsedNotifications)) {
        setNotifications(parsedNotifications);
      }
    } catch {
      window.localStorage.removeItem(notificationsStorageKey);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  function persistNotifications(nextNotifications: PatientNotification[]) {
    setNotifications(nextNotifications);
    window.localStorage.setItem(
      notificationsStorageKey,
      JSON.stringify(nextNotifications),
    );
  }

  function handleNotificationClick(notificationId: string) {
    const nextNotifications = notifications.map((notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            isRead: true,
          }
        : notification,
    );

    persistNotifications(nextNotifications);
  }

  function handleMarkAllAsRead() {
    const nextNotifications = notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));

    persistNotifications(nextNotifications);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Patient Inbox
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Notifications</h1>
          <p className="text-sm text-muted">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All notifications have been read"}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleMarkAllAsRead}
          disabled={notifications.length === 0 || unreadCount === 0}
        >
          Mark all as read
        </Button>
      </header>

      {notifications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification.id)}
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
                      <p
                        className={`text-sm leading-6 ${
                          notification.isRead ? "text-text/80" : "font-medium text-text"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:pl-4">
                    <NotificationTypeBadge type={notification.type} />
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
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No notifications available</p>
        </div>
      )}
    </div>
  );
}
