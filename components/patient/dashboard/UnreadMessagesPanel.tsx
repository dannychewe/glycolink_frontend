"use client";

import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Icons } from "@/components/ui/icons";
import { PATIENT_UNREAD_MESSAGES_PREVIEW_QUERY } from "@/lib/patient/messages-graphql";

type UnreadPreviewData = {
  unreadMessagesPreview: {
    unreadCount: number;
    unreadThreadCount: number;
    items: Array<{
      id: string;
      senderName?: string | null;
      body: string;
    }>;
  };
};

/** Hidden entirely when there is nothing unread — no empty-state clutter. */
export function UnreadMessagesPanel() {
  const { data, loading } = useQuery<UnreadPreviewData>(PATIENT_UNREAD_MESSAGES_PREVIEW_QUERY, {
    variables: { limit: 3 },
    fetchPolicy: "cache-and-network",
  });

  const preview = data?.unreadMessagesPreview;
  if (loading && !preview) return null;
  if (!preview || preview.unreadCount === 0) return null;

  const latest = preview.items[0];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.messages} count={preview.unreadThreadCount} countTone="primary">
          Messages
        </PanelTitle>
        <Button href="/patient/messages" size="sm" variant="secondary">
          Open inbox
        </Button>
      </PanelHeader>
      <PanelBody>
        {latest ? (
          <p className="truncate text-sm text-muted">
            <span className="font-semibold text-text">{latest.senderName ?? "Care team"}:</span>{" "}
            {latest.body}
          </p>
        ) : (
          <p className="text-sm text-muted">
            {preview.unreadCount} unread message{preview.unreadCount === 1 ? "" : "s"}.
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}
