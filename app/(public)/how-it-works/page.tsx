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
  title: "How GlycoLink Works | Diabetes Care Platform",
  description:
    "Learn how GlycoLink connects patients with verified diabetes specialists in Zambia for structured, ongoing care.",
};

const steps = [
  {
    icon: UserRoundPlus,
    step: "Step 1",
    title: "Create your health profile",
    description:
      "Register in minutes and complete your diabetes profile — including your diagnosis, medications, and medical history. This gives your provider the context they need from your very first consultation.",
  },
  {
    icon: CalendarCheck2,
    step: "Step 2",
    title: "Choose a verified specialist",
    description:
      "Browse our directory of reviewed and approved healthcare providers. Filter by specialty, language, or consultation fee, and book directly from the provider's profile.",
  },
  {
    icon: ClipboardPlus,
    step: "Step 3",
    title: "Attend your consultation",
    description:
      "Connect with your provider through a structured care session. Your medical history, medications, and notes are all available in one place — so every visit builds on the last.",
  },
  {
    icon: HeartPulse,
    step: "Step 4",
    title: "Follow your care plan",
    description:
      "Receive clear guidance after each consultation. Track your health over time, review prescriptions, and stay connected to your care team between appointments.",
  },
];

const faqs = [
  {
    question: "Do I need a referral to book a consultation?",
    answer:
      "No. You can search for and book a provider directly through GlycoLink without a referral.",
  },
  {
    question: "Is my health information kept private?",
    answer:
      "Yes. Your medical records and consultation history are private and only accessible to you and the providers you choose to share them with.",
  },
  {
    question: "What types of diabetes does GlycoLink support?",
    answer:
      "GlycoLink supports patients managing Type 1 diabetes, Type 2 diabetes, gestational diabetes, prediabetes, and related conditions.",
  },
  {
    question: "Can I use GlycoLink from my phone?",
    answer:
      "Yes. GlycoLink is designed to work across all devices — phone, tablet, and desktop.",
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
            Structured diabetes care, from first visit to ongoing support
          </h1>
          <p className="text-base leading-7 text-muted">
            GlycoLink is built to make diabetes care feel manageable — not overwhelming. Here is
            how the process works, from creating your profile to staying connected with your
            provider.
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
              Ready to get started?
            </h2>
            <p className="text-base leading-7 text-blue-50">
              Create your account today and take the first step toward structured, consistent
              diabetes care.
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/register" size="lg" className="bg-white text-primary hover:bg-blue-50">
              Create your account
            </Button>
            <Button
              href="/providers"
              size="lg"
              className="border border-white/30 bg-white/10 text-white hover:bg-white/15"
            >
              Browse providers
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
