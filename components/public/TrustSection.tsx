import { BadgeCheck, HeartHandshake, ShieldCheck, Waves } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/public/SectionLabel";

const trustItems = [
  {
    icon: BadgeCheck,
    title: "Clinic-Owned Programmes",
    description:
      "Each programme is scoped to the clinic, its care team, and the patients enrolled into ongoing diabetes care.",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Protected Patient Context",
    description:
      "Baseline assessments, care plans, readings, and notes are organized around tenant-scoped access.",
    iconClass: "bg-success/10 text-success",
  },
  {
    icon: HeartHandshake,
    title: "Care-Team Workflow",
    description:
      "Nurses, coordinators, doctors, and billing staff can work from the same programme view with clearer handoffs.",
    iconClass: "bg-warning/10 text-warning",
  },
  {
    icon: Waves,
    title: "Monitoring and Alerts",
    description:
      "Missed readings, glucose signals, reminders, and alert ownership help clinics know who needs action today.",
    iconClass: "bg-primary/8 text-primary/70",
  },
];

export function TrustSection() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <SectionLabel index="02">Clinic readiness</SectionLabel>
            <h2 className="text-3xl sm:text-4xl">Built for accountable diabetes follow-up</h2>
            <p>
              Naje Health gives clinics the structure to manage diabetic patients between visits,
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
