export type ConsultantNavigationItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "appointments"
    | "patients"
    | "consultations"
    | "prescriptions"
    | "labs"
    | "monitoring"
    | "organization"
    | "billing"
    | "pcq"
    | "clinical-rules"
    | "messages"
    | "notifications"
    | "availability"
    | "profile"
    | "settings";
};

export const consultantMainNavigation: ConsultantNavigationItem[] = [
  {
    label: "Today's Queue",
    href: "/consultant/dashboard",
    icon: "dashboard",
  },
  {
    label: "Diabetes Cohort",
    href: "/consultant/patients",
    icon: "patients",
  },
  {
    label: "Care Programmes",
    href: "/consultant/programmes",
    icon: "organization",
  },
  {
    label: "Monitoring Ops",
    href: "/consultant/monitoring",
    icon: "monitoring",
  },
  {
    label: "Alert Work Queue",
    href: "/consultant/monitoring/alerts",
    icon: "clinical-rules",
  },
  {
    label: "Programme Billing",
    href: "/consultant/billing",
    icon: "billing",
  },
  {
    label: "Programme Reports",
    href: "/consultant/reports",
    icon: "monitoring",
  },
  {
    label: "Baseline Templates",
    href: "/consultant/pcq",
    icon: "pcq",
  },
  {
    label: "Labs",
    href: "/consultant/labs",
    icon: "labs",
  },
  {
    label: "Prescriptions",
    href: "/consultant/prescriptions",
    icon: "prescriptions",
  },
  {
    label: "Care Team Messages",
    href: "/consultant/messages",
    icon: "messages",
  },
  {
    label: "Appointments",
    href: "/consultant/appointments",
    icon: "appointments",
  },
  {
    label: "Consultations",
    href: "/consultant/consultations",
    icon: "consultations",
  },
  {
    label: "Organization",
    href: "/consultant/organization",
    icon: "organization",
  },
  {
    label: "Notifications",
    href: "/consultant/notifications",
    icon: "notifications",
  },
];

export const consultantSecondaryNavigation: ConsultantNavigationItem[] = [
  {
    label: "Availability",
    href: "/consultant/availability",
    icon: "availability",
  },
  {
    label: "Profile",
    href: "/consultant/profile",
    icon: "profile",
  },
  {
    label: "Clinical Rules",
    href: "/consultant/clinical-rules",
    icon: "clinical-rules",
  },
  {
    label: "Settings",
    href: "/consultant/settings",
    icon: "settings",
  },
];

const consultantNavigation = [
  ...consultantMainNavigation,
  ...consultantSecondaryNavigation,
];

export function isConsultantRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getConsultantPageTitle(pathname: string) {
  const matchedItem = consultantNavigation.find((item) =>
    isConsultantRouteActive(pathname, item.href),
  );

  return matchedItem?.label ?? "Consultant";
}
