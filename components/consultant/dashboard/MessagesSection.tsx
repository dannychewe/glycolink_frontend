"use client";

import { useQuery } from "@apollo/client";
import { MessageSquare } from "lucide-react";
import { CONSULTANT_CLIENTS_QUERY } from "@/lib/consultant/clients-graphql";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ConsultantClient = {
  patientId: string;
  patientName: string | null;
  email: string | null;
  unreadMessageCount: number;
  activeConversationId: string | null;
};

export function MessagesSection() {
  const { data, loading } = useQuery<{ consultantClients: ConsultantClient[] }>(
    CONSULTANT_CLIENTS_QUERY,
    { variables: { limit: 50 }, fetchPolicy: "network-only" },
  );

  const withUnread = (data?.consultantClients ?? [])
    .filter((c) => c.unreadMessageCount > 0)
    .sort((a, b) => b.unreadMessageCount - a.unreadMessageCount)
    .slice(0, 5);

  const totalUnread = withUnread.reduce((sum, c) => sum + c.unreadMessageCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-3.5" />
          </span>
          <h2 className="text-base font-semibold text-text">Messages</h2>
          {!loading && totalUnread > 0 ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {totalUnread}
            </span>
          ) : null}
        </div>
        <Button href="/consultant/patients" variant="ghost" size="sm">
          View all
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      ) : withUnread.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-6 text-center">
          <p className="text-sm text-muted">No unread messages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withUnread.map((client) => (
            <a
              key={client.patientId}
              href={`/consultant/patients/${client.patientId}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:bg-background"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">
                  {client.patientName ?? client.email ?? `Patient ${client.patientId.slice(0, 8)}…`}
                </p>
                {client.email && client.patientName ? (
                  <p className="truncate text-xs text-muted">{client.email}</p>
                ) : null}
              </div>
              <Badge variant="primary">{client.unreadMessageCount}</Badge>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
