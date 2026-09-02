"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { usePathname } from "next/navigation";
import { MY_PATIENT_PROFILE_QUERY } from "@/lib/patient/clinical-profile-graphql";
import { PATIENT_UNREAD_MESSAGES_PREVIEW_QUERY } from "@/lib/patient/messages-graphql";
import { getPatientPageTitle } from "@/lib/navigation/patient-navigation";

type PatientHeaderProps = Readonly<{
  onMenuClick: () => void;
}>;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(fullName: string | null | undefined) {
  if (!fullName) return "P";
  const parts = fullName.trim().split(/\s+/);
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

export function PatientHeader({ onMenuClick }: PatientHeaderProps) {
  const pathname = usePathname();
  const { data } = useQuery(MY_PATIENT_PROFILE_QUERY, {
    fetchPolicy: "cache-first",
  });

  const { data: msgData } = useQuery(PATIENT_UNREAD_MESSAGES_PREVIEW_QUERY, {
    variables: { limit: 1 },
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.myPatientProfile;
  const unreadMessages: number = msgData?.unreadMessagesPreview?.unreadCount ?? 0;
  const initials = getInitials(profile?.fullName);
  const shortName = profile?.fullName
    ? profile.fullName.split(" ").slice(0, 2).join(" ")
    : null;
  const pageTitle = getPatientPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6 md:px-8">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-text shadow-soft transition active:scale-95 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Date */}
        <div className="flex min-w-0 flex-1 flex-col justify-center leading-tight md:flex-row md:items-center">
          <span className="truncate text-sm font-semibold text-text md:hidden">{pageTitle}</span>
          <span className="truncate text-[11px] font-medium text-muted md:hidden">{formatDate()}</span>
          <span className="hidden text-sm font-medium text-muted md:block">{formatDate()}</span>
        </div>

        {/* Messages shortcut */}
        <Link
          href="/patient/messages"
          aria-label={unreadMessages > 0 ? `${unreadMessages} unread messages` : "Messages"}
          className="relative inline-flex size-11 items-center justify-center rounded-2xl text-muted transition hover:bg-surface hover:text-text active:scale-95 md:size-10 md:rounded-xl"
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

        {/* Notifications shortcut */}
        <Link
          href="/patient/notifications"
          aria-label="Notifications"
          className="inline-flex size-11 items-center justify-center rounded-2xl text-muted transition hover:bg-surface hover:text-text active:scale-95 md:size-10 md:rounded-xl"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* Divider */}
        <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

        {/* Avatar + greeting */}
        <Link
          href="/patient/profile"
          className="flex items-center gap-2 rounded-2xl px-1.5 py-1.5 transition hover:bg-surface active:scale-95 md:rounded-xl md:px-2"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-2 ring-primary/15">
            {initials}
          </div>
          {shortName ? (
            <div className="hidden flex-col leading-none md:flex">
              <span className="text-xs font-medium text-text">{shortName}</span>
              <span className="text-[10px] text-muted">{greeting()}</span>
            </div>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
