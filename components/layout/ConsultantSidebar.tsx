"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  consultantMainNavigation,
  consultantSecondaryNavigation,
  isConsultantRouteActive,
  type ConsultantNavigationItem,
} from "@/lib/navigation/consultant-navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";

type ConsultantSidebarProps = Readonly<{
  className?: string;
  onNavigate?: () => void;
}>;

function NavIcon({
  icon,
  isActive,
}: Readonly<{
  icon: ConsultantNavigationItem["icon"];
  isActive: boolean;
}>) {
  const iconClassName = cn(
    "size-5 transition-colors",
    isActive ? "text-primary" : "text-muted",
  );

  if (icon === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "appointments") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "patients") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "consultations") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "prescriptions") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M8 4h8l4 4v12H4V4h4Zm0 0v4h8V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "labs") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M10 3v6.2L5.8 16a4 4 0 0 0 3.5 6h5.4a4 4 0 0 0 3.5-6L14 9.2V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "monitoring") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M3 12h4l2.5-4 4 8 2.5-4H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "organization") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "pcq") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h.01M9 16h.01M13 12h2M13 16h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "messages") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10ZM9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "notifications") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "availability") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M8 2v3M16 2v3M4 8h16M6 5h12a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm10 11 1.5 1.5L21 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "settings") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5-.9-.3a7.7 7.7 0 0 0-.7-1.7l.5-.8a1 1 0 0 0-.1-1.2l-1.4-1.4a1 1 0 0 0-1.2-.1l-.8.5a7.7 7.7 0 0 0-1.7-.7L13 4a1 1 0 0 0-1-.8h-2a1 1 0 0 0-1 .8l-.3.9a7.7 7.7 0 0 0-1.7.7l-.8-.5a1 1 0 0 0-1.2.1L3.6 6.6a1 1 0 0 0-.1 1.2l.5.8a7.7 7.7 0 0 0-.7 1.7L2.4 11a1 1 0 0 0-.8 1v2a1 1 0 0 0 .8 1l.9.3a7.7 7.7 0 0 0 .7 1.7l-.5.8a1 1 0 0 0 .1 1.2l1.4 1.4a1 1 0 0 0 1.2.1l.8-.5a7.7 7.7 0 0 0 1.7.7l.3.9a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.3-.9a7.7 7.7 0 0 0 1.7-.7l.8.5a1 1 0 0 0 1.2-.1l1.4-1.4a1 1 0 0 0 .1-1.2l-.5-.8a7.7 7.7 0 0 0 .7-1.7l.9-.3a1 1 0 0 0 .8-1v-2a1 1 0 0 0-.8-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return null;
}

export function ConsultantSidebar({
  className,
  onNavigate,
}: ConsultantSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-border bg-surface",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <div>
            <p className="text-sm font-semibold tracking-tight text-text">Naje Health</p>
            <p className="text-xs text-muted">Consultant workspace</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        <div className="space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Main
          </p>
          <nav className="space-y-1">
            {consultantMainNavigation.map((item) => {
              const isActive = isConsultantRouteActive(pathname ?? "", item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text hover:bg-background",
                  )}
                >
                  <NavIcon icon={item.icon} isActive={isActive} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border pt-6">
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Secondary
            </p>
            <nav className="space-y-1">
              {consultantSecondaryNavigation.map((item) => {
                const isActive = isConsultantRouteActive(pathname ?? "", item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-text hover:bg-background",
                    )}
                  >
                    <NavIcon icon={item.icon} isActive={isActive} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
