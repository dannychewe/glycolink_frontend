import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const stats = [
  { value: "Clinic", label: "Programme setup" },
  { value: "Daily", label: "Care-team queue" },
  { value: "Live", label: "Monitoring signals" },
];

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center text-white shadow-subtle sm:px-10 sm:py-16">
          {/* Clinical grid texture + measured hairline + registration marks */}
          <div className="clinical-grid-light grid-fade pointer-events-none absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <span className="pointer-events-none absolute left-5 top-5 size-4 border-l border-t border-white/25" />
          <span className="pointer-events-none absolute bottom-5 right-5 size-4 border-b border-r border-white/25" />

          <div className="relative mx-auto max-w-2xl space-y-4">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/55">
              Diabetes care programmes
            </p>
            <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Give every enrolled patient a clear next step
            </h2>
            <p className="text-base leading-7 text-white/70 sm:text-lg">
              Naje Health turns baseline assessment, care plans, monitoring schedules, alerts,
              reminders, reporting, and billing into one clinic-led diabetes workflow.
            </p>
          </div>

          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              href="/register"
              size="lg"
              className="bg-white text-primary hover:bg-blue-50"
            >
              Start a Programme
            </Button>
            <Button
              href="/clinics"
              size="lg"
              className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              For Clinics
            </Button>
          </div>

          <div className="relative mt-10 flex flex-col items-center justify-center gap-6 border-t border-white/15 pt-8 sm:flex-row sm:gap-12">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="font-mono text-2xl font-medium tabular-nums text-white">{value}</p>
                <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/55">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
