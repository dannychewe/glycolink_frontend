import type { DashboardNotification } from "@/types";

type NotificationsSectionProps = Readonly<{
  notifications: DashboardNotification[];
}>;

export function NotificationsSection({ notifications }: NotificationsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Notifications</h2>

      <div className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-subtle">
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={`${notification.message}-${notification.timestamp}`}
            className="flex items-start gap-4 px-5 py-4"
          >
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/40" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text">{notification.message}</p>
              <p className="mt-1 text-xs text-muted">{notification.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
