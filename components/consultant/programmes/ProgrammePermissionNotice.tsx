import { ShieldCheck } from "lucide-react";
import { Panel, PanelBody } from "@/components/ui/panel";

export function ProgrammePermissionNotice({ scope }: { scope: "admin" | "billing" | "reporting" | "clinical" }) {
  const copy = {
    admin: "Programme setup and enrolment actions require clinic admin, lead doctor, or care coordinator permissions in the selected clinic.",
    billing: "Billing setup and invoice actions require clinic billing permissions. Clinical staff may still see care status without payment administration rights.",
    reporting: "Clinic reporting is scoped by tenant and programme. Nurses, care coordinators, lead doctors, and admins may see different totals based on backend access.",
    clinical: "Clinical alert and care-plan actions are scoped to the patient relationship, care-team assignment, and clinic role.",
  }[scope];

  return (
    <Panel>
      <PanelBody className="flex items-start gap-3 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted">{copy}</p>
      </PanelBody>
    </Panel>
  );
}
