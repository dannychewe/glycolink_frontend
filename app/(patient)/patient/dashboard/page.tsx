"use client";

import Link from "next/link";
import { MessageSquare, Users, FileText, Pill } from "lucide-react";
import { OnboardingBanner } from "@/components/patient/dashboard/OnboardingBanner";
import { ConsultantInvitesSection } from "@/components/patient/dashboard/ConsultantInvitesSection";
import { PrimaryActionsRow } from "@/components/patient/dashboard/PrimaryActionsRow";
import { UpcomingAppointmentPanel } from "@/components/patient/dashboard/UpcomingAppointmentPanel";
import { UnreadMessagesPanel } from "@/components/patient/dashboard/UnreadMessagesPanel";
import { PaymentDuePanel } from "@/components/patient/dashboard/PaymentDuePanel";
import { BrowseProgrammesPanel } from "@/components/patient/dashboard/BrowseProgrammesPanel";
import { GlucoseHeroBand } from "@/components/patient/dashboard/GlucoseHeroBand";
import { PatientDiabetesHome } from "@/components/patient/programmes/PatientDiabetesHome";
import { usePatientOnboardingReadiness } from "@/lib/patient/use-onboarding-readiness";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

const quickActions = [
  { label: "Care team", href: "/patient/consultants", icon: Users },
  { label: "Message care team", href: "/patient/messages", icon: MessageSquare },
  { label: "Health record", href: "/patient/records", icon: FileText },
  { label: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
];

function QuickActionsRow() {
  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Quick actions">
      {quickActions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-3 text-center text-sm font-medium text-text transition-colors hover:bg-background"
        >
          <Icon className="size-5 text-muted" />
          <span>{label}</span>
        </Link>
      ))}
    </section>
  );
}

export default function PatientDashboardPage() {
  const today = new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const { ready } = usePatientOnboardingReadiness();

  return (
    <Container className="space-y-5 py-1 sm:space-y-6 sm:py-2">
      <PageHeader
        eyebrow="Diabetes care"
        title="Today"
        description="Your care, in one place."
        actions={<p className="text-sm font-semibold text-muted">{today}</p>}
      />

      <OnboardingBanner />

      {ready ? (
        <>
          <ConsultantInvitesSection />
          <GlucoseHeroBand />
          <PrimaryActionsRow />
          <PatientDiabetesHome />
          <UpcomingAppointmentPanel />
          <UnreadMessagesPanel />
          <PaymentDuePanel />
          <QuickActionsRow />
          <BrowseProgrammesPanel />
        </>
      ) : null}
    </Container>
  );
}
