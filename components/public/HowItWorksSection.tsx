import { CalendarCheck2, ClipboardPlus, HeartPulse, UserRoundPlus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/public/SectionLabel";

const steps = [
  {
    icon: UserRoundPlus,
    title: "Register and get enrolled",
    description: "Create your Naje Health account, complete a diabetes baseline, and get enrolled into a programme by our care team.",
  },
  {
    icon: CalendarCheck2,
    title: "Receive your care plan",
    description: "Your care team builds a personalised plan with goals, follow-ups, lab reviews, medication checks, and monitoring.",
  },
  {
    icon: ClipboardPlus,
    title: "Follow your daily tasks",
    description: "Log glucose readings, attend appointments, complete labs, and stay on track with reminders from your care team.",
  },
  {
    icon: HeartPulse,
    title: "Stay connected to your team",
    description: "Your doctors, nurses, and coordinators at Naje Health review your progress, respond to alerts, and adjust your plan.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-4">
          <SectionLabel index="01">How it works</SectionLabel>
          <h2 className="text-3xl sm:text-4xl">Your diabetes care journey with Naje Health</h2>
          <p>
            From enrolment to daily follow-up, Naje Health gives you a clear plan,
            a monitoring rhythm, and a care team that stays connected to your progress.
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
