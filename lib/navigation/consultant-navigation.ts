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
    label: "Dashboard",
    href: "/consultant/dashboard",
    icon: "dashboard",
  },
  {
    label: "Appointments",
    href: "/consultant/appointments",
    icon: "appointments",
  },
  {
    label: "Patients",
    href: "/consultant/patients",
    icon: "patients",
  },
  {
    label: "Consultations",
    href: "/consultant/consultations",
    icon: "consultations",
  },
  {
    label: "Prescriptions",
    href: "/consultant/prescriptions",
    icon: "prescriptions",
  },
  {
    label: "Labs",
    href: "/consultant/labs",
    icon: "labs",
  },
  {
    label: "Monitoring",
    href: "/consultant/monitoring",
    icon: "monitoring",
  },
  {
    label: "Organization",
    href: "/consultant/organization",
    icon: "organization",
  },
  {
    label: "PCQ Templates",
    href: "/consultant/pcq",
    icon: "pcq",
  },
  {
    label: "Messages",
    href: "/consultant/messages",
    icon: "messages",
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
