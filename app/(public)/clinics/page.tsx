import type { Metadata } from "next";
import { Activity, AlertTriangle, ArrowRight, ClipboardCheck, CreditCard, LineChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "For Clinics | Naje Health Diabetes Continuity Care",
  description:
    "A clinic-led diabetes continuity-care platform for enrolment, care teams, care plans, monitoring gaps, alerts, reporting, and programme billing.",
};

const outcomes = [
  {
    icon: AlertTriangle,
    title: "Know who needs attention today",
    copy: "A clinic queue surfaces missed readings, unresolved alerts, readiness blockers, and patients drifting out of routine care.",
  },
  {
    icon: ClipboardCheck,
    title: "Standardize programme care",
    copy: "Enrol patients into structured diabetes programmes with baselines, care plans, monitoring schedules, and review cadence.",
  },
  {
    icon: CreditCard,
    title: "Keep billing connected",
    copy: "Programme prices, payers, invoices, payment status, and entitlement state stay tied to the patient enrolment.",
  },
];

const workflow = [
  "Create the clinic diabetes programme",
  "Enrol or invite patients",
  "Assign lead doctors, nurses, and care coordinators",
  "Approve baseline and activate the care plan",
  "Track monitoring gaps and glucose alerts",
  "Review reporting and billing performance",
];

const roles = ["Clinic admin", "Lead doctor", "Nurse", "Care coordinator", "Billing viewer"];

export default function ClinicsPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-border bg-surface py-14 sm:py-18 lg:py-20">
        <div className="clinical-grid grid-fade pointer-events-none absolute inset-0 opacity-60" />
        <Container className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
          <div className="max-w-3xl space-y-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              For clinics
            </p>
            <h1 className="font-display text-4xl font-medium leading-tight text-ink sm:text-5xl lg:text-6xl">
              Diabetes continuity care your team can run every day.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Naje Health helps clinics move from one-off telemedicine visits to an operational diabetes programme:
              enrol patients, assign care teams, manage monitoring, respond to alerts, report outcomes, and collect programme payments.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/register" size="lg">
                Start a clinic programme
                <ArrowRight className="size-4" />
              </Button>
              <Button href="/how-it-works" size="lg" variant="secondary">
                See workflow
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-5 shadow-subtle">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">Today</p>
                <p className="text-lg font-semibold text-ink">Clinic attention queue</p>
              </div>
              <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">12 need action</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Missed readings", "6 patients", "warning"],
                ["High glucose alerts", "3 unresolved", "danger"],
                ["Ready for activation", "2 enrolments", "success"],
                ["Payment follow-up", "1 invoice", "primary"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                  <span className="text-sm font-medium text-text">{label}</span>
                  <span className={`text-sm font-semibold ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-primary"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="space-y-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">What clinics get</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">A practical operating system for diabetes follow-up</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-lg border border-border bg-surface p-5 shadow-soft">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-surface py-12 sm:py-16">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">From enrolment to daily action</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              The product is designed around the clinical day: what is ready, what is blocked, who owns the next action, and what needs follow-up.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {workflow.map((item, index) => (
              <div key={item} className="rounded-lg border border-border bg-background p-4">
                <p className="font-mono text-xs text-muted">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-text">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <Users className="size-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-text">Role-aware clinic work</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Clinic admins, lead doctors, nurses, care coordinators, and billing viewers see the work that belongs to their role.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span key={role} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted">
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <Activity className="size-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-text">Monitoring between visits</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Glucose and vitals readings feed schedules, missed-monitoring gaps, alert queues, reminders, and patient daily tasks.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <LineChart className="size-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-text">Operational reporting</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Programme comparison, adherence trends, work queue performance, and billing metrics help clinics manage continuity care as a service.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-14 sm:pb-20">
        <Container>
          <div className="rounded-lg bg-ink px-6 py-10 text-center text-white shadow-subtle sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight">Make diabetes follow-up visible, assigned, and billable.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Naje Health gives clinics the daily workflow needed to keep enrolled diabetic patients moving through structured care.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/register" size="lg" className="bg-white text-primary hover:bg-blue-50">
                Start a clinic programme
              </Button>
              <Button href="/providers" size="lg" className="border border-white/25 bg-white/10 text-white hover:bg-white/20">
                View care network
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
