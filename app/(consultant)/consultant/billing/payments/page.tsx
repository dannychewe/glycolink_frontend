import { ProgrammeBillingDashboard } from "@/components/consultant/billing/ProgrammeBillingDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantBillingPaymentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Collections"
        title="Payment status"
        description="Review and refresh mobile money payment status for programme invoices."
        breadcrumbs={[
          { label: "Programme billing", href: "/consultant/billing" },
          { label: "Payments" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="billing" />
      <ProgrammePermissionGate permissions={["billing.view"]}>
        <ProgrammeBillingDashboard workflow="payments" />
      </ProgrammePermissionGate>
    </Container>
  );
}
