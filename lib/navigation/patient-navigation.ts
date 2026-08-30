export type PatientNavigationItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "appointments"
    | "questionnaires"
    | "providers"
    | "consultants"
    | "messages"
    | "records"
    | "prescriptions"
    | "labs"
    | "monitoring"
    | "payments"
    | "profile"
    | "settings"
    | "notifications";
};

export const patientMainNavigation: PatientNavigationItem[] = [
  {
    label: "Today's Care",
    href: "/patient/dashboard",
    icon: "dashboard",
  },
  {
    label: "Monitoring",
    href: "/patient/monitoring",
    icon: "monitoring",
  },
  {
    label: "Care Baseline",
    href: "/patient/pcq",
    icon: "questionnaires",
  },
  {
    label: "Care Plan",
    href: "/patient/records",
    icon: "records",
  },
  {
    label: "Programme Billing",
    href: "/patient/payments",
    icon: "payments",
  },
  {
    label: "Care Team Messages",
    href: "/patient/messages",
    icon: "messages",
  },
  {
    label: "Medicines",
    href: "/patient/prescriptions",
    icon: "prescriptions",
  },
  {
    label: "Labs",
    href: "/patient/labs",
    icon: "labs",
  },
  {
    label: "Appointments",
    href: "/patient/bookings",
    icon: "appointments",
  },
  {
    label: "My Care Team",
    href: "/patient/consultants",
    icon: "consultants",
  },
  {
    label: "Find Providers",
    href: "/patient/providers",
    icon: "providers",
  },
];

export const patientSecondaryNavigation: PatientNavigationItem[] = [
  {
    label: "Profile",
    href: "/patient/profile",
    icon: "profile",
  },
  {
    label: "Settings",
    href: "/patient/settings",
    icon: "settings",
  },
  {
    label: "Notifications",
    href: "/patient/notifications",
    icon: "notifications",
  },
];

const patientNavigation = [
  ...patientMainNavigation,
  ...patientSecondaryNavigation,
];

export function isPatientRouteActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPatientPageTitle(pathname: string | null) {
  if (!pathname) return "Patient";
  const matchedItem = patientNavigation.find((item) =>
    isPatientRouteActive(pathname, item.href),
  );

  return matchedItem?.label ?? "Patient";
}
