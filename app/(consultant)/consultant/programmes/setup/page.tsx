"use client";

import { useSearchParams } from "next/navigation";
import { ProgrammeAdminDashboard } from "@/components/consultant/programmes/ProgrammeAdminDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";

export default function ConsultantProgrammeSetupPage() {
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit") ?? undefined;

  return (
    <Container className="space-y-6 py-2">
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="admin" />
      <ProgrammePermissionGate permissions={["programme.manage"]}>
        <ProgrammeAdminDashboard workflow="setup" programmeId={editId} />
      </ProgrammePermissionGate>
    </Container>
  );
}
