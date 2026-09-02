import { Activity, CalendarPlus, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { OnboardingBanner } from "@/components/patient/dashboard/OnboardingBanner";
import { ConsultantInvitesSection } from "@/components/patient/dashboard/ConsultantInvitesSection";
import { PatientDiabetesHome } from "@/components/patient/programmes/PatientDiabetesHome";
import { Container } from "@/components/ui/container";

const quickActions = [
  {
    label: "Log reading",
    href: "/patient/monitoring",
    icon: Activity,
  },
  {
    label: "Message care team",
    href: "/patient/messages",
    icon: MessageSquare,
  },
  {
    label: "Book visit",
    href: "/patient/providers",
    icon: CalendarPlus,
  },
  {
    label: "Care team",
    href: "/patient/consultants",
    icon: Users,
  },
];

export default function PatientDashboardPage() {
  const today = new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Container className="space-y-5 py-1 sm:space-y-6 sm:py-2">
      <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Diabetes Programme
          </p>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Today&apos;s Care</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Your readings, care plan, and programme billing in one place.
          </p>
        </div>
        <p className="text-xs font-semibold text-muted sm:text-sm">{today}</p>
      </header>

      <section className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:hidden" aria-label="Quick actions">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-text transition active:scale-[0.98]"
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </Link>
        ))}
      </section>

      <OnboardingBanner />

      <ConsultantInvitesSection />

      <PatientDiabetesHome />
    </Container>
  );
}
