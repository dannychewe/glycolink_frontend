import { BadgeCheck, HeartHandshake, ShieldCheck, Waves } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/public/SectionLabel";

const trustItems = [
  {
    icon: BadgeCheck,
    title: "Structured Programmes",
    description:
      "Every patient is enrolled into a Naje Health programme with defined goals, monitoring schedules, and a dedicated care team.",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Your Data, Protected",
    description:
      "Baseline assessments, care plans, readings, and clinical notes are kept private and only visible to your care team.",
    iconClass: "bg-success/10 text-success",
  },
  {
    icon: HeartHandshake,
    title: "Coordinated Care Team",
    description:
      "Nurses, coordinators, and doctors at Naje Health work from the same view with clear handoffs — so nothing falls through the cracks.",
    iconClass: "bg-warning/10 text-warning",
  },
  {
    icon: Waves,
    title: "Monitoring and Alerts",
    description:
      "Missed readings, glucose signals, and reminders keep both you and your Naje Health care team informed on what needs attention.",
    iconClass: "bg-primary/8 text-primary/70",
  },
];

export function TrustSection() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <SectionLabel index="02">Why Naje Health</SectionLabel>
            <h2 className="text-3xl sm:text-4xl">Built for accountable diabetes follow-up</h2>
            <p>
              Naje Health gives you the structure to manage your diabetes between visits —
              where adherence, escalation, and continuity usually break down.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-success/20 bg-success/5 px-5 py-4 lg:text-right">
            <p className="font-mono text-3xl font-medium tabular-nums text-secondary">Daily</p>
            <p className="mt-0.5 text-sm text-muted">attention queue for care teams</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map(({ icon: Icon, title, description, iconClass }) => (
            <Card key={title} className="h-full border-border/80 bg-white/85">
              <CardHeader className="space-y-4">
                <div className={`flex size-12 items-center justify-center rounded-2xl ${iconClass}`}>
                  <Icon className="size-5" />
                </div>
                <CardTitle>{title}</CardTitle>
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
