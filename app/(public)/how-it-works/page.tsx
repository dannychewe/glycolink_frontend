import type { Metadata } from "next";
import {
  CalendarCheck2,
  ClipboardPlus,
  HeartPulse,
  UserRoundPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Naje Health Works | Diabetes Continuity Care",
  description:
    "Learn how Naje Health helps clinics run diabetes care programmes with enrolment, baselines, care plans, monitoring, alerts, reporting, and billing.",
};

const steps = [
  {
    icon: UserRoundPlus,
    step: "Step 1",
    title: "Create a clinic programme",
    description:
      "A clinic sets up a diabetes programme with enrolment rules, care-team roles, monitoring expectations, and billing configuration.",
  },
  {
    icon: CalendarCheck2,
    step: "Step 2",
    title: "Enroll the patient",
    description:
      "Patients can be enrolled directly or invited to join, then complete a diabetes baseline so the care team has the right context.",
  },
  {
    icon: ClipboardPlus,
    step: "Step 3",
    title: "Activate the care plan",
    description:
      "The team creates goals, follow-up timing, lab follow-up, medication review, patient instructions, and monitoring requirements.",
  },
  {
    icon: HeartPulse,
    step: "Step 4",
    title: "Work the attention queue",
    description:
      "The clinic sees missed monitoring, glucose alerts, open work, escalation, payment status, and reporting by programme.",
  },
];

const faqs = [
  {
    question: "Is Naje Health only for booking consultations?",
    answer:
      "No. Consultations still fit into the workflow, but Naje Health is now centred on clinic-led diabetes continuity care between visits.",
  },
  {
    question: "Is my health information kept private?",
    answer:
      "Yes. Programme records, baseline data, care plans, readings, alerts, and internal clinical notes follow tenant-scoped access rules.",
  },
  {
    question: "What types of diabetes does Naje Health support?",
    answer:
      "Naje Health is designed for patients managing Type 1 diabetes, Type 2 diabetes, gestational diabetes, prediabetes, and related conditions.",
  },
  {
    question: "Can I use Naje Health from my phone?",
    answer:
      "Yes. Patients can see what they need to do today, while care teams can review clinic queues from desktop or tablet workflows.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-16 py-10 sm:py-14">
      {/* Header */}
      <Container>
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            How it works
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Diabetes continuity care, from enrolment to daily follow-up
          </h1>
          <p className="text-base leading-7 text-muted">
            Naje Health helps clinics answer the operational question that matters every day:
            which diabetic patients need attention, and what should happen next?
          </p>
        </div>
      </Container>

      {/* Steps */}
      <Container>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <Card key={title} className="h-full border-border/80 bg-white/85">
              <CardHeader className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                    {step}
                  </p>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>

      {/* FAQ */}
      <Container>
        <div className="max-w-3xl space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              Common questions
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Frequently asked questions</h2>
          </div>

          <div className="divide-y divide-border/80">
            {faqs.map(({ question, answer }) => (
              <div key={question} className="py-5 space-y-2">
                <p className="text-base font-medium text-text">{question}</p>
                <p className="text-sm leading-7 text-muted">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* CTA */}
      <Container>
        <div className="rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary to-blue-500 px-6 py-10 text-center text-white shadow-subtle sm:px-10 sm:py-14">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to run structured diabetes follow-up?
            </h2>
            <p className="text-base leading-7 text-blue-50">
              Start with a clinic programme, enroll patients, and give both care teams and patients
              a clearer daily workflow.
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/register" size="lg" className="bg-white text-primary hover:bg-blue-50">
              Start a programme
            </Button>
            <Button
              href="/providers"
              size="lg"
              className="border border-white/30 bg-white/10 text-white hover:bg-white/15"
            >
              View care network
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
