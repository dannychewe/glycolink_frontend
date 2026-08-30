import { ProgrammeBillingDashboard } from "@/components/consultant/billing/ProgrammeBillingDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantBillingPricesPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Billing setup"
        title="Programme prices"
        description="Set the patient-facing price for diabetes continuity care and retire prices that should no longer be used."
        breadcrumbs={[
          { label: "Programme billing", href: "/consultant/billing" },
          { label: "Prices" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="billing" />
      <ProgrammePermissionGate permissions={["billing.manage"]}>
        <ProgrammeBillingDashboard workflow="prices" />
      </ProgrammePermissionGate>
    </Container>
  );
}
