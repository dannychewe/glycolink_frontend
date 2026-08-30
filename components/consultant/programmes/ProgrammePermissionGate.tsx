"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import {
  getProgrammeAccess,
  hasAnyProgrammePermission,
  type ProgrammePermission,
} from "@/lib/programmes/permissions";
import { Panel, PanelBody } from "@/components/ui/panel";

const roleLabels: Record<string, string> = {
  clinic_admin: "Clinic admin",
  lead_doctor: "Lead doctor",
  nurse: "Nurse",
  care_coordinator: "Care coordinator",
  billing_viewer: "Billing viewer",
  billing_admin: "Billing admin",
};

const permissionLabels: Record<ProgrammePermission, string> = {
  "programme.manage": "manage care programmes",
  "programme.enrol": "enrol and assign patients",
  "care_plan.view": "view care plans",
  "care_plan.manage": "manage care plans",
  "monitoring.manage": "manage monitoring",
  "alerts.manage": "work clinical alerts",
  "alerts.assign": "assign clinical alerts",
  "reports.view": "view clinic reports",
  "billing.view": "view billing",
  "billing.manage": "manage billing",
};

export function ProgrammeAccessSummary() {
  const { user } = useAuth();
  const access = getProgrammeAccess(user);
  const roles = access.roles.map((role) => roleLabels[role] ?? role);

  return (
    <Panel>
      <PanelBody className="flex flex-col gap-3 py-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-text">Clinic access</p>
            <p className="text-xs leading-5 text-muted">
              {roles.length > 0 ? roles.join(", ") : "No active clinic-scoped role found for this account."}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted">
          {access.permissionModelAvailable ? "Session permissions are active." : "Using legacy role fallback until session permissions refresh."}
        </p>
      </PanelBody>
    </Panel>
  );
}

export function ProgrammePermissionGate({
  permissions,
  children,
}: Readonly<{
  permissions: ProgrammePermission[];
  children: React.ReactNode;
}>) {
  const { user } = useAuth();
  const allowed = hasAnyProgrammePermission(user, permissions);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <Panel>
      <PanelBody className="flex items-start gap-3 py-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-text">Restricted clinic action</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            This screen requires permission to {permissions.map((permission) => permissionLabels[permission]).join(" or ")}.
            Ask a clinic admin to update your tenant or organization membership.
          </p>
        </div>
      </PanelBody>
    </Panel>
  );
}
