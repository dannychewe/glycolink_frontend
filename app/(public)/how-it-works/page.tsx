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
    "Learn how Naje Health enrols you into a diabetes programme with a personalised care plan, monitoring schedule, glucose alerts, and a dedicated care team.",
};

const steps = [
  {
    icon: UserRoundPlus,
    step: "Step 1",
    title: "Register with Naje Health",
    description:
      "Create your account, or accept an invitation from our care team. You'll complete a diabetes baseline so we have the right context.",
  },
  {
    icon: CalendarCheck2,
    step: "Step 2",
    title: "Get enrolled in a programme",
    description:
      "Our care team enrols you into a Naje Health diabetes programme matched to your needs, with monitoring expectations and follow-up cadence.",
  },
  {
    icon: ClipboardPlus,
    step: "Step 3",
    title: "Receive your care plan",
    description:
      "Your team creates goals, follow-up timing, lab reviews, medication checks, daily tasks, and monitoring requirements personalised to you.",
  },
  {
    icon: HeartPulse,
    step: "Step 4",
    title: "Stay on track, every day",
    description:
      "Log readings, complete your daily tasks, and stay connected — your Naje Health team monitors your progress and responds to alerts.",
  },
];

const faqs = [
  {
    question: "Is Naje Health only for booking consultations?",
    answer:
      "No. Consultations are part of the journey, but Naje Health is centred on structured diabetes continuity care between visits — monitoring, care plans, and daily follow-up.",
  },
  {
    question: "Is my health information kept private?",
    answer:
      "Yes. Your programme records, baseline data, care plans, readings, alerts, and clinical notes are kept private and only visible to your Naje Health care team.",
  },
  {
    question: "What types of diabetes does Naje Health support?",
    answer:
      "Naje Health supports patients managing Type 1 diabetes, Type 2 diabetes, gestational diabetes, prediabetes, and related conditions.",
  },
  {
    question: "Can I use Naje Health from my phone?",
    answer:
      "Yes. You can see what you need to do today, log readings, and stay connected with your care team from any device.",
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
            Naje Health helps you stay on top of your diabetes with a structured programme,
            a dedicated care team, and clear guidance on what to do every day.
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
              Ready to take control of your diabetes care?
            </h2>
            <p className="text-base leading-7 text-blue-50">
              Join a Naje Health programme and get a personalised care plan, monitoring schedule,
              and a dedicated team that follows up with you every day.
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/register" size="lg" className="bg-white text-primary hover:bg-blue-50">
              Join a programme
            </Button>
            <Button
              href="/our-team"
              size="lg"
              className="border border-white/30 bg-white/10 text-white hover:bg-white/15"
            >
              Meet our team
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
