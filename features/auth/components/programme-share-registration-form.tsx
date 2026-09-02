"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { CalendarCheck2, CheckCircle2, ClipboardList, CreditCard, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text">{share.programmeName}</p>
          {share.enrolmentOpen ? <Badge variant="primary">Open enrolment</Badge> : null}
        </div>
        {share.organizationName ? <p className="mt-1 text-xs text-muted">{share.organizationName}</p> : null}
        {share.programmeDescription ? (
          <p className="mt-3 text-sm leading-6 text-muted">{share.programmeDescription}</p>
        ) : null}
        <p className="mt-3 text-xs text-muted">
          {share.defaultDurationDays ?? "Open"} days, monitoring every {share.defaultMonitoringCadenceDays} day(s)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: ClipboardList, label: "Care plan", detail: "Your clinic keeps your diabetes plan in one place." },
          { icon: CalendarCheck2, label: "Follow-up", detail: "Book reviews and video visits with your programme consultant." },
          { icon: Stethoscope, label: "Care team", detail: "Doctors and coordinators can follow your progress." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-border bg-background px-3 py-3">
              <Icon className="size-4 text-primary" />
              <p className="mt-2 text-sm font-semibold text-text">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
            </div>
          );
        })}
      </div>

      {share.prices.length ? (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-sm font-semibold text-text">Programme packages</p>
              <p className="mt-1 text-xs leading-5 text-muted">Choose the package that matches your care plan after your account is created.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {share.prices.map((price) => (
              <div key={price.id} className="rounded-lg border border-border px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text">{price.name}</p>
                    {price.description ? <p className="mt-1 text-xs leading-5 text-muted">{price.description}</p> : null}
                  </div>
                  <p className="text-right text-sm font-semibold text-text">
                    {formatPrice(price.amount, price.currency)}
                    <span className="block text-xs font-normal text-muted">{billingLabel(price.billingModel, price.billingInterval)}</span>
                  </p>
                </div>
                {price.includedServiceSummary ? <p className="mt-2 text-xs leading-5 text-muted">{price.includedServiceSummary}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>Your enrolment is created as soon as this account is submitted.</span>
        </div>
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
          <Input id="programme-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </div>
        <Button type="submit" fullWidth disabled={joinState.loading || !fullName.trim() || !email.trim() || password.length < 8}>
          {joinState.loading ? "Joining..." : "Create account and join"}
        </Button>
      </form>
    </div>
  );
}
