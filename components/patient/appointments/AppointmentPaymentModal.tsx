"use client";

// DORMANT: ready-to-activate mobile-money payment flow.
// Online payments are currently handled off-system (see PaymentsComingSoonNotice).
// The backend mutations this uses (createPaymentIntent / initiatePayment / retryPayment)
// already exist; re-wire this modal into AppointmentDetailView once PAYMENTS_ENABLED is live
// and the PawaPay gateway/webhook are configured.

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { AppointmentActionModal } from "@/components/patient/appointments/AppointmentActionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  CREATE_PAYMENT_INTENT_MUTATION,
  INITIATE_PAYMENT_MUTATION,
  RETRY_PAYMENT_MUTATION,
} from "@/lib/payments/graphql";

type PaymentIntent = {
  id: string;
  appointmentId: string;
  amount: string | number | null;
  currency: string | null;
  method: string | null;
  status: string;
  expiresAt: string | null;
  confirmedAt: string | null;
};

type CreatePaymentIntentData = {
  createPaymentIntent: { paymentIntent: PaymentIntent };
};

type InitiatePaymentData = {
  initiatePayment: { attempt: { id: string; status: string } };
};

type RetryPaymentData = {
  retryPayment: { attempt: { id: string; status: string } };
};

type AppointmentPaymentModalProps = Readonly<{
  appointmentId: string;
  /** Live appointment status from the parent, used to detect confirmation. */
  appointmentStatus: string;
  /** Refetches the appointment so `appointmentStatus` updates. Resolves when done. */
  onRefetch: () => Promise<unknown>;
  onClose: () => void;
}>;

const POLL_INTERVAL_MS = 4000;

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function formatAmount(amount: string | number | null, currency: string | null) {
  if (amount === null || amount === undefined) return "Amount on confirmation";
  const code = currency ?? "ZMW";
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(numeric)) return `${code} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency: code }).format(numeric);
  } catch {
    return `${code} ${numeric}`;
  }
}

function mapPaymentError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PAYMENT_INVALID_STATE") {
    return "This appointment can no longer be paid. Refresh and try again.";
  }
  if (code === "PAYMENT_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") {
    return "You do not have access to this payment.";
  }
  if (code === "PAYMENT_NOT_FOUND") return "Payment could not be found.";
  if (code === "PAYMENT_GATEWAY_ERROR") {
    return "The mobile money provider could not be reached. Please retry.";
  }
  return getGraphQLErrorMessage(error, "Unable to process the payment right now. Please try again.");
}

/** Accepts common Zambian formats and normalizes to digits (e.g. 26097xxxxxxx). */
function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("260")) return digits;
  if (digits.startsWith("0")) return `260${digits.slice(1)}`;
  if (digits.length === 9) return `260${digits}`;
  return digits;
}

function isValidPhone(raw: string) {
  const normalized = normalizePhone(raw);
  return /^260\d{9}$/.test(normalized);
}

export function AppointmentPaymentModal({
  appointmentId,
  appointmentStatus,
  onRefetch,
  onClose,
}: AppointmentPaymentModalProps) {
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<"loadingIntent" | "enterPhone" | "processing" | "confirmed" | "error">(
    "loadingIntent",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [createIntent] = useMutation<CreatePaymentIntentData>(CREATE_PAYMENT_INTENT_MUTATION);
  const [initiatePayment, { loading: isInitiating }] =
    useMutation<InitiatePaymentData>(INITIATE_PAYMENT_MUTATION);
  const [retryPayment, { loading: isRetrying }] = useMutation<RetryPaymentData>(RETRY_PAYMENT_MUTATION);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Create (or reuse) the payment intent when the modal opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await createIntent({ variables: { appointmentId } });
        if (cancelled) return;
        const created = data?.createPaymentIntent.paymentIntent ?? null;
        setIntent(created);
        if (created && normalizeStatus(created.status) === "CONFIRMED") {
          setPhase("confirmed");
        } else {
          setPhase("enterPhone");
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(mapPaymentError(error));
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, createIntent]);

  // While processing, poll the appointment until it leaves AWAITING_PAYMENT.
  useEffect(() => {
    if (phase !== "processing") return;
    pollRef.current = setInterval(() => {
      void onRefetch();
    }, POLL_INTERVAL_MS);
    return stopPolling;
  }, [phase, onRefetch, stopPolling]);

  // React to confirmation arriving via the polled appointment status.
  useEffect(() => {
    if (phase !== "processing") return;
    if (normalizeStatus(appointmentStatus) !== "AWAITING_PAYMENT") {
      stopPolling();
      setPhase("confirmed");
    }
  }, [appointmentStatus, phase, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  async function handleSubmit() {
    if (!intent || !isValidPhone(phone)) {
      setErrorMessage("Enter a valid mobile money number.");
      return;
    }
    setErrorMessage(null);
    try {
      await initiatePayment({
        variables: { intentId: intent.id, phone: normalizePhone(phone) },
      });
      setPhase("processing");
    } catch (error) {
      setErrorMessage(mapPaymentError(error));
    }
  }

  async function handleRetry() {
    if (!intent || !isValidPhone(phone)) {
      setErrorMessage("Enter a valid mobile money number to retry.");
      return;
    }
    setErrorMessage(null);
    try {
      await retryPayment({ variables: { intentId: intent.id, phone: normalizePhone(phone) } });
      setPhase("processing");
    } catch (error) {
      setErrorMessage(mapPaymentError(error));
    }
  }

  const amountLabel = intent ? formatAmount(intent.amount, intent.currency) : "";

  return (
    <AppointmentActionModal
      title="Pay for appointment"
      isLoading={isInitiating || isRetrying}
      onClose={onClose}
      showFooterActions={false}
    >
      <div className="space-y-5">
        {intent ? (
          <div className="rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted">Amount due</p>
            <p className="text-xl font-semibold text-text">{amountLabel}</p>
          </div>
        ) : null}

        {phase === "loadingIntent" ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Preparing payment...
          </div>
        ) : null}

        {(phase === "enterPhone" || phase === "error") && intent ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="payment-phone">Mobile money number</Label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="payment-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="097 000 0000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted">
                You will receive a prompt on your phone to approve the payment.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSubmit()} disabled={isInitiating}>
                {isInitiating ? "Sending..." : "Pay now"}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "processing" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-text">
              <Loader2 className="size-4 animate-spin text-primary" />
              Waiting for you to approve the prompt on your phone...
            </div>
            <p className="text-xs text-muted">
              This can take up to a minute. Keep this window open — it updates automatically once payment is confirmed.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleRetry()}
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Resend prompt"}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "confirmed" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-5" />
              Payment confirmed. Your appointment is being finalized.
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </AppointmentActionModal>
  );
}
