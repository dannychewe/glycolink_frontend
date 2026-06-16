"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { MessageSquare, Send, ChevronLeft, Paperclip, AlertCircle, CheckCheck, Check, Archive, RotateCcw, X } from "lucide-react";
import {
  MESSAGE_PRIORITY_OPTIONS,
  PATIENT_ARCHIVE_CONVERSATION_MUTATION,
  PATIENT_CONVERSATION_MESSAGES_QUERY,
  PATIENT_MARK_CONVERSATION_READ_MUTATION,
  PATIENT_MESSAGE_THREADS_QUERY,
  PATIENT_REOPEN_CONVERSATION_MUTATION,
  PATIENT_SEND_MESSAGE_MUTATION,
} from "@/lib/patient/messages-graphql";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/features/auth/auth-context";

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
  providerId: string;
  appointmentId: string | null;
  encounterId: string | null;
  status: string;
  providerName: string | null;
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

function threadLabel(thread: Thread): string {
  return thread.providerName ?? "Care Team";
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
  currentUserId,
  onClick,
}: {
  thread: Thread;
  isSelected: boolean;
  currentUserId: string | undefined;
  onClick: () => void;
}) {
  const hasUnread = thread.unreadThread || thread.unreadMessageCount > 0;
  const label = threadLabel(thread);

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
              {label}
            </p>
            {thread.lastMessage?.priority === "URGENT" ? (
              <Badge variant="danger">Urgent</Badge>
            ) : null}
          </div>
          {thread.lastMessage?.body ? (
            <p className={cn("truncate text-xs", hasUnread ? "text-text" : "text-muted")}>
              {thread.lastMessage.senderUserId === currentUserId ? "You: " : ""}
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

function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string | undefined }) {
  const fromMe = message.senderUserId === currentUserId;

  return (
    <div className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1",
        fromMe
          ? "rounded-tr-sm bg-primary text-white"
          : "rounded-tl-sm bg-surface border border-border",
      )}>
        {message.body ? (
          <p className={cn("text-sm leading-5 whitespace-pre-wrap", fromMe ? "text-white" : "text-text")}>
            {message.body}
          </p>
        ) : null}

        {message.attachments.length > 0 ? (
          <div className="space-y-1 pt-1">
            {message.attachments.map((att) =>
              att.contentType.startsWith("image/") ? (
                <img
                  key={att.fileUrl}
                  src={att.fileUrl}
                  alt={att.originalName}
                  className="max-w-full rounded-lg"
                />
              ) : (
                <a
                  key={att.fileUrl}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition",
                    fromMe
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-background text-primary hover:underline",
                  )}
                >
                  <Paperclip className="size-3 shrink-0" />
                  <span className="truncate">{att.originalName}</span>
                </a>
              )
            )}
          </div>
        ) : null}

        <div className={cn("flex items-center gap-1.5", fromMe ? "justify-end" : "justify-start")}>
          <p className={cn("text-xs", fromMe ? "text-white/70" : "text-muted")}>
            {formatFullTime(message.sentAt)}
            {message.priority === "URGENT" ? " · Urgent" : ""}
          </p>
          {fromMe ? (
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
  currentUserId,
  onBack,
  onThreadUpdated,
}: {
  thread: Thread;
  currentUserId: string | undefined;
  onBack: () => void;
  onThreadUpdated: () => void;
}) {
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [attachments, setAttachments] = useState<File[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, loading, fetchMore, refetch } = useQuery<{ conversationMessages: Message[] }>(
    PATIENT_CONVERSATION_MESSAGES_QUERY,
    {
      variables: { conversationId: thread.id, limit: 30 },
      fetchPolicy: "network-only",
    },
  );

  const [sendMessage, { loading: sending }] = useMutation(PATIENT_SEND_MESSAGE_MUTATION);
  const [markRead] = useMutation(PATIENT_MARK_CONVERSATION_READ_MUTATION);
  const [archiveConversation, { loading: archiving }] = useMutation(
    PATIENT_ARCHIVE_CONVERSATION_MUTATION,
    { onCompleted: onThreadUpdated },
  );
  const [reopenConversation, { loading: reopening }] = useMutation(
    PATIENT_REOPEN_CONVERSATION_MUTATION,
    { onCompleted: onThreadUpdated },
  );

  const messages = [...(data?.conversationMessages ?? [])].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  );

  const isClosed = thread.status.toUpperCase() === "CLOSED";
  const isArchived = thread.status.toUpperCase() === "ARCHIVED";
  const label = threadLabel(thread);

  useEffect(() => {
    void markRead({ variables: { conversationId: thread.id } });
  }, [thread.id, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) {
      setAttachments((prev) => [...prev, ...picked]);
    }
    // reset so the same file can be re-selected after removal
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() && attachments.length === 0) return;
    try {
      await sendMessage({
        variables: {
          conversationId: thread.id,
          body: body.trim() || null,
          priority,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      });
      setBody("");
      setPriority("NORMAL");
      setAttachments([]);
      await refetch();
      onThreadUpdated();
    } catch {
      /* handled silently */
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
          <p className="truncate text-sm font-semibold text-text">{label}</p>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(thread.status)}>{thread.status}</Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isArchived ? (
            <button
              type="button"
              onClick={() => void reopenConversation({ variables: { conversationId: thread.id } })}
              disabled={reopening}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text transition hover:bg-surface disabled:opacity-50"
              title="Reopen conversation"
            >
              <RotateCcw className="size-3.5" />
              Reopen
            </button>
          ) : !isClosed ? (
            <button
              type="button"
              onClick={() => void archiveConversation({ variables: { conversationId: thread.id } })}
              disabled={archiving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-text hover:bg-surface disabled:opacity-50"
              title="Archive conversation"
            >
              <Archive className="size-3.5" />
              Archive
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
          <p className="text-center text-sm text-muted">No messages yet.</p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />)
        )}

        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {isClosed ? (
        <div className="border-t border-border bg-background px-4 py-3 text-center text-sm text-muted">
          This conversation is closed.
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
          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((file, i) => (
                <span
                  key={`${file.name}-${i}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                >
                  <Paperclip className="size-3 shrink-0 text-muted" />
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="shrink-0 text-muted transition hover:text-danger"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

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
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
                aria-label="Attach files"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-background text-muted transition hover:text-text hover:bg-surface"
              >
                <Paperclip className="size-4" />
              </button>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="Message priority"
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-text outline-none transition focus:border-primary"
              >
                {MESSAGE_PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={sending || (!body.trim() && attachments.length === 0)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="text-xs text-muted">Ctrl+Enter to send · Your care team is notified by email and in-app</p>
        </form>
      )}
    </div>
  );
}

// ─── Main Inbox ───────────────────────────────────────────

export function PatientInbox({ initialConversationId }: { initialConversationId?: string }) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);

  const { data, loading, error, refetch } = useQuery<{ messageThreads: Thread[] }>(
    PATIENT_MESSAGE_THREADS_QUERY,
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
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadMessageCount, 0);

  const foundThread = threads.find((t) => t.id === selectedId) ?? null;
  const stubThread: Thread | null =
    !loading && selectedId && !foundThread
      ? {
          id: selectedId,
          providerId: "",
          appointmentId: null,
          encounterId: null,
          status: "OPEN",
          providerName: null,
          unreadCount: 0,
          unreadMessageCount: 0,
          unreadThread: false,
          lastMessageAt: null,
          updatedAt: new Date().toISOString(),
          lastMessage: null,
        }
      : null;
  const selectedThread = foundThread ?? stubThread;

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[500px] overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle">
      {/* Thread list */}
      <div className={cn(
        "flex w-full flex-col border-r border-border sm:w-80 sm:flex-shrink-0",
        selectedThread ? "hidden sm:flex" : "flex",
      )}>
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
              <p className="mt-2 text-xs text-muted">Unable to load messages.</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MessageSquare className="size-8 text-muted/40" />
              <p className="text-sm font-medium text-text">No conversations</p>
              <p className="text-xs text-muted">
                {activeTab === "unread" ? "No unread messages." : "Messages from your care team will appear here."}
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                isSelected={selectedId === thread.id}
                currentUserId={currentUserId}
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
            currentUserId={currentUserId}
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
