export type AdminNavigationItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "providers"
    | "payments"
    | "corporate"
    | "organizations"
    | "pcq"
    | "reviews"
    | "audit"
    | "tenants"
    | "notifications"
    | "settings";
};

export const adminMainNavigation: AdminNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "dashboard",
  },
  {
    label: "Provider Reviews",
    href: "/admin/providers",
    icon: "providers",
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: "payments",
  },
  {
    label: "Corporate",
    href: "/admin/corporate",
    icon: "corporate",
  },
  {
    label: "Organizations",
    href: "/admin/organizations",
    icon: "organizations",
  },
  {
    label: "PCQ Templates",
    href: "/admin/pcq",
    icon: "pcq",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: "reviews",
  },
  {
    label: "Audit Events",
    href: "/admin/audit",
    icon: "audit",
  },
  {
    label: "Tenants",
    href: "/admin/tenants",
    icon: "tenants",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: "notifications",
  },
];

export const adminSecondaryNavigation: AdminNavigationItem[] = [
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "settings",
  },
];

const adminNavigation = [...adminMainNavigation, ...adminSecondaryNavigation];

export function isAdminRouteActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminPageTitle(pathname: string | null) {
  const matchedItem = adminNavigation.find((item) =>
    isAdminRouteActive(pathname, item.href),
  );

  return matchedItem?.label ?? "Admin";
}
