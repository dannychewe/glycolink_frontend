"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { MY_PROVIDER_PROFILE_QUERY } from "@/lib/consultant/provider-lifecycle-graphql";
import { NOTIFICATIONS_PREVIEW_QUERY } from "@/lib/consultant/notifications-graphql";
import { UNREAD_MESSAGES_PREVIEW_QUERY } from "@/lib/consultant/messages-graphql";

type ConsultantHeaderProps = Readonly<{
  title: string;
  onMenuClick: () => void;
}>;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(displayName: string | null | undefined) {
  if (!displayName) return "Dr";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate() {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

export function ConsultantHeader({ title, onMenuClick }: ConsultantHeaderProps) {
  const { data: profileData } = useQuery(MY_PROVIDER_PROFILE_QUERY, {
    fetchPolicy: "cache-first",
  });

  const { data: notifData } = useQuery(NOTIFICATIONS_PREVIEW_QUERY, {
    variables: { limit: 1 },
    fetchPolicy: "cache-and-network",
  });

  const { data: msgData } = useQuery(UNREAD_MESSAGES_PREVIEW_QUERY, {
    variables: { limit: 1 },
    fetchPolicy: "cache-and-network",
  });

  const profile = profileData?.myProviderProfile;
  const unreadNotifications: number = notifData?.notificationsPreview?.unreadCount ?? 0;
  const unreadMessages: number = msgData?.unreadMessagesPreview?.unreadCount ?? 0;
  const initials = getInitials(profile?.displayName);
  const avatarUrl: string | null = profile?.profilePictureUrl ?? profile?.avatarUrl ?? null;

  const shortName = profile?.displayName
    ? profile.displayName.split(" ").slice(0, 2).join(" ")
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 md:px-8">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text shadow-soft md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Title + date */}
        <div className="flex min-w-0 flex-1 flex-col justify-center md:flex-row md:items-baseline md:gap-3">
          <h1 className="truncate text-base font-semibold text-text md:text-lg">{title}</h1>
          <span className="hidden text-xs text-muted md:block">{formatDate()}</span>
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Messages */}
          <Link
            href="/consultant/messages"
            aria-label={unreadMessages > 0 ? `${unreadMessages} unread messages` : "Messages"}
            className="relative inline-flex size-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-text"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10ZM9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadMessages > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-white">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            ) : null}
          </Link>

          {/* Notifications */}
          <Link
            href="/consultant/notifications"
            aria-label={unreadNotifications > 0 ? `${unreadNotifications} unread notifications` : "Notifications"}
            className="relative inline-flex size-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-text"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadNotifications > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-4 text-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            ) : null}
          </Link>

          {/* Divider */}
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

          {/* Avatar + greeting */}
          <Link
            href="/consultant/profile"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-surface"
          >
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/15">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.displayName ?? "Profile"}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                  {initials}
                </span>
              )}
            </div>
            {shortName ? (
              <div className="hidden flex-col leading-none md:flex">
                <span className="text-xs font-medium text-text">{shortName}</span>
                <span className="text-[10px] text-muted">{greeting()}</span>
              </div>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
