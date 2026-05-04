"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  BriefcaseBusiness,
  Building,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MessageSquareWarning,
  Settings,
  UserCheck,
} from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import {
  adminMainNavigation,
  adminSecondaryNavigation,
  isAdminRouteActive,
  type AdminNavigationItem,
} from "@/lib/navigation/admin-navigation";
import { cn } from "@/lib/utils/cn";

type AdminSidebarProps = Readonly<{
  className?: string;
  onNavigate?: () => void;
}>;

const iconMap = {
  dashboard: LayoutDashboard,
  providers: UserCheck,
  payments: CreditCard,
  corporate: BriefcaseBusiness,
  organizations: Building,
  pcq: ClipboardCheck,
  reviews: MessageSquareWarning,
  audit: ClipboardList,
  tenants: Building2,
  notifications: Bell,
  settings: Settings,
} satisfies Record<AdminNavigationItem["icon"], typeof LayoutDashboard>;

function NavIcon({
  icon,
  isActive,
}: Readonly<{
  icon: AdminNavigationItem["icon"];
  isActive: boolean;
}>) {
  const Icon = iconMap[icon];

  return (
    <Icon
      className={cn(
        "size-5 transition-colors",
        isActive ? "text-primary" : "text-muted",
      )}
      aria-hidden="true"
    />
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  onNavigate,
}: Readonly<{
  title: string;
  items: AdminNavigationItem[];
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
          const isActive = isAdminRouteActive(pathname, item.href);

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

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
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
            <p className="text-sm font-semibold tracking-tight text-text">GlycoLink</p>
            <p className="text-xs text-muted">Admin workspace</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        <SidebarSection
          title="Main"
          items={adminMainNavigation}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        <div className="border-t border-border pt-6">
          <SidebarSection
            title="Secondary"
            items={adminSecondaryNavigation}
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
