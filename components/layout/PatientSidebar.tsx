"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  isPatientRouteActive,
  patientMainNavigation,
  patientSecondaryNavigation,
  type PatientNavigationItem,
} from "@/lib/navigation/patient-navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";

type PatientSidebarProps = Readonly<{
  className?: string;
  onNavigate?: () => void;
}>;

function NavIcon({
  icon,
  isActive,
}: Readonly<{
  icon: PatientNavigationItem["icon"];
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

  if (icon === "providers") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M5 20v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

  if (icon === "payments") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M4 7h16v10H4zM4 10h16M8 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClassName} aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-13v3m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  onNavigate,
}: Readonly<{
  title: string;
  items: PatientNavigationItem[];
  pathname: string | null;
  onNavigate?: () => void;
}>) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = isPatientRouteActive(pathname, item.href);

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
  );
}

export function PatientSidebar({
  className,
  onNavigate,
}: PatientSidebarProps) {
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
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-white">
            G
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-text">Naje Health</p>
            <p className="text-xs text-muted">Patient workspace</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        <SidebarSection
          title="Main"
          items={patientMainNavigation}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        <div className="border-t border-border pt-6">
          <SidebarSection
            title="Secondary"
            items={patientSecondaryNavigation}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
