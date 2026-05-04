"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  MessageSquare, Send, Archive, X, RotateCcw, ChevronLeft,
  Paperclip, AlertCircle, CheckCheck, Check,
} from "lucide-react";
import {
  ARCHIVE_CONVERSATION_MUTATION,
  CLOSE_CONVERSATION_MUTATION,
  CONVERSATION_MESSAGES_QUERY,
  MARK_CONVERSATION_READ_MUTATION,
  MESSAGE_PRIORITY_OPTIONS,
  MESSAGE_THREADS_QUERY,
  REOPEN_CONVERSATION_MUTATION,
  SEND_MESSAGE_MUTATION,
} from "@/lib/consultant/messages-graphql";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────

type LastMessage = {
  id: string;
  sequenceNumber: number;
  senderUserId: string;
  senderName: string | null;
  body: string | null;
  priority: string | null;
  sentAt: string;
};

type Thread = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  encounterId: string | null;
  status: string;
  patientName: string | null;
  unreadCount: number;
  unreadMessageCount: number;
  unreadThread: boolean;
  lastMessageAt: string | null;
  updatedAt: string;
  lastMessage: LastMessage | null;
};

type Attachment = {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  fileUrl: string;
};

type Message = {
  id: string;
  conversationId: string;
  sequenceNumber: number;
  senderUserId: string;
  senderName: string | null;
  patientName: string | null;
  body: string | null;
  priority: string | null;
  sentAt: string;
  deliveredAt: string | null;
  isReadByMe: boolean;
  readByMeAt: string | null;
  isReadByRecipient: boolean;
  readByRecipientAt: string | null;
  attachments: Attachment[];
};

type FilterTab = "all" | "unread";

// ─── Helpers ─────────────────────────────────────────────

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric" });
}

function formatFullTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function isFromPatient(message: Message): boolean {
  return message.senderName === message.patientName && message.patientName !== null;
}

function statusVariant(status: string): "success" | "secondary" | "warning" {
  const s = status.toUpperCase();
  if (s === "OPEN" || s === "ACTIVE") return "success";
  if (s === "CLOSED") return "secondary";
  return "warning";
}

// ─── Thread Row ───────────────────────────────────────────

function ThreadRow({
  thread,
  isSelected,
  onClick,
}: {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasUnread = thread.unreadThread || thread.unreadMessageCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-border transition",
        isSelected ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-background",
        hasUnread && !isSelected ? "border-l-2 border-l-primary/40" : "",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className={cn("truncate text-sm", hasUnread ? "font-bold text-text" : "font-medium text-text")}>
              {thread.patientName ?? `Patient ${thread.patientId.slice(0, 8)}…`}
            </p>
            {thread.lastMessage?.priority === "URGENT" ? (
              <Badge variant="danger">Urgent</Badge>
            ) : null}
          </div>
          {thread.lastMessage?.body ? (
            <p className={cn("truncate text-xs", hasUnread ? "text-text" : "text-muted")}>
              {thread.lastMessage.senderName !== thread.patientName ? "You: " : ""}
              {thread.lastMessage.body}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {thread.lastMessageAt ? (
            <p className="text-xs text-muted">{formatTime(thread.lastMessageAt)}</p>
          ) : null}
          {thread.unreadMessageCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
              {thread.unreadMessageCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const fromPatient = isFromPatient(message);

  return (
    <div className={cn("flex", fromPatient ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1",
        fromPatient
          ? "rounded-tl-sm bg-surface border border-border"
          : "rounded-tr-sm bg-primary text-white",
      )}>
        {message.body ? (
          <p className={cn("text-sm leading-5 whitespace-pre-wrap", fromPatient ? "text-text" : "text-white")}>
            {message.body}
          </p>
        ) : null}

        {message.attachments.length > 0 ? (
          <div className="space-y-1 pt-1">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition",
                  fromPatient
                    ? "bg-background text-primary hover:underline"
                    : "bg-white/20 text-white hover:bg-white/30",
                )}
              >
                <Paperclip className="size-3 shrink-0" />
                <span className="truncate">{att.originalName}</span>
              </a>
            ))}
          </div>
        ) : null}

        <div className={cn("flex items-center gap-1.5", fromPatient ? "justify-start" : "justify-end")}>
          <p className={cn("text-xs", fromPatient ? "text-muted" : "text-white/70")}>
            {formatFullTime(message.sentAt)}
            {message.priority === "URGENT" ? " · Urgent" : ""}
          </p>
          {!fromPatient ? (
            message.isReadByRecipient
              ? <CheckCheck className="size-3 text-white/70" />
              : <Check className="size-3 text-white/50" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation View ────────────────────────────────────

function ConversationView({
  thread,
  onBack,
  onThreadUpdated,
}: {
  thread: Thread;
  onBack: () => void;
  onThreadUpdated: () => void;
}) {
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [_loadBefore, _setLoadBefore] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, loading, fetchMore, refetch } = useQuery<{ conversationMessages: Message[] }>(
    CONVERSATION_MESSAGES_QUERY,
    {
      variables: { conversationId: thread.id, limit: 30 },
      fetchPolicy: "network-only",
    },
  );

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION);
  const [markRead] = useMutation(MARK_CONVERSATION_READ_MUTATION);
  const [archiveConversation, { loading: archiving }] = useMutation(ARCHIVE_CONVERSATION_MUTATION);
  const [closeConversation, { loading: closing }] = useMutation(CLOSE_CONVERSATION_MUTATION);
  const [reopenConversation, { loading: reopening }] = useMutation(REOPEN_CONVERSATION_MUTATION);

  const messages = [...(data?.conversationMessages ?? [])].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  );

  const isClosed = thread.status.toUpperCase() === "CLOSED";
  const isArchived = thread.status.toUpperCase() === "ARCHIVED";

  useEffect(() => {
    if (thread.unreadMessageCount > 0) {
      void markRead({ variables: { conversationId: thread.id } });
    }
  }, [thread.id, thread.unreadMessageCount, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await sendMessage({
        variables: { conversationId: thread.id, body: body.trim(), priority },
      });
      setBody("");
      setPriority("NORMAL");
      await refetch();
      onThreadUpdated();
    } catch {
      /* handled silently — no alert needed for send failures here */
    }
  }

  async function handleLoadEarlier() {
    const oldest = messages[0]?.sentAt;
    if (!oldest) return;
    await fetchMore({
      variables: { conversationId: thread.id, limit: 30, before: oldest },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          conversationMessages: [
            ...fetchMoreResult.conversationMessages,
            ...prev.conversationMessages,
          ],
        };
      },
    });
  }

  async function handleLifecycle(action: "archive" | "close" | "reopen") {
    try {
      if (action === "archive") await archiveConversation({ variables: { conversationId: thread.id } });
      else if (action === "close") await closeConversation({ variables: { conversationId: thread.id } });
      else await reopenConversation({ variables: { conversationId: thread.id } });
      onThreadUpdated();
    } catch { /* ignore */ }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-lg p-1 text-muted hover:text-text transition sm:hidden"
          aria-label="Back to threads"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            {thread.patientName ?? `Patient ${thread.patientId.slice(0, 8)}…`}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(thread.status)}>{thread.status}</Badge>
            {thread.encounterId ? (
              <a
                href={`/consultant/consultations/${thread.encounterId}`}
                className="text-xs text-primary hover:underline"
              >
                View encounter
              </a>
            ) : null}
          </div>
        </div>

        {/* Thread actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {!isClosed && !isArchived ? (
            <>
              <button
                type="button"
                onClick={() => void handleLifecycle("close")}
                disabled={closing}
                title="Close conversation"
                className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-text transition disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleLifecycle("archive")}
                disabled={archiving}
                title="Archive conversation"
                className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-text transition disabled:opacity-50"
              >
                <Archive className="size-4" />
              </button>
            </>
          ) : null}
          {isClosed ? (
            <button
              type="button"
              onClick={() => void handleLifecycle("reopen")}
              disabled={reopening}
              title="Reopen conversation"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition disabled:opacity-50"
            >
              <RotateCcw className="size-3" />
              Reopen
            </button>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length >= 30 ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => void handleLoadEarlier()}
              className="text-xs text-primary hover:underline"
            >
              Load earlier messages
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("h-12 w-2/3 animate-pulse rounded-2xl bg-border/40", i % 2 === 0 ? "" : "ml-auto")} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted">No messages yet. Send one to start the conversation.</p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {isClosed ? (
        <div className="border-t border-border bg-background px-4 py-3 text-center text-sm text-muted">
          This conversation is closed.{" "}
          <button
            type="button"
            onClick={() => void handleLifecycle("reopen")}
            className="font-medium text-primary hover:underline"
          >
            Reopen
          </button>{" "}
          to send messages.
        </div>
      ) : isArchived ? (
        <div className="border-t border-border bg-background px-4 py-3 text-center text-sm text-muted">
          This conversation is archived.
        </div>
      ) : (
        <form
          onSubmit={(e) => void handleSend(e)}
          className="border-t border-border bg-surface px-4 py-3 space-y-2"
        >
          <textarea
            placeholder="Type a message…"
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void handleSend(e as unknown as FormEvent);
            }}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-text outline-none transition focus:border-primary"
            >
              {MESSAGE_PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="text-xs text-muted">Ctrl+Enter to send · Patient is notified by email and in-app</p>
        </form>
      )}
    </div>
  );
}

// ─── Main Inbox ───────────────────────────────────────────

export function GraphqlInbox({ initialConversationId }: { initialConversationId?: string }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);

  const { data, loading, error, refetch } = useQuery<{ messageThreads: Thread[] }>(
    MESSAGE_THREADS_QUERY,
    {
      variables: {
        limit: 50,
        includeArchived: false,
        unreadOnly: activeTab === "unread",
      },
      fetchPolicy: "network-only",
    },
  );

  const threads = data?.messageThreads ?? [];
  const selectedThread = threads.find((t) => t.id === selectedId) ?? null;
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadMessageCount, 0);

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[500px] overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle">
      {/* Thread list — hidden on mobile when a thread is selected */}
      <div className={cn(
        "flex w-full flex-col border-r border-border sm:w-80 sm:flex-shrink-0",
        selectedThread ? "hidden sm:flex" : "flex",
      )}>
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex gap-1">
            {(["all", "unread"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize",
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "text-muted hover:text-text hover:bg-background",
                )}
              >
                {tab}
                {tab === "unread" && totalUnread > 0 ? ` (${totalUnread})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-px p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
              ))}
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center">
              <AlertCircle className="mx-auto size-6 text-warning" />
              <p className="mt-2 text-xs text-muted">Unable to load threads.</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MessageSquare className="size-8 text-muted/40" />
              <p className="text-sm font-medium text-text">No conversations</p>
              <p className="text-xs text-muted">
                {activeTab === "unread" ? "No unread messages." : "Conversations with patients will appear here."}
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                isSelected={selectedId === thread.id}
                onClick={() => setSelectedId(thread.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Conversation panel */}
      <div className={cn(
        "flex-1 overflow-hidden",
        !selectedThread ? "hidden sm:flex sm:items-center sm:justify-center" : "flex flex-col",
      )}>
        {selectedThread ? (
          <ConversationView
            key={selectedThread.id}
            thread={selectedThread}
            onBack={() => setSelectedId(null)}
            onThreadUpdated={() => void refetch()}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <MessageSquare className="size-10 text-muted/30" />
            <p className="text-sm text-muted">Select a conversation to read messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
