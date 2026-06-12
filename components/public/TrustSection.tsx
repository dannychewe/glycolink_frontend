import { BadgeCheck, HeartHandshake, ShieldCheck, Waves } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/public/SectionLabel";

const trustItems = [
  {
    icon: BadgeCheck,
    title: "Verified Providers",
    description:
      "Patients connect with trusted healthcare professionals in a platform built for confidence.",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Secure Medical Records",
    description:
      "Sensitive health information is organized with privacy-first thinking and cleaner access patterns.",
    iconClass: "bg-success/10 text-success",
  },
  {
    icon: HeartHandshake,
    title: "Structured Clinical Care",
    description:
      "Consultations, follow-ups, and treatment guidance are presented in a clear patient-friendly flow.",
    iconClass: "bg-warning/10 text-warning",
  },
  {
    icon: Waves,
    title: "Continuous Monitoring",
    description:
      "Track progress over time with one connected experience instead of fragmented check-ins.",
    iconClass: "bg-primary/8 text-primary/70",
  },
];

export function TrustSection() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <SectionLabel index="02">Trust and safety</SectionLabel>
            <h2 className="text-3xl sm:text-4xl">Manage Your Diabetes with Confidence</h2>
            <p>
              Every touchpoint is designed to feel calm, dependable, and appropriate for real
              patient-provider relationships.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-success/20 bg-success/5 px-5 py-4 lg:text-right">
            <p className="font-mono text-3xl font-medium tabular-nums text-secondary">98%</p>
            <p className="mt-0.5 text-sm text-muted">patient satisfaction rate</p>
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
