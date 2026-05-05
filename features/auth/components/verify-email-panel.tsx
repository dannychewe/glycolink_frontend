"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";

type VerificationState = "idle" | "verifying" | "success" | "expired" | "invalid" | "error";

export function VerifyEmailPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerification, user } = useAuth();

  const token = searchParams?.get("token") ?? null;
  const initialEmail = searchParams?.get("email") ?? user?.email ?? "";

  const [verificationState, setVerificationState] = useState<VerificationState>(
    token ? "verifying" : "idle",
  );
  const [email, setEmail] = useState(initialEmail);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Auto-verify when the user arrives via the email link (token in URL)
  useEffect(() => {
    if (!token) return;

    let active = true;

    void (async () => {
      try {
        const verifiedUser = await verifyEmail(token);
        if (!active) return;
        if (verifiedUser?.isVerified) {
          setVerificationState("success");
          window.setTimeout(() => router.replace("/auth/redirect"), 1500);
        } else {
          setVerificationState("error");
        }
      } catch (error) {
        if (!active) return;
        const code = getGraphQLErrorCode(error);
        if (code === "AUTH_EMAIL_VERIFICATION_EXPIRED") {
          setVerificationState("expired");
        } else if (code === "AUTH_EMAIL_VERIFICATION_INVALID") {
          setVerificationState("invalid");
        } else {
          setVerificationState("error");
        }
      }
    })();

    return () => { active = false; };
  }, [router, token, verifyEmail]);

  async function handleResend() {
    if (!email) {
      setResendMessage("Enter the email address linked to your account.");
      return;
    }
    setIsResending(true);
    setResendMessage(null);
    try {
      const result = await resendVerification(email);
      setResendMessage(
        result.success
          ? "A new verification email has been sent. Check your inbox."
          : "Unable to resend the verification email right now.",
      );
    } catch (error) {
      setResendMessage(getGraphQLErrorMessage(error, "Unable to resend the verification email right now."));
    } finally {
      setIsResending(false);
    }
  }

  const showResendForm =
    verificationState === "idle" ||
    verificationState === "expired" ||
    verificationState === "invalid" ||
    verificationState === "error";

  return (
    <div className="space-y-5">

      {/* Verifying in progress */}
      {verificationState === "verifying" ? (
        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-text">
          Verifying your email…
        </div>
      ) : null}

      {/* Success */}
      {verificationState === "success" ? (
        <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Email verified successfully. Redirecting to login…
        </div>
      ) : null}

      {/* Expired link */}
      {verificationState === "expired" ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          This verification link has expired. Request a new one below.
        </div>
      ) : null}

      {/* Invalid / already used */}
      {verificationState === "invalid" ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          This link is invalid or has already been used.
        </div>
      ) : null}

      {/* Generic error */}
      {verificationState === "error" ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Verification failed. Request a new link below.
        </div>
      ) : null}

      {/* No token — user just registered, waiting for email */}
      {verificationState === "idle" && !token ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm space-y-1">
          <p className="font-medium text-text">Check your inbox</p>
          <p className="text-muted">
            We sent a verification link to{" "}
            <strong>{initialEmail || "your email address"}</strong>.
            Click the link in that email to activate your account.
          </p>
        </div>
      ) : null}

      {/* Resend form — shown when no token or when link failed */}
      {showResendForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-text">
            {verificationState === "idle" ? "Didn't receive an email?" : "Request a new verification link"}
          </p>
          <div className="space-y-2">
            <Label htmlFor="verification-email">Email address</Label>
            <Input
              id="verification-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          {resendMessage ? (
            <p className="text-sm text-muted">{resendMessage}</p>
          ) : null}
          <Button
            type="button"
            onClick={() => void handleResend()}
            disabled={isResending}
            fullWidth
          >
            {isResending ? "Sending…" : "Resend verification email"}
          </Button>
        </div>
      ) : null}

      <Button href="/login" variant="secondary" fullWidth>
        Back to login
      </Button>
    </div>
  );
}
