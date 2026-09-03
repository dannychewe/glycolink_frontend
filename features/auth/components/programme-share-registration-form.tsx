"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody, PanelHeader, PanelList, PanelTitle } from "@/components/ui/panel";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  PUBLIC_PROGRAMME_SHARE_LINK_QUERY,
  REGISTER_FOR_PROGRAMME_SHARE_LINK_MUTATION,
  type PublicProgrammeShareLink,
} from "@/lib/programmes/graphql";

type PublicProgrammeShareData = {
  publicProgrammeShareLink: PublicProgrammeShareLink | null;
};

type JoinProgrammeResult = {
  registerForProgrammeShareLink: {
    user: { email: string };
    verificationRequired: boolean;
  };
};

function formatPrice(amount: string, currency: string) {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return `${currency} ${amount}`;
  }
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function billingLabel(model: string, interval?: string | null) {
  if (model === "MONTHLY") return "per month";
  if (model === "FIXED_PERIOD") return interval ? `for ${interval}` : "fixed package";
  return "once off";
}

const careJourneyEventLabels: Record<string, string> = {
  measurement_task: "Measurement task",
  consultant_review: "Consultant review",
  video_consultation: "Video consultation",
  medication_check: "Medication check",
  lab_reminder: "Lab reminder",
  education: "Education",
  care_team_check_in: "Care team check-in",
  payment_renewal: "Payment renewal",
  programme_review: "Programme review",
};

function careJourneyEventLabel(value: string) {
  return careJourneyEventLabels[value] ?? "Care team check-in";
}

function dayRangeLabel(day: number, endDay?: number | null) {
  if (endDay && endDay > day) return `Day ${day}-${endDay}`;
  return `Day ${day}`;
}

const fallbackJourneyItems = [
  { icon: Icons.records, label: "Care plan", detail: "Your clinic keeps your diabetes plan in one place." },
  { icon: Icons.appointments, label: "Follow-up", detail: "Book reviews and video visits with your programme consultant." },
  { icon: Icons.providers, label: "Care team", detail: "Doctors and coordinators can follow your progress." },
];

export function ProgrammeShareRegistrationForm({ token }: { token: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const shareQuery = useQuery<PublicProgrammeShareData>(PUBLIC_PROGRAMME_SHARE_LINK_QUERY, {
    variables: { token },
    fetchPolicy: "network-only",
  });
  const [joinProgramme, joinState] = useMutation<JoinProgrammeResult>(REGISTER_FOR_PROGRAMME_SHARE_LINK_MUTATION);
  const share = shareQuery.data?.publicProgrammeShareLink ?? null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const response = await joinProgramme({
        variables: {
          token,
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        },
      });
      const registeredEmail = response.data?.registerForProgrammeShareLink.user.email || email.trim();
      router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
    } catch (err) {
      setError(getGraphQLErrorMessage(err, "Unable to join this care plan right now."));
    }
  }

  if (shareQuery.loading) {
    return <p className="text-sm text-muted">Loading care plan...</p>;
  }

  if (shareQuery.error || !share) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        This care plan link is not available.
      </div>
    );
  }

  const sortedCareJourney = [...share.careJourneyPreview].sort((a, b) => a.day - b.day);

  return (
    <div className="grid gap-8 lg:grid-cols-5 lg:items-start">
      {/* Left: what the patient is joining */}
      <div className="space-y-8 lg:col-span-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-text">{share.programmeName}</h2>
            {share.enrolmentOpen ? <Badge variant="primary">Open enrolment</Badge> : null}
          </div>
          {share.organizationName ? <p className="mt-1 text-sm text-muted">{share.organizationName}</p> : null}
          {share.patientOffer || share.programmeDescription ? (
            <p className="mt-3 text-sm leading-6 text-muted">{share.patientOffer || share.programmeDescription}</p>
          ) : null}
          {share.whoItIsFor ? (
            <p className="mt-4 border-l-2 border-border pl-3 text-xs leading-5 text-muted">
              <span className="font-medium text-text">Who this is for: </span>
              {share.whoItIsFor}
            </p>
          ) : null}
          {share.whatHappensNext ? (
            <p className="mt-3 border-l-2 border-primary pl-3 text-xs leading-5 text-muted">
              <span className="font-medium text-text">After you join: </span>
              {share.whatHappensNext}
            </p>
          ) : null}
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          <div className="bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Programme length</p>
            <p className="mt-2 text-2xl font-semibold leading-none text-ink">
              {share.defaultDurationDays ?? "Open"}
              {share.defaultDurationDays ? <span className="ml-1 text-sm font-normal text-muted">days</span> : null}
            </p>
          </div>
          <div className="bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Monitoring cadence</p>
            <p className="mt-2 text-2xl font-semibold leading-none text-ink">
              {share.defaultMonitoringCadenceDays}
              <span className="ml-1 text-sm font-normal text-muted">
                day{share.defaultMonitoringCadenceDays === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>

        {sortedCareJourney.length ? (
          <Panel>
            <PanelHeader>
              <PanelTitle icon={Icons.appointments}>Your care journey</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <p className="text-xs leading-5 text-muted">What to expect after you join, day by day.</p>
              <ol className="relative mt-5 space-y-6 border-l border-border pl-6">
                {sortedCareJourney.map((item) => (
                  <li key={`${item.day}-${item.title}`} className="relative">
                    <span className="absolute -left-[27px] top-0.5 size-2.5 rounded-full border-2 border-primary bg-surface" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {dayRangeLabel(item.day, item.endDay)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-text">{item.title}</p>
                    <p className="text-xs text-muted">{careJourneyEventLabel(item.eventType)}</p>
                    {item.description ? <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p> : null}
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>
        ) : (
          <div className="grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
            {fallbackJourneyItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-text">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {share.prices.length ? (
          <Panel>
            <PanelHeader>
              <PanelTitle icon={Icons.billing}>Programme packages</PanelTitle>
            </PanelHeader>
            <PanelList>
              {share.prices.map((price) => (
                <div key={price.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{price.name}</p>
                    {price.description ? <p className="mt-1 text-xs leading-5 text-muted">{price.description}</p> : null}
                    {price.includedServiceSummary ? (
                      <p className="mt-1.5 text-xs leading-5 text-muted">{price.includedServiceSummary}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold text-text">
                    {formatPrice(price.amount, price.currency)}
                    <span className="block text-xs font-normal text-muted">{billingLabel(price.billingModel, price.billingInterval)}</span>
                  </p>
                </div>
              ))}
            </PanelList>
          </Panel>
        ) : null}
      </div>

      {/* Right: the account creation form, sticky alongside the pitch */}
      <div className="lg:sticky lg:top-24 lg:col-span-2">
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Icons.success}>Create your account</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-4">
            <p className="-mt-1 text-xs leading-5 text-muted">
              Your enrolment is created as soon as this account is submitted.
            </p>

            {error ? (
              <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
            ) : null}

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-1.5">
                <Label htmlFor="programme-full-name">Full name</Label>
                <Input id="programme-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-email">Email address</Label>
                <Input id="programme-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-phone">Phone</Label>
                <Input id="programme-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-password">Password</Label>
                <Input
                  id="programme-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" fullWidth disabled={joinState.loading || !fullName.trim() || !email.trim() || password.length < 8}>
                {joinState.loading ? "Joining..." : "Create account and join"}
              </Button>
            </form>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
