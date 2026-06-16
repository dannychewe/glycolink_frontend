"use client";

import { PaymentsComingSoonNotice } from "@/components/patient/payments/PaymentsComingSoonNotice";

export function GraphqlPaymentsListView() {
  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Billing
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Payments</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Review your consultation payments and current status.
          </p>
        </div>
      </header>

      <PaymentsComingSoonNotice />
    </div>
  );
}
