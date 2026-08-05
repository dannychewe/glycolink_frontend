"use client";

import { Activity, Bell, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultantGlucoseReadingsOverview } from "@/components/consultant/monitoring/ConsultantGlucoseReadingsOverview";

const sections = [
  {
    title: "Glucose readings",
    description: "Review latest patient glucose logs and open a patient-specific monitoring record.",
    href: "/consultant/monitoring/readings",
    icon: Activity,
  },
  {
    title: "Patient alerts",
    description: "Review and acknowledge monitoring alerts that need consultant attention.",
    href: "/consultant/monitoring/alerts",
    icon: Bell,
  },
  {
    title: "Thresholds",
    description: "Configure glucose thresholds for patients under your care.",
    href: "/consultant/monitoring/thresholds",
    icon: SlidersHorizontal,
  },
];

export function GraphqlConsultantMonitoringView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(({ title, description, href, icon: Icon }) => (
          <div key={href} className="rounded-lg border border-border bg-surface p-5">
            <Icon className="mb-4 size-5 text-primary" />
            <p className="text-sm font-semibold text-text">{title}</p>
            <p className="mt-1 min-h-12 text-sm leading-6 text-muted">{description}</p>
            <Button href={href} variant="secondary" size="sm" className="mt-4">
              Open
            </Button>
          </div>
        ))}
      </div>

      <ConsultantGlucoseReadingsOverview limit={8} showViewAll={false} />
    </div>
  );
}
