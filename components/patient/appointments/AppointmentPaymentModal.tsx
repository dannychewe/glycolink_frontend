"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { AppointmentActionModal } from "@/components/patient/appointments/AppointmentActionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CREATE_PAYMENT_INTENT_MUTATION,
  INITIATE_PAYMENT_MUTATION,
  MY_APPOINTMENT_PAYMENTS_QUERY,
  RETRY_PAYMENT_MUTATION,
} from "@/lib/payments/graphql";
import {
  INVALID_PHONE_MESSAGE,
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_POLL_TIMEOUT_MS,
  PAYMENT_RESEND_COOLDOWN_MS,
  describePaymentFailure,
  isValidPhone,
  mapPaymentError,
  normalizePhone,
} from "@/lib/payments/mobile-money";

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

type MyPaymentsData = {
  myAppointmentPayments: Array<{ id: string; status: string; failureReason: string | null }>;
};

type AppointmentPaymentModalProps = Readonly<{
  appointmentId: string;
  /** Live appointment status from the parent, used to detect confirmation. */
  appointmentStatus: string;
  /** Refetches the appointment so `appointmentStatus` updates. Resolves when done. */
  onRefetch: () => Promise<unknown>;
  onClose: () => void;
}>;

type Phase = "loadingIntent" | "enterPhone" | "processing" | "timedOut" | "confirmed" | "unavailable" | "error";

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

export function AppointmentPaymentModal({
  appointmentId,
  appointmentStatus,
  onRefetch,
  onClose,
}: AppointmentPaymentModalProps) {
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("loadingIntent");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  // Bumped on every (re)initiation so the wait/poll window restarts even if already processing.
  const [attempt, setAttempt] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentIdRef = useRef<string | null>(null);
  const intentRequestRef = useRef<ReturnType<typeof createIntent> | null>(null);
  const apolloClient = useApolloClient();

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

  // Create (or reuse) the payment intent when the modal opens. The request is shared through a ref so a
  // re-run of this effect (StrictMode, dependency churn) never sends a second create — the backend does not
  // lock here, so two concurrent creates would leave an orphan INITIATED payment behind.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        intentRequestRef.current ??= createIntent({ variables: { appointmentId } });
        const { data } = await intentRequestRef.current;
        if (cancelled) return;
        const created = data?.createPaymentIntent.paymentIntent ?? null;
        setIntent(created);
        intentIdRef.current = created?.id ?? null;
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

  // A declined/failed mobile-money payment never changes the appointment (it stays AWAITING_PAYMENT),
  // so the payment's own status has to be checked too. A FAILED intent can't be re-initiated, so
  // start a fresh one and send the patient back to the phone step.
  const checkPaymentFailed = useCallback(async () => {
    const intentId = intentIdRef.current;
    if (!intentId) return;
    try {
      const { data } = await apolloClient.query<MyPaymentsData>({
        query: MY_APPOINTMENT_PAYMENTS_QUERY,
        variables: { limit: 10 },
        fetchPolicy: "network-only",
      });
      const current = data.myAppointmentPayments.find((payment) => payment.id === intentId);
      if (!current || normalizeStatus(current.status) !== "FAILED") return;
      if (intentIdRef.current !== intentId) return;
      const { data: created } = await createIntent({ variables: { appointmentId } });
      const fresh = created?.createPaymentIntent.paymentIntent ?? null;
      if (!fresh) return;
      intentIdRef.current = fresh.id;
      setIntent(fresh);
      setErrorMessage(describePaymentFailure(current.failureReason));
      setPhase("enterPhone");
    } catch {
      // Best effort — the timeout still ends the wait if this check keeps failing.
    }
  }, [apolloClient, appointmentId, createIntent]);

  // While processing, poll the appointment; give up waiting after the timeout.
  useEffect(() => {
    if (phase !== "processing") return;
    const startedAt = Date.now();
    setCanResend(false);
    const resendTimer = setTimeout(() => setCanResend(true), PAYMENT_RESEND_COOLDOWN_MS);
    pollRef.current = setInterval(() => {
      if (Date.now() - startedAt >= PAYMENT_POLL_TIMEOUT_MS) {
        stopPolling();
        setPhase("timedOut");
        return;
      }
      void onRefetch();
      void checkPaymentFailed();
    }, PAYMENT_POLL_INTERVAL_MS);
    return () => {
      clearTimeout(resendTimer);
      stopPolling();
    };
  }, [phase, attempt, onRefetch, checkPaymentFailed, stopPolling]);

  // React to the polled appointment status. Only CONFIRMED means the payment went through;
  // any other status that is no longer AWAITING_PAYMENT (cancelled, rescheduled, ...) is not a success.
  useEffect(() => {
    if (phase !== "processing" && phase !== "timedOut") return;
    const status = normalizeStatus(appointmentStatus);
    if (status === "AWAITING_PAYMENT") return;
    stopPolling();
    if (status === "CONFIRMED") {
      setErrorMessage(null);
      setPhase("confirmed");
    } else {
      setErrorMessage(
        `This appointment is now ${status.toLowerCase().replace(/_/g, " ")} and can no longer be paid.`,
      );
      setPhase("unavailable");
    }
  }, [appointmentStatus, phase, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  async function handleSubmit() {
    if (isInitiating || !intent) return;
    if (!isValidPhone(phone)) {
      setErrorMessage(INVALID_PHONE_MESSAGE);
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
    if (isInitiating || isRetrying || !intent) return;
    if (!isValidPhone(phone)) {
      setErrorMessage(INVALID_PHONE_MESSAGE);
      return;
    }
    setErrorMessage(null);
    try {
      await retryPayment({ variables: { intentId: intent.id, phone: normalizePhone(phone) } });
      setAttempt((value) => value + 1);
      setPhase("processing");
    } catch (error) {
      setErrorMessage(mapPaymentError(error));
      // The earlier attempt may have failed after we stopped polling; if so this swaps in a fresh intent.
      await checkPaymentFailed();
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
          <div className="rounded-lg border border-border bg-background px-4 py-3">
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
                disabled={isRetrying || isInitiating || !canResend}
              >
                {isRetrying ? "Retrying..." : "Resend prompt"}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "timedOut" ? (
          <div className="space-y-4">
            <p className="text-sm text-text">
              We haven&apos;t received confirmation yet. If you approved the prompt, your appointment will
              update shortly — otherwise you can send a new prompt.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => void handleRetry()}
                disabled={isRetrying || isInitiating}
              >
                {isRetrying ? "Retrying..." : "Send new prompt"}
              </Button>
            </div>
          </div>
        ) : null}

        {(phase === "unavailable" || (phase === "error" && !intent)) ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Close
            </Button>
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
