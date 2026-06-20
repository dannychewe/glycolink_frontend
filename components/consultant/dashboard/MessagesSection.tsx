"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { CONSULTANT_CLIENTS_QUERY } from "@/lib/consultant/clients-graphql";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelList, PanelEmpty, ViewAllLink } from "@/components/ui/panel";

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
    { variables: { limit: 50 }, fetchPolicy: "cache-and-network" },
  );

  const withUnread = (data?.consultantClients ?? [])
    .filter((c) => c.unreadMessageCount > 0)
    .sort((a, b) => b.unreadMessageCount - a.unreadMessageCount)
    .slice(0, 5);

  const totalUnread = withUnread.reduce((sum, c) => sum + c.unreadMessageCount, 0);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.messages} count={totalUnread} countTone="primary">
          Messages
        </PanelTitle>
        <ViewAllLink href="/consultant/patients" />
      </PanelHeader>

      {loading && withUnread.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-7 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : withUnread.length === 0 ? (
        <PanelEmpty>No unread messages.</PanelEmpty>
      ) : (
        <PanelList>
          {withUnread.map((client) => (
            <a
              key={client.patientId}
              href={`/consultant/patients/${client.patientId}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-background"
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
        </PanelList>
      )}
    </Panel>
  );
}
