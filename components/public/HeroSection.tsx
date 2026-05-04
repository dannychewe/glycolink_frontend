import Link from "next/link";
import { Activity, ArrowRight, Calendar, CalendarCheck2, HeartPulse, ShieldCheck, ShieldPlus, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils/cn";

const features = [
  { icon: CalendarCheck2, label: "Book verified diabetes specialists online" },
  { icon: ShieldCheck, label: "Secure, private medical records" },
  { icon: HeartPulse, label: "Track your health progress over time" },
];

const weeklyGlucose = [
  { day: "M", value: 118, out: false },
  { day: "T", value: 143, out: true },
  { day: "W", value: 95, out: false },
  { day: "T", value: 108, out: false },
  { day: "F", value: 129, out: false },
  { day: "S", value: 88, out: false },
  { day: "S", value: 104, out: false },
];

export function HeroSection() {
  return (
    <section className="overflow-hidden py-6 sm:py-10 lg:py-14">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center lg:gap-12">
        <div className="space-y-8">
          <Badge variant="primary" className="bg-primary/8 text-primary">
            Digital care platform for diabetes management
          </Badge>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-text sm:text-5xl lg:text-6xl">
              Modern Diabetes Care,{" "}
              <span className="text-primary">Connected</span>
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted sm:text-lg">
              Consult verified healthcare providers, manage your condition, and stay in control
              — all from one platform built for Zambia.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-text">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/register" size="lg">
              Get Started
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/providers" variant="secondary" size="lg">
              Find a Provider
            </Button>
          </div>

          <p className="text-sm text-muted">
            Trusted by patients and specialists across Zambia.{" "}
            <Link href="/providers" className="font-medium text-primary underline-offset-4 hover:underline">
              Browse providers →
            </Link>
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-white to-success/15 blur-2xl" />
          <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-white/85 shadow-subtle backdrop-blur">
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Care overview</p>
                  <p className="text-lg font-semibold text-text">Patient dashboard</p>
                </div>
                <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  Live support
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-5 text-white shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Activity className="size-4" />
                    Weekly glucose
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90">
                    <TrendingUp className="size-3" />
                    Stable
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <p className="text-3xl font-semibold">108</p>
                  <p className="text-sm text-white/70">avg mg/dL this week</p>
                </div>
                <div className="mt-4 flex items-end gap-1.5">
                  {weeklyGlucose.map(({ day, value, out }) => (
                    <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={cn("w-full rounded-sm", out ? "bg-warning/80" : "bg-white/35")}
                        style={{ height: `${Math.round((value / 160) * 36)}px` }}
                      />
                      <span className="text-[9px] text-white/60">{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <Calendar className="size-3.5 text-primary" />
                    Next visit
                  </div>
                  <p className="mt-2 text-sm text-muted">Tue, 15 Apr · 09:30</p>
                  <div className="mt-3 h-1.5 rounded-full bg-primary/10">
                    <div className="h-1.5 w-2/3 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <ShieldPlus className="size-3.5 text-primary" />
                    Secure records
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Health data encrypted and organized in one place.
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
