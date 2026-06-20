"use client";

import { PaymentsComingSoonNotice } from "@/components/patient/payments/PaymentsComingSoonNotice";
import { PageHeader } from "@/components/ui/page-header";

export function GraphqlPaymentsListView() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Payments"
        description="Review your consultation payments and current status."
      />

      <PaymentsComingSoonNotice />
    </div>
  );
}
