"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGraphQLErrorCode, getGraphQLErrorMessage, useAuth } from "@/features/auth/auth-context";

type FormValues = {
  newPassword: string;
  confirmPassword: string;
};

export function AcceptPatientInvitePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams?.get("token") ?? null;
  // After activation, head to `next` (typically the invite-accept route) so the
  // patient can accept once authenticated. Only allow internal paths.
  const rawNext = searchParams?.get("next") ?? null;
  const nextPath = rawNext && rawNext.startsWith("/") ? rawNext : null;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);
    setSubmitError(null);

    if (!token) {
      setSubmitError("Invalid invite link.");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    try {
      const result = await resetPassword(token, values.newPassword);

      if (!result.success) {
        setSubmitError("Unable to activate your account. Please contact support.");
        return;
      }

      setSuccessMessage(
        nextPath ? "Account activated! Taking you to your invitation…" : "Account activated! Taking you to setup…",
      );
      window.setTimeout(() => router.replace(nextPath ?? "/patient/onboarding"), 1200);
    } catch (error) {
      const code = getGraphQLErrorCode(error);

      if (code === "AUTH_PASSWORD_RESET_EXPIRED") {
        setSubmitError(
          getGraphQLErrorMessage(
            error,
            "This invite link has expired. Ask your provider to resend the invitation.",
          ),
        );
        return;
      }

      if (code === "AUTH_PASSWORD_RESET_INVALID") {
        setSubmitError(
          getGraphQLErrorMessage(error, "This invite link is invalid or has already been used."),
        );
        return;
      }

      setSubmitError(getGraphQLErrorMessage(error, "Unable to activate your account. Please try again."));
    }
  });

  return (
    <div className="space-y-5">
      {!token ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Invalid invite link. Please use the link from your invitation email.
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
        <div className="space-y-2">
          <Label htmlFor="newPassword">Choose a password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-10"
              {...register("newPassword", { required: true, minLength: 8 })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-10"
              {...register("confirmPassword", { required: true })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"
              tabIndex={-1}
              aria-label={showPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting || !token}>
          {isSubmitting ? "Activating…" : "Activate account"}
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
