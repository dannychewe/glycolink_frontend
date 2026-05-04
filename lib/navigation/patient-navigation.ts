export type PatientNavigationItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "appointments"
    | "providers"
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
    label: "Dashboard",
    href: "/patient/dashboard",
    icon: "dashboard",
  },
  {
    label: "Appointments",
    href: "/patient/bookings",
    icon: "appointments",
  },
  {
    label: "Providers",
    href: "/patient/providers",
    icon: "providers",
  },
  {
    label: "Prescriptions",
    href: "/patient/prescriptions",
    icon: "prescriptions",
  },
  {
    label: "Labs",
    href: "/patient/labs",
    icon: "labs",
  },
  {
    label: "Monitoring",
    href: "/patient/monitoring",
    icon: "monitoring",
  },
  {
    label: "Payments",
    href: "/patient/payments",
    icon: "payments",
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
