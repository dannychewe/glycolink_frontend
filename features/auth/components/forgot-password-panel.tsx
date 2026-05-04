"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGraphQLErrorCode, useAuth } from "@/features/auth/auth-context";

type ForgotPasswordFormValues = {
  email: string;
};

export function ForgotPasswordPanel() {
  const { requestPasswordReset } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [debugResetToken, setDebugResetToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);
    setSubmitError(null);
    setDebugResetToken(null);

    try {
      const result = await requestPasswordReset(values.email);

      if (!result.success) {
        setSubmitError("Unable to process password reset right now.");
        return;
      }

      setSuccessMessage("If your email exists in our records, a reset link has been sent.");

      if (result.resetToken) {
        setDebugResetToken(result.resetToken);
      }
    } catch (error) {
      const code = getGraphQLErrorCode(error);
      if (code === "AUTH_USER_INACTIVE") {
        setSubmitError("This account is inactive.");
        return;
      }

      setSubmitError("Unable to process password reset right now.");
    }
  });

  return (
    <div className="space-y-5">
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

      {debugResetToken ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-text">
          Debug reset token:
          <div className="mt-2 break-all font-mono text-xs">{debugResetToken}</div>
          <div className="mt-3">
            <Link
              href={`/reset-password?token=${encodeURIComponent(debugResetToken)}`}
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Open debug reset link
            </Link>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            {...register("email", { required: true })}
          />
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : "Send reset link"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </div>
  );
}
