import Link from "next/link";
import { Activity, ArrowRight, Calendar, CalendarCheck2, HeartPulse, ShieldCheck, ShieldPlus, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils/cn";

const features = [
  { icon: CalendarCheck2, label: "Run clinic diabetes programmes from one workspace" },
  { icon: ShieldCheck, label: "Enroll patients into structured care plans" },
  { icon: HeartPulse, label: "Spot missed readings and urgent glucose alerts sooner" },
];

// CGM-style weekly readings. SCALE / target band drive the chart geometry.
const SCALE = 170;
const TARGET_LOW = 80;
const TARGET_HIGH = 140;
const weeklyGlucose = [
  { day: "Mo", value: 118, out: false },
  { day: "Tu", value: 143, out: true },
  { day: "We", value: 95, out: false },
  { day: "Th", value: 108, out: false },
  { day: "Fr", value: 129, out: false },
  { day: "Sa", value: 88, out: false },
  { day: "Su", value: 104, out: false },
];

export function HeroSection() {
  return (
    <section className="overflow-hidden py-6 sm:py-10 lg:py-14">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center lg:gap-12">
        <div className="space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Clinic-led diabetes continuity care
          </div>

          <div className="space-y-5">
            <h1 className="font-display text-4xl font-medium leading-[1.04] text-ink sm:text-5xl lg:text-[3.85rem]">
              Naje Health for{" "}
              <span className="italic text-primary">diabetes care teams</span>.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted sm:text-lg">
              Help clinics enroll diabetic patients, assign care teams, track monitoring schedules,
              respond to alerts, and keep patients clear on what they need to do today.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-text">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-primary ring-1 ring-primary/15">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/register" size="lg">
              Start a Programme
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/clinics" variant="secondary" size="lg">
              For Clinics
            </Button>
          </div>

          <p className="text-sm text-muted">
            Built for clinics, care coordinators, nurses, doctors, and patients managing diabetes together.{" "}
            <Link href="/clinics" className="font-medium text-primary underline-offset-4 hover:underline">
              See clinic workflow
            </Link>
          </p>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          {/* Clinical grid backdrop + registration corner marks frame the panel. */}
          <div className="clinical-grid grid-fade absolute -inset-5 -z-10 opacity-70" />
          <span className="absolute -left-2 -top-2 size-4 border-l border-t border-primary/40" />
          <span className="absolute -bottom-2 -right-2 size-4 border-b border-r border-primary/40" />

          <Card className="overflow-hidden rounded-2xl border-border/70 bg-white shadow-subtle">
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">
                    Clinic attention queue
                  </p>
                  <p className="text-lg font-semibold text-ink">Diabetes care today</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  Active programme
                </div>
              </div>

              {/* Glucose readout — deep clinical navy, monospace figures. */}
              <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-white">
                <div className="clinical-grid-light absolute inset-0 opacity-60" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Activity className="size-4" />
                      Cohort glucose signal
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/85 ring-1 ring-inset ring-white/15">
                      <TrendingDown className="size-3 text-success" />
                      In range
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="font-mono text-4xl font-medium tabular-nums tracking-tight text-white">
                      108
                    </p>
                    <p className="font-mono text-xs text-white/55">avg mg/dL, this week</p>
                  </div>

                  {/* Bars with a shaded target band (80–140 mg/dL). */}
                  <div className="mt-5">
                    <div className="relative h-24">
                      <div
                        className="absolute inset-x-0 rounded bg-success/20 ring-1 ring-inset ring-success/30"
                        style={{
                          bottom: `${(TARGET_LOW / SCALE) * 100}%`,
                          height: `${((TARGET_HIGH - TARGET_LOW) / SCALE) * 100}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-end gap-2">
                        {weeklyGlucose.map(({ value, out }, i) => (
                          <div key={i} className="flex flex-1 justify-center">
                            <div
                              className={cn(
                                "w-full max-w-[14px] rounded-sm",
                                out ? "bg-warning" : "bg-white/80",
                              )}
                              style={{ height: `${(value / SCALE) * 100}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {weeklyGlucose.map(({ day }, i) => (
                        <span
                          key={i}
                          className="flex-1 text-center font-mono text-[10px] text-white/45"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 font-mono text-[0.65rem] text-white/40">
                      target 80–140 mg/dL
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Calendar className="size-3.5 text-primary" />
                    Next care action
                  </div>
                  <p className="mt-2 font-mono text-sm tabular-nums text-muted">Review missed reading</p>
                  <div className="mt-3 h-1.5 rounded-full bg-primary/10">
                    <div className="h-1.5 w-2/3 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <ShieldPlus className="size-3.5 text-primary" />
                    Patient tasks
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Clear daily monitoring, visits, labs, and payment status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
