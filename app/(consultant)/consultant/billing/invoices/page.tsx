import { ProgrammeBillingDashboard } from "@/components/consultant/billing/ProgrammeBillingDashboard";
import { ProgrammeAccessSummary, ProgrammePermissionGate } from "@/components/consultant/programmes/ProgrammePermissionGate";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantBillingInvoicesPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Payment requests"
        title="Programme invoices"
        description="Attach a payer and price to an enrolment, then create a payment request for continuity care."
        breadcrumbs={[
          { label: "Programme billing", href: "/consultant/billing" },
          { label: "Invoices" },
        ]}
      />
      <ProgrammeAccessSummary />
      <ProgrammePermissionNotice scope="billing" />
      <ProgrammePermissionGate permissions={["billing.manage"]}>
        <ProgrammeBillingDashboard workflow="invoices" />
      </ProgrammePermissionGate>
    </Container>
  );
}
