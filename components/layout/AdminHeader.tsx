"use client";

import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { useQuery } from "@apollo/client";
import { ADMIN_HEADER_QUERY } from "@/lib/admin/graphql";

type AdminHeaderProps = Readonly<{
  title: string;
  onMenuClick: () => void;
}>;

type AdminHeaderData = {
  me: {
    email: string;
    fullName: string | null;
    primaryRole: string | null;
    isSuperuser: boolean;
  } | null;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function getInitials(email: string | null | undefined) {
  if (!email) return "AD";
  return email.slice(0, 2).toUpperCase();
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { data } = useQuery<AdminHeaderData>(ADMIN_HEADER_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const email = data?.me?.email ?? null;
  const name = data?.me?.fullName ?? null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 md:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text shadow-soft md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-center md:flex-row md:items-baseline md:gap-3">
          <h1 className="truncate text-base font-semibold text-text md:text-lg">{title}</h1>
          <span className="hidden text-xs text-muted md:block">{formatDate()}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-surface"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-2 ring-primary/15">
              {getInitials(email)}
            </div>
            <div className="hidden flex-col leading-none md:flex">
              <span className="max-w-36 truncate text-xs font-medium text-text">
                {name ?? email ?? "Admin"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <ShieldCheck className="size-3" />
                {data?.me?.isSuperuser ? "Superuser" : greeting()}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
