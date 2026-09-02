"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  isPatientRouteActive,
  type PatientNavigationItem,
} from "@/lib/navigation/patient-navigation";
import { PatientNavIcon } from "@/components/layout/PatientSidebar";

const mobileTabs: PatientNavigationItem[] = [
  {
    label: "Today",
    href: "/patient/dashboard",
    icon: "dashboard",
  },
  {
    label: "Monitor",
    href: "/patient/monitoring",
    icon: "monitoring",
  },
  {
    label: "Messages",
    href: "/patient/messages",
    icon: "messages",
  },
  {
    label: "Bookings",
    href: "/patient/bookings",
    icon: "appointments",
  },
];

export function PatientMobileNavigation({ onMoreClick }: Readonly<{ onMoreClick: () => void }>) {
  const pathname = usePathname();
  const activeInMore =
    pathname != null &&
    !mobileTabs.some((item) => isPatientRouteActive(pathname, item.href));

  return (
    <nav
      aria-label="Patient app navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {mobileTabs.map((item) => {
          const isActive = isPatientRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition active:scale-[0.98]",
                isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-text",
              )}
            >
              <PatientNavIcon icon={item.icon} isActive={isActive} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMoreClick}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition active:scale-[0.98]",
            activeInMore ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-text",
          )}
        >
          <MoreHorizontal className={cn("size-5", activeInMore ? "text-primary" : "text-muted")} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
