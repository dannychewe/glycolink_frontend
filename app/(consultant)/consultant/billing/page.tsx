import { ProgrammeBillingDashboard } from "@/components/consultant/billing/ProgrammeBillingDashboard";
import { ProgrammePermissionNotice } from "@/components/consultant/programmes/ProgrammePermissionNotice";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantBillingPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Diabetes programme"
        title="Programme billing"
        description="Track programme invoices, collections, entitlement status, and billing setup gaps."
      />

      <ProgrammePermissionNotice scope="billing" />
      <ProgrammeBillingDashboard />
    </Container>
  );
}
