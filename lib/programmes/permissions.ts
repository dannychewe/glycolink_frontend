import type { AuthUser } from "@/features/auth/auth-context";

export type ProgrammeClinicRole =
  | "clinic_admin"
  | "lead_doctor"
  | "nurse"
  | "care_coordinator"
  | "billing_viewer"
  | "billing_admin";

export type ProgrammePermission =
  | "programme.manage"
  | "programme.enrol"
  | "care_plan.view"
  | "care_plan.manage"
  | "monitoring.manage"
  | "alerts.manage"
  | "alerts.assign"
  | "reports.view"
  | "billing.view"
  | "billing.manage";

export type ProgrammeAccess = {
  roles: ProgrammeClinicRole[];
  permissions: ProgrammePermission[];
  memberships: NonNullable<AuthUser["clinicAccess"]>["memberships"];
  permissionModelAvailable: boolean;
};

const knownRoles = new Set<ProgrammeClinicRole>([
  "clinic_admin",
  "lead_doctor",
  "nurse",
  "care_coordinator",
  "billing_viewer",
  "billing_admin",
]);

const broadConsultantFallback: ProgrammePermission[] = [
  "programme.enrol",
  "care_plan.view",
  "care_plan.manage",
  "monitoring.manage",
  "alerts.manage",
  "alerts.assign",
  "reports.view",
];

const broadAdminFallback: ProgrammePermission[] = [
  "programme.manage",
  "programme.enrol",
  "care_plan.view",
  "care_plan.manage",
  "monitoring.manage",
  "alerts.manage",
  "alerts.assign",
  "reports.view",
  "billing.view",
  "billing.manage",
];

function normalizeRole(value?: string | null): ProgrammeClinicRole | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  return knownRoles.has(normalized as ProgrammeClinicRole) ? (normalized as ProgrammeClinicRole) : null;
}

function normalizePermission(value?: string | null): ProgrammePermission | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.includes(".") ? (normalized as ProgrammePermission) : null;
}

export function getProgrammeAccess(user?: AuthUser | null): ProgrammeAccess {
  const rawRoles = user?.clinicRoles ?? user?.clinicAccess?.roles ?? [];
  const rawPermissions = user?.clinicPermissions ?? user?.clinicAccess?.permissions ?? [];
  const permissionModelAvailable = Boolean(user && (user.clinicRoles || user.clinicPermissions || user.clinicAccess));

  const roles = Array.from(new Set(rawRoles.map(normalizeRole).filter(Boolean))) as ProgrammeClinicRole[];
  const permissions = Array.from(new Set(rawPermissions.map(normalizePermission).filter(Boolean))) as ProgrammePermission[];

  if (!permissionModelAvailable) {
    const accountType = (user?.accountType ?? user?.primaryRole ?? "").toString().toUpperCase();
    if (accountType === "ADMIN") {
      return { roles: ["clinic_admin", "billing_admin"], permissions: broadAdminFallback, memberships: [], permissionModelAvailable };
    }
    if (accountType === "CONSULTANT") {
      return { roles: ["lead_doctor"], permissions: broadConsultantFallback, memberships: [], permissionModelAvailable };
    }
  }

  return {
    roles,
    permissions,
    memberships: user?.clinicAccess?.memberships ?? [],
    permissionModelAvailable,
  };
}

export function hasProgrammePermission(user: AuthUser | null | undefined, permission: ProgrammePermission) {
  return getProgrammeAccess(user).permissions.includes(permission);
}

export function hasAnyProgrammePermission(user: AuthUser | null | undefined, permissions: ProgrammePermission[]) {
  const access = getProgrammeAccess(user);
  return permissions.some((permission) => access.permissions.includes(permission));
}

export function canAccessConsultantRoute(user: AuthUser | null | undefined, href: string) {
  if (href === "/consultant/programmes") {
    return hasAnyProgrammePermission(user, ["programme.manage", "programme.enrol"]);
  }

  if (href === "/consultant/billing") {
    return hasProgrammePermission(user, "billing.view");
  }

  if (href === "/consultant/reports") {
    return hasProgrammePermission(user, "reports.view");
  }

  if (href === "/consultant/monitoring" || href.startsWith("/consultant/monitoring/alerts")) {
    return hasAnyProgrammePermission(user, ["monitoring.manage", "alerts.manage"]);
  }

  if (href === "/consultant/clinical-rules") {
    return hasAnyProgrammePermission(user, ["care_plan.manage", "monitoring.manage", "alerts.assign"]);
  }

  return true;
}
