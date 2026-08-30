import { CalendarCheck2, ClipboardPlus, HeartPulse, UserRoundPlus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/public/SectionLabel";

const steps = [
  {
    icon: UserRoundPlus,
    title: "Set up a clinic programme",
    description: "Create a diabetes care programme with enrolment rules, care-team roles, monitoring cadence, and billing setup.",
  },
  {
    icon: CalendarCheck2,
    title: "Enroll and assess patients",
    description: "Invite patients, capture their diabetes baseline, and prepare the clinical context before activation.",
  },
  {
    icon: ClipboardPlus,
    title: "Activate care plans",
    description: "Turn goals, follow-ups, lab reviews, medication checks, and monitoring requirements into one coordinated plan.",
  },
  {
    icon: HeartPulse,
    title: "Work the daily queue",
    description: "See who needs attention today, act on missed readings and alerts, and keep adherence visible for the clinic.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-4">
          <SectionLabel index="01">How it works</SectionLabel>
          <h2 className="text-3xl sm:text-4xl">A practical operating system for diabetes continuity care</h2>
          <p>
            Naje Health helps clinics move beyond one-off visits by giving every enrolled patient
            a clear plan, a monitoring rhythm, and a care team that can see what needs attention.
          </p>
        </div>

        <div className="relative grid gap-4 lg:grid-cols-4">
          <div className="absolute inset-x-[calc(12.5%+1.5rem)] top-[2.75rem] hidden h-px bg-gradient-to-r from-border/30 via-border/70 to-border/30 lg:block" />

          {steps.map(({ icon: Icon, title, description }, index) => (
            <Card key={title} className="relative h-full border-border/80 bg-white/85">
              <CardHeader className="space-y-4 pb-3">
                <div className="relative flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold tabular-nums text-white shadow-soft">
                    {index + 1}
                  </span>
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
