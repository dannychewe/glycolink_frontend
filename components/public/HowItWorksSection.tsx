import { CalendarCheck2, ClipboardPlus, HeartPulse, UserRoundPlus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/public/SectionLabel";

const steps = [
  {
    icon: UserRoundPlus,
    title: "Create your account",
    description: "Sign up in minutes and build your health profile with the essentials you need.",
  },
  {
    icon: CalendarCheck2,
    title: "Book a verified provider",
    description: "Compare specialists and choose a provider that fits your goals and schedule.",
  },
  {
    icon: ClipboardPlus,
    title: "Attend consultation",
    description: "Connect with your provider through a structured care flow designed for clarity.",
  },
  {
    icon: HeartPulse,
    title: "Track your health",
    description: "Follow your plan, review updates, and stay connected to your progress over time.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-4">
          <SectionLabel index="01">How it works</SectionLabel>
          <h2 className="text-3xl sm:text-4xl">Four steps to better diabetes care</h2>
          <p>
            Naje Health removes friction from everyday diabetes support with a guided care journey
            that feels structured on desktop and effortless on mobile.
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
