"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { ACCEPT_PROVIDER_ORGANIZATION_INVITE_MUTATION } from "@/lib/auth/graphql";

type FormValues = {
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  displayName: string;
  hpczNumber: string;
};

function mapInviteError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PROVIDER_INVITE_TOKEN_INVALID") return "This invitation link is invalid.";
  if (code === "INVITE_EXPIRED") return "This invitation has expired. Ask the organization admin to resend it.";
  if (code === "INVITE_NOT_PENDING") return "This invitation has already been accepted or reviewed.";
  if (code === "PROVIDER_PROFILE_REQUIRED") return "New providers must include a password, display name, and HPCZ number.";
  if (code === "HPCZ_ALREADY_EXISTS") return "That HPCZ number is already registered.";
  return getGraphQLErrorMessage(error, "Unable to accept this invitation. Please try again.");
}

export function AcceptProviderOrganizationInvitePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptInvite] = useMutation(ACCEPT_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      displayName: "",
      hpczNumber: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessMessage(null);
    if (!token) {
      setSubmitError("Invalid invitation link.");
      return;
    }
    if (values.password || values.confirmPassword) {
      if (values.password !== values.confirmPassword) {
        setSubmitError("Passwords do not match.");
        return;
      }
    }
    try {
      const { data } = await acceptInvite({
        variables: {
          token,
          password: values.password || undefined,
          fullName: values.fullName || undefined,
          phone: values.phone || undefined,
          displayName: values.displayName || undefined,
          hpczNumber: values.hpczNumber || undefined,
        },
      });
      const orgName = data?.acceptProviderOrganizationInvite?.invite?.organization?.name;
      setSuccessMessage(
        orgName
          ? `Invitation accepted for ${orgName}. The organization admin can now approve your membership.`
          : "Invitation accepted. The organization admin can now approve your membership.",
      );
      window.setTimeout(() => router.replace("/login"), 1800);
    } catch (error) {
      setSubmitError(mapInviteError(error));
    }
  });

  return (
    <div className="space-y-5">
      {!token ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Invalid invitation link. Please use the link from your email.
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {submitError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {successMessage}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" placeholder="Jane Doe" {...register("fullName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Provider display name</Label>
            <Input id="displayName" placeholder="Dr Jane Doe" {...register("displayName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hpczNumber">HPCZ number</Label>
            <Input id="hpczNumber" placeholder="HPCZ-12345" {...register("hpczNumber")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+260..." {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Required for new accounts"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type={showPassword ? "text" : "password"} {...register("confirmPassword")} />
          </div>
        </div>
        <Button type="submit" fullWidth disabled={isSubmitting || !token}>
          {isSubmitting ? "Accepting..." : "Accept invitation"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Log in
        </Link>
      </div>
    </div>
  );
}
