import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const stats = [
  { value: "120+", label: "Verified specialists" },
  { value: "24/7", label: "Platform access" },
  { value: "98%", label: "Patient satisfaction" },
];

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary to-blue-500 px-6 py-12 text-center text-white shadow-subtle sm:px-10 sm:py-16">
          {/* Decorative rings */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-52 rounded-full border border-white/10" />

          <div className="relative mx-auto max-w-2xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-blue-200">
              Get started today
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your diabetes care, structured and connected
            </h2>
            <p className="text-base leading-7 text-blue-100 sm:text-lg">
              Move from uncertainty to structured support with a healthcare experience designed for
              consistency, clarity, and modern access.
            </p>
          </div>

          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              href="/register"
              size="lg"
              className="bg-white text-primary hover:bg-blue-50"
            >
              Get Started Free
            </Button>
            <Button
              href="/providers"
              size="lg"
              className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              Browse Providers
            </Button>
          </div>

          <div className="relative mt-10 flex flex-col items-center justify-center gap-6 border-t border-white/15 pt-8 sm:flex-row sm:gap-10">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="mt-0.5 text-sm text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
